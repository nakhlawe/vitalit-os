def sample_doctor(**overrides):
    payload = {
        "first_name": "Dr. Sarah",
        "last_name": "Johnson",
        "specialization": "Cardiology",
        "qualification": "MD, FACC",
        "license_number": "MD123456",
        "phone": "555-0201",
        "email": "sarah.johnson@vitalit.com",
        "consultation_fee": 150.0,
    }
    payload.update(overrides)
    return payload


def create_doctor(client, headers):
    resp = client.post("/doctors/", json=sample_doctor(), headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestDoctorManagement:
    def test_create_doctor_success(self, client, auth_headers):
        data = create_doctor(client, auth_headers)
        assert data["first_name"] == "Dr. Sarah"
        assert data["doctor_id"].startswith("D")
        assert data["is_active"] is True

    def test_create_doctor_duplicate_license(self, client, auth_headers):
        create_doctor(client, auth_headers)
        resp = client.post("/doctors/", json=sample_doctor(), headers=auth_headers)
        assert resp.status_code == 400  # duplicate license number

    def test_create_doctor_invalid_email(self, client, auth_headers):
        resp = client.post(
            "/doctors/", json=sample_doctor(email="not-an-email"), headers=auth_headers
        )
        assert resp.status_code == 422

    def test_get_doctors_list(self, client, auth_headers):
        create_doctor(client, auth_headers)
        resp = client.get("/doctors/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_doctor_by_id(self, client, auth_headers):
        doctor = create_doctor(client, auth_headers)
        resp = client.get(f"/doctors/{doctor['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["doctor_id"] == doctor["doctor_id"]

    def test_get_doctor_not_found(self, client, auth_headers):
        resp = client.get("/doctors/999999", headers=auth_headers)
        assert resp.status_code == 404

    def test_update_doctor(self, client, auth_headers):
        doctor = create_doctor(client, auth_headers)
        resp = client.put(
            f"/doctors/{doctor['id']}",
            json={"consultation_fee": 200.0},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["consultation_fee"] == 200.0

    def test_delete_doctor(self, client, auth_headers):
        doctor = create_doctor(client, auth_headers)
        resp = client.delete(f"/doctors/{doctor['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert client.get(f"/doctors/{doctor['id']}", headers=auth_headers).status_code == 404