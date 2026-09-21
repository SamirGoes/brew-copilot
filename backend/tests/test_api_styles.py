def test_list_and_search(client):
    assert len(client.get("/api/styles").json()) == 116
    ipas = client.get("/api/styles", params={"q": "IPA"}).json()
    assert ipas and all("ipa" in (s["name"] + s["category"]).lower() for s in ipas)


def test_style_detail(client):
    s = client.get("/api/styles/21a").json()
    assert s["name"] == "American IPA"
    assert s["ranges"]["og"] == {"min": 1.056, "max": 1.070}
    assert "aroma" in s["details"] and "commercialexamples" in s["details"]
    assert s["midpoints"]["ibu"] == 55


def test_unknown_style_404(client):
    assert client.get("/api/styles/99Z").status_code == 404
    assert client.post("/api/validate/style", json={"style_id": "99Z"}).status_code == 404


def test_validate(client):
    body = client.post("/api/validate/style", json={
        "style_id": "21A", "og": 1.060, "fg": 1.010, "ibu": 75, "srm": 10, "abv": 6.5,
    }).json()
    assert body["results"]["og"]["severity"] == "within"
    assert body["results"]["ibu"]["severity"] == "slight"
    assert body["results"]["ibu"]["message"] == "+7% acima do máx. do estilo"
    assert body["summary"]["text"] == "4/5 dentro do estilo, 1 levemente fora (IBU)"
    assert body["summary"]["compliant"] is False
