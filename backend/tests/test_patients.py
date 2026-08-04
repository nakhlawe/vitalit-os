import pytest


def sample_patient(**overrides):
    payload = {
        "first_name": "Alice",
        "last_name": "Johnson",
        "date_of_birth": "1985-05-15",
        "gender": "female",
        "phone": "5559876543",
        "email": "alice.johnson@example.com",
        "address": "456 Oak Ave",
        "blood_group": "A+",
    }
    payload.update(overrides)
    return payload


def create_patient(client, headers):
    resp = client.post("/patients/", json=sample_patient(), headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestPatientManagement:
    def test_create_patient_success(self, client, auth_headers):
        data = create_patient(client, auth_headers)
        assert data["first_name"] == "Alice"
        assert data["last_name"] == "Johnson"
        assert data["email"] == "alice.johnson@example.com"
        assert data["patient_id"].startswith("P")  # auto-generated

    def test_create_patient_invalid_email(self, client, auth_headers):
        resp = client.post(
            "/patients/", json=sample_patient(email="invalid-email"), headers=auth_headers
        )
        assert resp.status_code == 422

    def test_create_patient_invalid_date(self, client, auth_headers):
        resp = client.post(
            "/patients/", json=sample_patient(date_of_birth="invalid-date"), headers=auth_headers
        )
        assert resp.status_code == 422

    def test_create_patient_missing_required(self, client, auth_headers):
        resp = client.post("/patients/", json={"first_name": "Test"}, headers=auth_headers)
        assert resp.status_code == 422

    def test_get_patients_list(self, client, auth_headers):
        create_patient(client, auth_headers)
        resp = client.get("/patients/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["first_name"] == "Alice"

    def test_get_patient_by_id(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        resp = client.get(f"/patients/{patient['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["patient_id"] == patient["patient_id"]

    def test_get_patient_not_found(self, client, auth_headers):
        resp = client.get("/patients/999999", headers=auth_headers)
        assert resp.status_code == 404

    def test_search_patients(self, client, auth_headers):
        create_patient(client, auth_headers)
        resp = client.get("/patients/?search=Alice", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_update_patient(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        resp = client.put(
            f"/patients/{patient['id']}",
            json={"phone": "5551112222", "address": "Updated Address"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["phone"] == "5551112222"
        assert data["address"] == "Updated Address"

    def test_delete_patient(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        resp = client.delete(f"/patients/{patient['id']}", headers=auth_headers)
        assert resp.status_code == 204
        # Now it should be gone
        assert client.get(f"/patients/{patient['id']}", headers=auth_headers).status_code == 404

    def test_delete_patient_not_found(self, client, auth_headers):
        resp = client.delete("/patients/999999", headers=auth_headers)
        assert resp.status_code == 404