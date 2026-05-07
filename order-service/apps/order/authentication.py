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

        return JWTUser(id=str(user_id), role=payload.get("role")), token

