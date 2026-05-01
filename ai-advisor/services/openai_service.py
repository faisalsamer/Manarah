"""
OpenAI Service
Handles all OpenAI API interactions
"""
from openai import OpenAI
from config import OPENAI_API_KEY
import json

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

def get_completion(messages, model="gpt-4", max_tokens=1500, temperature=0.7):
    """
    Get completion from OpenAI
    
    Args:
        messages: List of message dicts [{"role": "system", "content": "..."}, ...]
        model: Model to use (default: gpt-4)
        max_tokens: Maximum tokens in response
        temperature: Creativity level (0-1)
    
    Returns:
        str: AI response text
    
    Raises:
        Exception: If API call fails
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")

def get_json_completion(messages, model="gpt-4", max_tokens=1500):
    """
    Get JSON completion from OpenAI and parse it
    
    Args:
        messages: List of message dicts
        model: Model to use
        max_tokens: Maximum tokens
    
    Returns:
        dict or list: Parsed JSON response
    
    Raises:
        Exception: If API fails or JSON parsing fails
    """
    try:
        # Get completion
        response_text = get_completion(messages, model, max_tokens, temperature=0.3)
        
        # Clean response (remove markdown code blocks if present)
        cleaned = response_text.strip()
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]  # Remove ```json
        if cleaned.startswith('```'):
            cleaned = cleaned[3:]  # Remove ```
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]  # Remove ```
        
        cleaned = cleaned.strip()
        
        # Parse JSON
        parsed = json.loads(cleaned)
        
        return parsed
    
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse JSON response: {str(e)}\nResponse: {response_text}")
    
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")

def generate_recommendations(user_data, prompt_template):
    """
    Generate financial recommendations using OpenAI
    
    Args:
        user_data: User financial data dict
        prompt_template: Formatted prompt string
    
    Returns:
        list: List of recommendation dicts
    """
    messages = [
        {
            "role": "system",
            "content": "You are an expert Islamic financial advisor. Provide practical, actionable advice following Shariah principles."
        },
        {
            "role": "user",
            "content": prompt_template
        }
    ]
    
    try:
        recommendations = get_json_completion(messages, model="gpt-4")
        
        # Ensure it's a list
        if isinstance(recommendations, dict) and 'recommendations' in recommendations:
            recommendations = recommendations['recommendations']
        
        return recommendations
    
    except Exception as e:
        print(f"Error generating recommendations: {str(e)}")
        return []

def generate_investment_suggestions(user_data, available_investments, prompt_template):
    """
    Generate investment suggestions using OpenAI
    
    Args:
        user_data: User financial data
        available_investments: List of filtered halal investments
        prompt_template: Formatted prompt string
    
    Returns:
        list: List of selected investment dicts
    """
    messages = [
        {
            "role": "system",
            "content": "You are an expert Islamic investment advisor. Select suitable Shariah-compliant investments."
        },
        {
            "role": "user",
            "content": prompt_template
        }
    ]
    
    try:
        investments = get_json_completion(messages, model="gpt-4")
        
        # Ensure it's a list
        if isinstance(investments, dict) and 'investments' in investments:
            investments = investments['investments']
        
        return investments
    
    except Exception as e:
        print(f"Error generating investments: {str(e)}")
        return []

def test_connection():
    """
    Test OpenAI API connection
    
    Returns:
        bool: True if connection works
    """
    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Connection successful' in Arabic."}
        ]
        
        response = get_completion(messages, max_tokens=50)
        print(f"✅ OpenAI connected: {response}")
        return True
    
    except Exception as e:
        print(f"❌ OpenAI connection failed: {str(e)}")
        return False