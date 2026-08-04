import os

# Configure a dedicated in-memory-style test database before any backend import.
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "sqlite:///./test_vitalit.db"
os.environ["TESTING"] = "true"
os.environ["DEV_MODE"] = "false"

import pytest
from fastapi.testclient import TestClient

from backend.core.config import settings
from backend.models import Base, User
from backend.core.database import engine, SessionLocal
from backend.main import app

# Enable the relaxed auth mode used across the backend for tests.
settings.test_mode = True


@pytest.fixture(scope="function")
def client():
    """TestClient with fresh tables and a seeded admin user (id=1).

    A persisted user with id=1 is required because the audit logger writes
    `user_id` foreign keys and the dev login shortcut issues tokens for user 1.
    """
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        if not session.query(User).filter(User.id == 1).first():
            session.add(
                User(
                    id=1,
                    username="admin",
                    email="admin@vitalit.com",
                    hashed_password="$2b$12$not.a.real.hash.placeholder",  # unused in test mode
                    role="admin",
                    is_active=True,
                )
            )
            session.commit()
    finally:
        session.close()

    with TestClient(app) as c:
        yield c

    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def auth_headers(client):
    """Authenticate using the dev role shortcut and return bearer headers."""
    resp = client.post("/auth/login", data={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}