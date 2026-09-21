from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email.lower(), User.deleted_at.is_(None)))

    def get_by_id(self, user_id: str) -> User | None:
        return self.db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))

    def count_all(self) -> int:
        return len(self.db.scalars(select(User).where(User.deleted_at.is_(None))).all())

    def list(self, search: str | None = None) -> list[User]:
        query = select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc())
        if search:
            term = f"%{search.strip().lower()}%"
            query = query.where(
                or_(
                    User.email.ilike(term),
                    User.full_name.ilike(term),
                )
            )
        return list(self.db.scalars(query).all())

    def create(
        self,
        *,
        email: str,
        password_hash: str,
        full_name: str,
        role: UserRole = UserRole.USER,
        is_active: bool = True,
    ) -> User:
        user = User(
            email=email.lower(),
            password_hash=password_hash,
            full_name=full_name,
            role=role,
            is_active=is_active,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        user.updated_at = datetime.now(timezone.utc)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def soft_delete(self, user: User) -> None:
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        user.updated_at = datetime.now(timezone.utc)
        self.db.add(user)
        self.db.commit()
