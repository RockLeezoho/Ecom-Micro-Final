#!/usr/bin/env python3
import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple


@dataclass
class CaseResult:
    name: str
    status_code: int
    expected: str
    ok: bool
    details: str = ""


def request_json(
    base_url: str,
    method: str,
    path: str,
    payload: Optional[Dict[str, Any]] = None,
    token: Optional[str] = None,
) -> Tuple[int, Any]:
    url = f"{base_url.rstrip('/')}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = None
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                data = text
            return resp.status, data
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="ignore")
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            data = text
        return exc.code, data


def get_token(payload: Any) -> str:
    if not isinstance(payload, dict):
        return ""

    # Management login currently returns nested access_token.
    nested = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    return str(nested.get("access_token") or payload.get("access") or "")


def expect_code(name: str, code: int, expected_codes: Tuple[int, ...]) -> CaseResult:
    ok = code in expected_codes
    expected = "/".join(str(c) for c in expected_codes)
    return CaseResult(name=name, status_code=code, expected=expected, ok=ok)


def payload_has_id(payload: Any, object_id: str) -> bool:
    if isinstance(payload, dict):
        if str(payload.get("id", "")) == object_id:
            return True
        for value in payload.values():
            if payload_has_id(value, object_id):
                return True
        return False
    if isinstance(payload, list):
        return any(payload_has_id(item, object_id) for item in payload)
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test management APIs in user-service")
    parser.add_argument("--base-url", default="http://localhost:8001")
    parser.add_argument(
        "--mode",
        choices=["role-only", "full-crud"],
        default="full-crud",
        help="role-only: authz/authn checks only; full-crud: include admin CRUD on staffs/customers",
    )
    parser.add_argument("--admin-username", default="admin_boss")
    parser.add_argument("--admin-password", default="password123")
    parser.add_argument("--staff-username", default="staff_kane")
    parser.add_argument("--staff-password", default="password123")
    parser.add_argument("--customer-username", default="customer_john")
    parser.add_argument("--customer-password", default="password123")
    args = parser.parse_args()

    results = []

    code, payload = request_json(
        args.base_url,
        "POST",
        "/api/management/auth/login/admin/",
        {"username": args.admin_username, "password": args.admin_password},
    )
    admin_token = get_token(payload)
    results.append(expect_code("admin login via /auth/login/admin", code, (200,)))
    if not admin_token:
        results.append(
            CaseResult(
                name="admin login token present",
                status_code=code,
                expected="token",
                ok=False,
                details="Missing access token in login response",
            )
        )

    code, payload = request_json(
        args.base_url,
        "POST",
        "/api/management/auth/login/staff/",
        {"username": args.staff_username, "password": args.staff_password},
    )
    staff_token = get_token(payload)
    results.append(expect_code("staff login via /auth/login/staff", code, (200,)))
    if not staff_token:
        results.append(
            CaseResult(
                name="staff login token present",
                status_code=code,
                expected="token",
                ok=False,
                details="Missing access token in login response",
            )
        )

    code, _ = request_json(
        args.base_url,
        "POST",
        "/api/management/auth/login/admin/",
        {"username": args.staff_username, "password": args.staff_password},
    )
    results.append(expect_code("staff denied on admin login", code, (403,)))

    code, _ = request_json(
        args.base_url,
        "POST",
        "/api/management/auth/login/staff/",
        {"username": args.customer_username, "password": args.customer_password},
    )
    results.append(expect_code("customer denied on staff login", code, (403,)))

    if admin_token:
        code, _ = request_json(
            args.base_url,
            "GET",
            "/api/management/users/",
            token=admin_token,
        )
        results.append(expect_code("admin can list management users", code, (200,)))

        code, _ = request_json(
            args.base_url,
            "GET",
            "/api/management/me/admin/",
            token=admin_token,
        )
        results.append(expect_code("admin can access /me/admin", code, (200,)))

        code, _ = request_json(
            args.base_url,
            "GET",
            "/api/management/me/staff/",
            token=admin_token,
        )
        results.append(expect_code("admin denied on /me/staff", code, (403,)))

        if args.mode == "full-crud":
            ts = int(time.time())

            # Staff CRUD via admin token
            staff_payload = {
                "username": f"smoke_staff_{ts}",
                "password": "SmokePass123!",
                "email": f"smoke_staff_{ts}@example.com",
                "phone_number": "0901000001",
                "first_name": "Smoke",
                "last_name": "Staff",
                "employment_type": "Full-time",
                "is_active": True,
            }
            code, payload = request_json(
                args.base_url,
                "POST",
                "/api/management/staffs/",
                payload=staff_payload,
                token=admin_token,
            )
            results.append(expect_code("admin can create staff", code, (201,)))
            staff_id = str(payload.get("id")) if isinstance(payload, dict) and payload.get("id") else ""
            if not staff_id:
                results.append(
                    CaseResult(
                        name="created staff has id",
                        status_code=code,
                        expected="id",
                        ok=False,
                        details="Missing staff id in create response",
                    )
                )

            code, payload = request_json(
                args.base_url,
                "GET",
                "/api/management/staffs/",
                token=admin_token,
            )
            list_ok = code == 200 and (not staff_id or payload_has_id(payload, staff_id))
            results.append(
                CaseResult(
                    name="admin can list staffs (includes created staff)",
                    status_code=code,
                    expected="200 + created id present",
                    ok=list_ok,
                )
            )

            if staff_id:
                code, _ = request_json(
                    args.base_url,
                    "PUT",
                    f"/api/management/staffs/{staff_id}/",
                    payload={"employment_type": "Part-time", "first_name": "Updated"},
                    token=admin_token,
                )
                results.append(expect_code("admin can update staff", code, (200,)))

                code, _ = request_json(
                    args.base_url,
                    "DELETE",
                    f"/api/management/staffs/{staff_id}/",
                    token=admin_token,
                )
                results.append(expect_code("admin can delete staff", code, (204,)))

            # Customer CRUD via admin token
            customer_payload = {
                "username": f"smoke_customer_{ts}",
                "password": "SmokePass123!",
                "email": f"smoke_customer_{ts}@example.com",
                "phone_number": "0901000002",
                "first_name": "Smoke",
                "last_name": "Customer",
                "height": 170,
                "weight": 65,
                "foot_length": 26,
                "is_active": True,
            }
            code, payload = request_json(
                args.base_url,
                "POST",
                "/api/management/customers/",
                payload=customer_payload,
                token=admin_token,
            )
            results.append(expect_code("admin can create customer", code, (201,)))
            customer_id = str(payload.get("id")) if isinstance(payload, dict) and payload.get("id") else ""
            if not customer_id:
                results.append(
                    CaseResult(
                        name="created customer has id",
                        status_code=code,
                        expected="id",
                        ok=False,
                        details="Missing customer id in create response",
                    )
                )

            code, payload = request_json(
                args.base_url,
                "GET",
                "/api/management/customers/",
                token=admin_token,
            )
            customer_list_ok = code == 200 and (not customer_id or payload_has_id(payload, customer_id))
            results.append(
                CaseResult(
                    name="admin can list customers (includes created customer)",
                    status_code=code,
                    expected="200 + created id present",
                    ok=customer_list_ok,
                )
            )

            if customer_id:
                code, _ = request_json(
                    args.base_url,
                    "PUT",
                    f"/api/management/customers/{customer_id}/",
                    payload={"height": 168, "weight": 63, "is_active": False},
                    token=admin_token,
                )
                results.append(expect_code("admin can update customer", code, (200,)))

                code, _ = request_json(
                    args.base_url,
                    "DELETE",
                    f"/api/management/customers/{customer_id}/",
                    token=admin_token,
                )
                results.append(expect_code("admin can delete customer", code, (204,)))

    if staff_token:
        code, _ = request_json(
            args.base_url,
            "GET",
            "/api/management/users/",
            token=staff_token,
        )
        results.append(expect_code("staff denied on management users", code, (403,)))

        code, _ = request_json(
            args.base_url,
            "GET",
            "/api/management/me/staff/",
            token=staff_token,
        )
        results.append(expect_code("staff can access /me/staff", code, (200,)))

        code, _ = request_json(
            args.base_url,
            "GET",
            "/api/management/me/admin/",
            token=staff_token,
        )
        results.append(expect_code("staff denied on /me/admin", code, (403,)))

    print("Management smoke test results:")
    failed = 0
    for item in results:
        marker = "PASS" if item.ok else "FAIL"
        print(
            f"- [{marker}] {item.name}: got {item.status_code}, expected {item.expected}"
        )
        if item.details:
            print(f"  details: {item.details}")
        if not item.ok:
            failed += 1

    print(f"\nSummary: {len(results) - failed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
