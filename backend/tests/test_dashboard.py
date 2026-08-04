class TestDashboard:
    def test_dashboard_stats(self, client, auth_headers):
        resp = client.get("/dashboard/stats", headers=auth_headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        for field in (
            "totalPatients",
            "totalDoctors",
            "totalAppointments",
            "todayAppointments",
            "monthlyRevenue",
            "activePatients",
            "pendingAppointments",
        ):
            assert field in data

    def test_dashboard_stats_dev(self, client, auth_headers):
        resp = client.get("/dashboard/stats/dev", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "totalPatients" in data
        assert "monthlyRevenue" in data

    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "version" in data