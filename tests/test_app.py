import pytest
from fastapi.testclient import TestClient

import src.app as appmod


@pytest.fixture
def client():
    return TestClient(appmod.app)


def test_get_activities(client):
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect at least one known activity
    assert 'Chess Club' in data


def test_signup_and_unregister_flow(client):
    activity = 'Chess Club'
    email = 'pytest_user@example.com'

    # Ensure not present initially
    resp = client.get('/activities')
    participants = resp.json()[activity]['participants']
    assert email not in participants

    # Signup
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    assert 'Signed up' in r.json().get('message', '')

    # Verify present
    resp = client.get('/activities')
    participants = resp.json()[activity]['participants']
    assert email in participants

    # Unregister
    r = client.post(f"/activities/{activity}/unregister?email={email}")
    assert r.status_code == 200
    assert 'Unregistered' in r.json().get('message', '')

    # Verify removed
    resp = client.get('/activities')
    participants = resp.json()[activity]['participants']
    assert email not in participants


def test_signup_validation(client):
    # Non-existent activity
    r = client.post('/activities/NoSuchActivity/signup?email=foo@example.com')
    assert r.status_code == 404


def test_unregister_validation(client):
    # Unregister from non-existent activity
    r = client.post('/activities/NoSuchActivity/unregister?email=foo@example.com')
    assert r.status_code == 404
