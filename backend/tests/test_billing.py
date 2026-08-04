from datetime import datetime, timedelta


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


def sample_bill(patient_id):
    now = datetime.utcnow().isoformat()
    due = (datetime.utcnow() + timedelta(days=14)).isoformat()
    return {
        "patient_id": patient_id,
        "bill_date": now,
        "due_date": due,
        "subtotal": 100.0,
        "tax_amount": 10.0,
        "discount_amount": 0.0,
        "total_amount": 110.0,
        "notes": "Consultation",
        "bill_items": [
            {
                "item_name": "Consultation",
                "quantity": 1,
                "unit_price": 100.0,
                "total_price": 100.0,
            }
        ],
    }


class TestBilling:
    def test_create_bill(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        resp = client.post("/billing/bills", json=sample_bill(patient["id"]), headers=auth_headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["bill_id"].startswith("B")
        assert data["total_amount"] == 110.0

    def test_create_bill_total_mismatch(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        payload = sample_bill(patient["id"])
        payload["total_amount"] = 500.0  # does not equal 100 + 10 - 0
        resp = client.post("/billing/bills", json=payload, headers=auth_headers)
        assert resp.status_code == 422

    def test_get_bills(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        client.post("/billing/bills", json=sample_bill(patient["id"]), headers=auth_headers)
        resp = client.get("/billing/bills", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_bill_by_id(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        bill = client.post(
            "/billing/bills", json=sample_bill(patient["id"]), headers=auth_headers
        ).json()
        resp = client.get(f"/billing/bills/{bill['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == bill["id"]

    def test_payment_to_bill(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        bill = client.post(
            "/billing/bills", json=sample_bill(patient["id"]), headers=auth_headers
        ).json()
        resp = client.post(
            f"/billing/bills/{bill['id']}/payments",
            json={
                "bill_id": bill["id"],
                "amount": 50.0,
                "payment_method": "cash",
                "payment_date": datetime.utcnow().isoformat(),
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["payment_id"].startswith("PAY")

    def test_revenue_report(self, client, auth_headers):
        patient = create_patient(client, auth_headers)
        client.post("/billing/bills", json=sample_bill(patient["id"]), headers=auth_headers)
        resp = client.get("/billing/reports/revenue", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)