from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    safe_decode_token,
    verify_password,
)
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, TokenResponse, UserResponse


class AuthService:
    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)

    def _tokens_for(self, user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user.id, {"role": user.role.value}),
            refresh_token=create_refresh_token(user.id),
        )

    def _to_response(self, user: User) -> AuthResponse:
        return AuthResponse(user=UserResponse.model_validate(user), tokens=self._tokens_for(user))

    def register(self, email: str, password: str, full_name: str) -> AuthResponse:
        if self.users.get_by_email(email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        user = self.users.create(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=UserRole.USER,
        )
        return self._to_response(user)

    def login(self, email: str, password: str) -> AuthResponse:
        user = self.users.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
        return self._to_response(user)

    def refresh(self, refresh_token: str) -> TokenResponse:
        payload = safe_decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        user = self.users.get_by_id(str(payload["sub"]))
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        return self._tokens_for(user)

    def ensure_admin(self, email: str, password: str, full_name: str) -> User:
        existing = self.users.get_by_email(email)
        if existing:
            return existing
        return self.users.create(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=UserRole.ADMIN,
        )
