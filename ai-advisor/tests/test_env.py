import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("OPENAI_API_KEY")
print(f"API Key loaded: {key[:20]}..." if key else "❌ No key found")