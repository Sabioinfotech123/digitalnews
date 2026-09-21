from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AdminUserCreate, AdminUserUpdate, UserResponse


class AdminUserService:
    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)

    def list(self, search: str | None = None) -> list[UserResponse]:
        return [UserResponse.model_validate(user) for user in self.users.list(search)]

    def create(self, payload: AdminUserCreate) -> UserResponse:
        if self.users.get_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        user = self.users.create(
            email=payload.email,
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
            role=payload.role,
            is_active=payload.is_active,
        )
        return UserResponse.model_validate(user)

    def update(self, user_id: str, payload: AdminUserUpdate, actor: User) -> UserResponse:
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        data = payload.model_dump(exclude_unset=True)
        if "email" in data and data["email"]:
            email = str(data["email"]).lower()
            existing = self.users.get_by_email(email)
            if existing and existing.id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
            user.email = email
        if "full_name" in data and data["full_name"] is not None:
            user.full_name = data["full_name"]
        if "role" in data and data["role"] is not None:
            if user.id == actor.id and data["role"] != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot remove your own admin role",
                )
            user.role = data["role"]
        if "is_active" in data and data["is_active"] is not None:
            if user.id == actor.id and data["is_active"] is False:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot deactivate your own account",
                )
            user.is_active = data["is_active"]
        if "password" in data and data["password"]:
            user.password_hash = hash_password(data["password"])

        return UserResponse.model_validate(self.users.update(user))

    def delete(self, user_id: str, actor: User) -> None:
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if user.id == actor.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")
        self.users.soft_delete(user)
