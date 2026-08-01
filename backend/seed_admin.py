"""Seed the first admin user into the database.

Usage (from repo root, with venv + PYTHONPATH):
    $env:DATABASE_URL = "<postgres url>"
    $env:SEED_USERNAME = "admin"
    $env:SEED_EMAIL = "admin@vitalit.local"
    $env:SEED_PASSWORD = "admin123"
    $env:SEED_ROLE = "admin"
    .\venv\Scripts\python.exe backend\seed_admin.py

The default role credentials mirror the demo mapping used by the auth router
(admin/admin123) so the seeded account works out of the box.
"""
import os

from passlib.context import CryptContext

from backend import models
from backend.core.config import settings
from backend.core.database import SessionLocal

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_admin(
    username: str,
    email: str,
    password: str,
    role: str = "admin",
) -> None:
    db = SessionLocal()
    try:
        existing = (
            db.query(models.User).filter(models.User.username == username).first()
        )
        if existing:
            existing.email = email
            existing.role = role
            existing.is_active = True
            existing.hashed_password = pwd_context.hash(password)
            db.commit()
            print(f"Updated existing user '{username}' (id={existing.id}, role={role})")
            return

        user = models.User(
            username=username,
            email=email,
            hashed_password=pwd_context.hash(password),
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(
            f"Created user '{username}' (id={user.id}, role={role}, "
            f"is_active={user.is_active})"
        )
    finally:
        db.close()


if __name__ == "__main__":
    username = os.environ.get("SEED_USERNAME", "admin")
    email = os.environ.get("SEED_EMAIL", "admin@vitalit.com")
    password = os.environ.get("SEED_PASSWORD", "admin123")
    role = os.environ.get("SEED_ROLE", "admin")

    print(f"Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    seed_admin(username, email, password, role)
    print("Seed complete.")
