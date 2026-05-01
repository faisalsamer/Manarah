"""
Test API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("Testing /health...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_status():
    """Test status endpoint"""
    print("Testing /api/status...")
    response = requests.get(f"{BASE_URL}/api/status")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_advisor():
    """Test advisor endpoint"""
    print("Testing /api/get-advisor-insights...")
    
    payload = {"user_id": "CUST001"}
    response = requests.post(
        f"{BASE_URL}/api/get-advisor-insights",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Success!")
        print(f"\nRecommendations: {len(data['data']['recommendations'])}")
        print(f"Investments: {len(data['data']['investments'])}")
        print(f"Financial Summary: {data['data']['financial_summary']}")
    else:
        print(f"❌ Error: {response.json()}")

if __name__ == '__main__':
    print("="*60)
    print("AI Advisor API Tests")
    print("="*60 + "\n")
    
    try:
        test_health()
        test_status()
        test_advisor()
        
        print("\n" + "="*60)
        print("✅ All tests complete!")
        print("="*60)
    
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to server")
        print("Make sure Flask is running: python app.py")