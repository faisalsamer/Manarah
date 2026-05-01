import openai
from config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY

def test_connection():
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a test assistant."},
                {"role": "user", "content": "Reply with: Connection successful!"}
            ],
            max_tokens=20
        )
        
        print("OpenAI API Working!")
        print(f"Response: {response.choices[0].message.content}")
        
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test_connection()
