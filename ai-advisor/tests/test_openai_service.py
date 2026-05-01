import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.openai_service import test_connection, get_completion, get_json_completion

print("Testing OpenAI Service...\n")

# Test 1: Connection
print("=== TEST 1: Connection ===")
test_connection()
print()

# Test 2: Simple completion
print("=== TEST 2: Simple Completion ===")
messages = [
    {"role": "system", "content": "You are a financial advisor."},
    {"role": "user", "content": "Give one financial tip in Arabic (one sentence)."}
]

response = get_completion(messages, max_tokens=100)
print(f"Response: {response}")
print()

# Test 3: JSON completion
print("=== TEST 3: JSON Completion ===")
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": """
Return exactly this JSON (no other text):
{
  "recommendations": [
    {"message": "وفر المزيد من المال", "action": "save"},
    {"message": "قلل مصاريف المطاعم", "action": "reduce"}
  ]
}
"""}
]

try:
    result = get_json_completion(messages, max_tokens=200)
    print(f"Parsed JSON: {result}")
    print(f"Type: {type(result)}")
    
    if 'recommendations' in result:
        print(f"Found {len(result['recommendations'])} recommendations")
except Exception as e:
    print(f"Error: {e}")

print("\n✅ OpenAI Service test complete!")