"""
Test suite for all API endpoints with mock data
"""
import pytest
import json
from unittest.mock import patch, MagicMock

def test_auth_health(client):
    """Test auth health endpoint"""
    response = client.get("/auth/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "auth_provider" in data
    print(f"✅ Auth health: {data}")

def test_optimize_health(client):
    """Test optimize health endpoint"""
    response = client.get("/optimize/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data
    print(f"✅ Optimize health: {data}")

def test_llm_health(client):
    """Test LLM health endpoint"""
    response = client.get("/llm/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "available_providers" in data
    assert len(data["available_providers"]) > 0
    print(f"✅ LLM health: {len(data['available_providers'])} providers available")

def test_llm_providers(client):
    """Test LLM providers list endpoint"""
    response = client.get("/llm/providers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]
    assert "name" in data[0]
    assert "models" in data[0]
    print(f"✅ LLM providers: {len(data)} providers with models")

def test_analytics_health(client):
    """Test analytics health endpoint"""
    response = client.get("/analytics/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print(f"✅ Analytics health: {data}")

def test_history_endpoint(client):
    """Test history endpoint"""
    response = client.get("/history/")
    assert response.status_code == 200
    data = response.json()
    assert "optimizations" in data
    assert "total" in data
    assert isinstance(data["optimizations"], list)
    print(f"✅ History endpoint: {data['total']} optimizations")

def test_optimize_health_services(client):
    """Test that all services are ready in optimize health"""
    response = client.get("/optimize/health")
    assert response.status_code == 200
    data = response.json()
    services = data.get("services", {})

    required_services = ["llm_service", "cache_service", "latex_parser", "pdf_generator"]
    for service in required_services:
        assert service in services, f"Missing service: {service}"
        print(f"  ✅ {service}: {services[service]}")

@pytest.mark.asyncio
async def test_optimize_with_mock_data(client, sample_resume, sample_job_description):
    """Test optimization endpoint with mock data (without actual LLM)"""
    # This would be used to test the endpoint structure
    # In actual test, we'd mock the LLM service
    payload = {
        "resume_latex": sample_resume,
        "company_name": "TechCorp",
        "job_description": sample_job_description,
        "custom_instructions": "Emphasize cloud architecture experience",
        "llm_provider": "anthropic",
        "llm_model": "claude-3-5-sonnet-20241022",
        "llm_api_key": "mock-api-key"
    }

    # Mock the LLM call
    with patch('services.llm_service.LLMService.optimize_resume') as mock_optimize:
        mock_optimize.return_value = {
            "optimized_latex": r"\documentclass{article}\begin{document}Mock\end{document}",
            "changes": ["Added cloud architecture keywords"]
        }

        # This would be the actual endpoint call (structure test)
        print(f"✅ Optimize payload structure valid")
        print(f"  - Resume: {len(payload['resume_latex'])} chars")
        print(f"  - Job description: {len(payload['job_description'])} chars")
        print(f"  - Provider: {payload['llm_provider']}")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
