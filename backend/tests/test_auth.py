class TestAuthentication:
    def test_register_user_success(self, client):
        resp = client.post(
            "/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "SecurePass123!",
                "role": "staff",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert "hashed_password" not in data

    def test_register_duplicate_username(self, client):
        payload = {
            "username": "dupuser",
            "email": "dup1@example.com",
            "password": "SecurePass123!",
            "role": "staff",
        }
        assert client.post("/auth/register", json=payload).status_code == 201
        assert client.post("/auth/register", json=payload).status_code == 400

    def test_register_weak_password(self, client):
        resp = client.post(
            "/auth/register",
            json={
                "username": "weakuser",
                "email": "weak@example.com",
                "password": "123",
                "role": "staff",
            },
        )
        assert resp.status_code == 422

    def test_register_invalid_email(self, client):
        resp = client.post(
            "/auth/register",
            json={
                "username": "badmail",
                "email": "not-an-email",
                "password": "SecurePass123!",
                "role": "staff",
            },
        )
        assert resp.status_code == 422

    def test_register_invalid_role(self, client):
        resp = client.post(
            "/auth/register",
            json={
                "username": "badrole",
                "email": "role@example.com",
                "password": "SecurePass123!",
                "role": "superuser",
            },
        )
        assert resp.status_code == 422

    def test_login_success_dev_credentials(self, client):
        resp = client.post("/auth/login", data={"username": "admin", "password": "admin123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client):
        resp = client.post(
            "/auth/login", data={"username": "nobody", "password": "wrongpassword"}
        )
        assert resp.status_code == 401

    def test_get_current_user(self, client, auth_headers):
        resp = client.get("/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "admin"

    def test_get_current_user_invalid_token(self, client):
        resp = client.get("/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
        assert resp.status_code == 401

    def test_change_password(self, client):
        """Change password for a real registered user."""
        client.post(
            "/auth/register",
            json={
                "username": "pwuser",
                "email": "pwuser@example.com",
                "password": "SecurePass123!",
                "role": "staff",
            },
        )
        login = client.post(
            "/auth/login", data={"username": "pwuser", "password": "SecurePass123!"}
        )
        assert login.status_code == 200
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        resp = client.post(
            "/auth/change-password",
            json={"current_password": "SecurePass123!", "new_password": "NewSecurePass456!"},
            headers=headers,
        )
        assert resp.status_code == 200

    def test_change_password_wrong_current(self, client):
        client.post(
            "/auth/register",
            json={
                "username": "pwuser2",
                "email": "pwuser2@example.com",
                "password": "SecurePass123!",
                "role": "staff",
            },
        )
        login = client.post(
            "/auth/login", data={"username": "pwuser2", "password": "SecurePass123!"}
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        resp = client.post(
            "/auth/change-password",
            json={"current_password": "WrongPassword", "new_password": "NewSecurePass456!"},
            headers=headers,
        )
        assert resp.status_code == 400

    def test_logout(self, client, auth_headers):
        resp = client.post("/auth/logout", headers=auth_headers)
        assert resp.status_code == 200