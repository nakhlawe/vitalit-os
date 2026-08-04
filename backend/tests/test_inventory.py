def sample_item(**overrides):
    payload = {
        "name": "Paracetamol",
        "description": "Pain reliever",
        "category": "Medication",
        "unit": "box",
        "current_quantity": 50,
        "minimum_quantity": 10,
        "unit_price": 5.5,
        "supplier": "Pharma Co",
        "location": "Shelf A1",
        "is_active": True,
    }
    payload.update(overrides)
    return payload


def create_item(client, headers, **overrides):
    resp = client.post("/inventory/", json=sample_item(**overrides), headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestInventory:
    def test_create_item_success(self, client, auth_headers):
        data = create_item(client, auth_headers)
        assert data["name"] == "Paracetamol"
        assert data["item_id"].startswith("I")
        assert data["status"] == "in_stock"

    def test_create_item_low_stock_status(self, client, auth_headers):
        data = create_item(client, auth_headers, current_quantity=5, minimum_quantity=10)
        assert data["status"] == "low_stock"

    def test_create_item_out_of_stock_status(self, client, auth_headers):
        data = create_item(client, auth_headers, current_quantity=0, minimum_quantity=10)
        assert data["status"] == "out_of_stock"

    def test_create_item_negative_quantity_rejected(self, client, auth_headers):
        resp = client.post(
            "/inventory/", json=sample_item(current_quantity=-1), headers=auth_headers
        )
        assert resp.status_code == 422

    def test_get_items(self, client, auth_headers):
        create_item(client, auth_headers)
        resp = client.get("/inventory/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_item_by_id(self, client, auth_headers):
        item = create_item(client, auth_headers)
        resp = client.get(f"/inventory/{item['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["item_id"] == item["item_id"]

    def test_get_item_not_found(self, client, auth_headers):
        resp = client.get("/inventory/999999", headers=auth_headers)
        assert resp.status_code == 404

    def test_search_items(self, client, auth_headers):
        create_item(client, auth_headers, name="Insulin")
        resp = client.get("/inventory/?search=Insulin", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_low_stock_filter(self, client, auth_headers):
        create_item(client, auth_headers, current_quantity=5, minimum_quantity=10)
        create_item(client, auth_headers, name="Bandages", current_quantity=100, minimum_quantity=10)
        resp = client.get("/inventory/?low_stock_only=true", headers=auth_headers)
        assert resp.status_code == 200
        names = [i["name"] for i in resp.json()]
        assert "Paracetamol" in names
        assert "Bandages" not in names

    def test_update_item(self, client, auth_headers):
        item = create_item(client, auth_headers)
        resp = client.put(
            f"/inventory/{item['id']}",
            json={"current_quantity": 3, "minimum_quantity": 10},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["current_quantity"] == 3
        assert data["status"] == "low_stock"

    def test_delete_item(self, client, auth_headers):
        item = create_item(client, auth_headers)
        resp = client.delete(f"/inventory/{item['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert client.get(f"/inventory/{item['id']}", headers=auth_headers).status_code == 404

    def test_delete_item_not_found(self, client, auth_headers):
        resp = client.delete("/inventory/999999", headers=auth_headers)
        assert resp.status_code == 404

    def test_categories(self, client, auth_headers):
        create_item(client, auth_headers, category="Medication")
        resp = client.get("/inventory/categories/all", headers=auth_headers)
        assert resp.status_code == 200
        assert "Medication" in resp.json()["categories"]