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


def sample_appointment(patient_id, doctor_id):
    return {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "scheduled_datetime": "2026-12-15T10:00:00",
        "duration_minutes": 30,
        "reason": "Regular checkup",
        "notes": "Follow up",
    }


class TestAppointmentManagement:
    def test_create_appointment_success(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        resp = client.post(
            "/appointments/",
            json=sample_appointment(patient["id"], doctor["id"]),
            headers=auth_headers,
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["reason"] == "Regular checkup"
        assert data["appointment_id"].startswith("A")

    def test_create_appointment_patient_not_found(self, client, auth_headers):
        doctor = create_doctor(client, auth_headers)
        resp = client.post(
            "/appointments/",
            json=sample_appointment(999999, doctor["id"]),
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_create_appointment_doctor_not_found(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        resp = client.post(
            "/appointments/",
            json=sample_appointment(patient["id"], 999999),
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_create_appointment_conflict(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        payload = sample_appointment(patient["id"], doctor["id"])
        assert client.post("/appointments/", json=payload, headers=auth_headers).status_code == 201
        # Same doctor, overlapping time -> conflict
        resp = client.post("/appointments/", json=payload, headers=auth_headers)
        assert resp.status_code == 400

    def test_get_appointments(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        client.post(
            "/appointments/",
            json=sample_appointment(patient["id"], doctor["id"]),
            headers=auth_headers,
        )
        resp = client.get("/appointments/", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_get_appointment_by_id(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        created = client.post(
            "/appointments/",
            json=sample_appointment(patient["id"], doctor["id"]),
            headers=auth_headers,
        ).json()
        resp = client.get(f"/appointments/{created['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_update_appointment_status(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        created = client.post(
            "/appointments/",
            json=sample_appointment(patient["id"], doctor["id"]),
            headers=auth_headers,
        ).json()
        resp = client.put(
            f"/appointments/{created['id']}/status?status=confirmed", headers=auth_headers
        )
        assert resp.status_code == 200

    def test_delete_appointment(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        doctor = create_doctor(client, auth_headers)
        created = client.post(
            "/appointments/",
            json=sample_appointment(patient["id"], doctor["id"]),
            headers=auth_headers,
        ).json()
        resp = client.delete(f"/appointments/{created['id']}", headers=auth_headers)
        assert resp.status_code == 200