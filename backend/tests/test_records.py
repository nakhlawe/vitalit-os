def create_patient(client, headers):
    resp = client.post(
        "/patients/",
        json={
            "first_name": "Alice",
            "last_name": "Johnson",
            "date_of_birth": "1985-05-15",
            "gender": "female",
            "phone": "5559876543",
            "email": "alice@example.com",
            "address": "456 Oak Ave",
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def create_doctor(client, headers):
    resp = client.post(
        "/doctors/",
        json={
            "first_name": "Dr. Sarah",
            "last_name": "Johnson",
            "specialization": "Cardiology",
            "qualification": "MD",
            "license_number": "MD123456",
            "phone": "5550201",
            "email": "sarah@vitalit.com",
            "consultation_fee": 150.0,
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def sample_record(patient_id, doctor_id, **overrides):
    payload = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "visit_date": "2026-08-04",
        "chief_complaint": "Fever and cough",
        "diagnosis": "Upper respiratory infection",
        "treatment_plan": "Rest and fluids",
        "prescription_notes": "Paracetamol 500mg",
        "notes": "Review in one week",
    }
    payload.update(overrides)
    return payload


def create_record(client, headers, patient_id, doctor_id):
    resp = client.post(
        "/records/", json=sample_record(patient_id, doctor_id), headers=headers
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestRecords:
    def test_create_record_success(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        record = create_record(client, auth_headers, patient["id"], doctor["id"])
        assert record["record_id"].startswith("R")
        assert record["diagnosis"] == "Upper respiratory infection"

    def test_create_record_patient_not_found(self, client, auth_headers):
        doctor = create_doctor(client, auth_headers)
        resp = client.post(
            "/records/", json=sample_record(999999, doctor["id"]), headers=auth_headers
        )
        assert resp.status_code == 404

    def test_create_record_invalid_doctor(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        resp = client.post(
            "/records/", json=sample_record(patient["id"], 999999), headers=auth_headers
        )
        assert resp.status_code == 404

    def test_create_record_without_doctor(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        resp = client.post(
            "/records/",
            json=sample_record(patient["id"], None),
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["doctor_id"] is None

    def test_get_records(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        create_record(client, auth_headers, patient["id"], doctor["id"])
        resp = client.get("/records/", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1

    def test_filter_records_by_patient(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        create_record(client, auth_headers, patient["id"], doctor["id"])
        resp = client.get(f"/records/?patient_id={patient['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_get_record_by_id(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        record = create_record(client, auth_headers, patient["id"], doctor["id"])
        resp = client.get(f"/records/{record['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["record_id"] == record["record_id"]

    def test_get_record_not_found(self, client, auth_headers):
        resp = client.get("/records/999999", headers=auth_headers)
        assert resp.status_code == 404

    def test_search_records(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        create_record(client, auth_headers, patient["id"], doctor["id"])
        resp = client.get("/records/?search=respiratory", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_update_record(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        record = create_record(client, auth_headers, patient["id"], doctor["id"])
        resp = client.put(
            f"/records/{record['id']}",
            json={"diagnosis": "Updated diagnosis"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["diagnosis"] == "Updated diagnosis"

    def test_delete_record(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        record = create_record(client, auth_headers, patient["id"], doctor["id"])
        resp = client.delete(f"/records/{record['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert client.get(f"/records/{record['id']}", headers=auth_headers).status_code == 404

    def test_delete_record_not_found(self, client, auth_headers):
        resp = client.delete("/records/999999", headers=auth_headers)
        assert resp.status_code == 404