import os
from dataclasses import dataclass
from typing import Optional, Tuple

import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


@dataclass
class JWTUser:
    id: str
    role: Optional[str] = None
    is_staff: bool = False
    is_superuser: bool = False

    @property
    def is_authenticated(self) -> bool:
        return True


class JWTBearerAuthentication(BaseAuthentication):
    def authenticate(self, request) -> Optional[Tuple[JWTUser, str]]:
        auth = request.headers.get("Authorization") or ""
        if not auth or not auth.startswith("Bearer "):
            return None

        token = auth.replace("Bearer ", "", 1).strip()
        if not token:
            return None

        secret = os.getenv("JWT_SECRET_KEY") or os.getenv("DJANGO_SECRET_KEY") or os.getenv("SECRET_KEY")
        if not secret:
            raise AuthenticationFailed("JWT secret is not configured")

        algorithms = [os.getenv("JWT_ALGORITHM", "HS256")]

        try:
            payload = jwt.decode(token, secret, algorithms=algorithms)
        except jwt.ExpiredSignatureError as exc:
            raise AuthenticationFailed("Token has expired") from exc
        except jwt.InvalidTokenError as exc:
            raise AuthenticationFailed("Invalid token") from exc

        user_id = payload.get("user_id") or payload.get("sub") or payload.get("id")
        if not user_id:
            raise AuthenticationFailed("Token missing user_id")

        role = payload.get("role")
        # Populate staff/admin flags from token claims, with role fallbacks
        is_staff = bool(payload.get("is_staff") or payload.get("staff") or (str(role).lower() == "staff"))
        is_superuser = bool(payload.get("is_superuser") or payload.get("is_admin") or (str(role).lower() == "admin"))

        return JWTUser(id=str(user_id), role=role, is_staff=is_staff, is_superuser=is_superuser), token


class InternalServiceAuthentication(BaseAuthentication):
    """Authenticate trusted internal service calls via X-Service-Token header."""

    def authenticate(self, request) -> Optional[Tuple[JWTUser, str]]:
        token = (request.headers.get("X-Service-Token") or "").strip()
        if not token:
            return None

        expected = (os.getenv("INTERNAL_SERVICE_TOKEN") or "").strip()
        if not expected:
            raise AuthenticationFailed("Internal service token is not configured")
        if token != expected:
            raise AuthenticationFailed("Invalid internal service token")

        return JWTUser(id="internal-service", role="service"), token

