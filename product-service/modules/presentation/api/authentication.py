import os
import logging
from dataclasses import dataclass
from typing import Optional, Tuple

import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)


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
        logger.debug(f"[JWT Auth] Authorization header present: {bool(auth)}")
        
        if not auth or not auth.startswith("Bearer "):
            logger.debug(f"[JWT Auth] No Bearer token found, returning None")
            return None

        token = auth.replace("Bearer ", "", 1).strip()
        if not token:
            logger.debug(f"[JWT Auth] Bearer token is empty, returning None")
            return None

        logger.debug(f"[JWT Auth] Token found: {token[:20]}...{token[-20:] if len(token) > 40 else ''}")

        secret = os.getenv("JWT_SECRET_KEY") or os.getenv("DJANGO_SECRET_KEY") or os.getenv("SECRET_KEY")
        if not secret:
            logger.error("[JWT Auth] JWT secret is not configured")
            raise AuthenticationFailed("JWT secret is not configured")

        logger.debug(f"[JWT Auth] Using secret (len={len(secret)})")
        algorithms = [os.getenv("JWT_ALGORITHM", "HS256")]

        try:
            payload = jwt.decode(token, secret, algorithms=algorithms)
            logger.debug(f"[JWT Auth] Token decoded successfully. Payload: {payload}")
        except jwt.ExpiredSignatureError as exc:
            logger.warning(f"[JWT Auth] Token expired: {exc}")
            raise AuthenticationFailed("Token has expired") from exc
        except jwt.InvalidTokenError as exc:
            logger.warning(f"[JWT Auth] Invalid token: {exc}")
            raise AuthenticationFailed("Invalid token") from exc

        user_id = payload.get("user_id") or payload.get("sub") or payload.get("id")
        if not user_id:
            logger.warning(f"[JWT Auth] Token missing user_id/sub/id. Payload keys: {list(payload.keys())}")
            raise AuthenticationFailed("Token missing user_id")

        role = payload.get("role")
        # Populate staff/admin flags from token claims, with role fallbacks
        is_staff = bool(payload.get("is_staff") or payload.get("staff") or (str(role).lower() == "staff"))
        is_superuser = bool(payload.get("is_superuser") or payload.get("is_admin") or (str(role).lower() == "admin"))

        logger.debug(f"[JWT Auth] Extracted flags - user_id={user_id}, role={role}, is_staff={is_staff}, is_superuser={is_superuser}")

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

