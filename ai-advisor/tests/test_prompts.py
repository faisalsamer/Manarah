import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.data_service import get_user_profile, get_suitable_investments
from services.financial_service import (
    calculate_zakah,
    calculate_savings_rate,
    analyze_all_expenses
)
from prompts.recommendation_prompt import build_recommendation_prompt
from prompts.investment_prompt import build_investment_prompt
from services.openai_service import get_json_completion

print("Testing Prompts...\n")

# Load user data
user_data = get_user_profile('CUST001')
financial_summary = user_data['financial_summary']

# Calculate financial analysis
financial_analysis = {
    'zakah_due': calculate_zakah(financial_summary['total_net_worth']),
    'savings_rate': calculate_savings_rate(
        financial_summary['monthly_income'],
        financial_summary['monthly_expenses']
    )
}

# Analyze expenses (mock data for test)
expense_breakdown = {
    'restaurants': 645,
    'groceries': 850
}
expense_issues = analyze_all_expenses(
    expense_breakdown,
    financial_summary['monthly_income']
)

print("=== TEST 1: Recommendation Prompt ===\n")

# Build prompt
rec_prompt = build_recommendation_prompt(user_data, financial_analysis, expense_issues)

# Show prompt preview (first 500 chars)
print("Prompt preview:")
print(rec_prompt[:500] + "...\n")

# Call OpenAI
print("Calling OpenAI...")
try:
    messages = [
        {"role": "system", "content": "You are an expert Islamic financial advisor."},
        {"role": "user", "content": rec_prompt}
    ]
    
    recommendations = get_json_completion(messages, model="gpt-4", max_tokens=2000)
    
    print(f"✅ Got {len(recommendations)} recommendations\n")
    
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec.get('message', 'N/A')}")
        print(f"   Type: {rec.get('type')}, Priority: {rec.get('priority')}")
        print()

except Exception as e:
    print(f"❌ Error: {e}\n")

print("\n" + "="*50 + "\n")

print("=== TEST 2: Investment Prompt ===\n")

# Get investments
available_investments = get_suitable_investments(
    available_cash=5000,
    risk_tolerance='medium'
)

print(f"Found {len(available_investments)} suitable investments\n")

# Build prompt
inv_prompt = build_investment_prompt(user_data, available_investments)

# Show prompt preview
print("Prompt preview:")
print(inv_prompt[:500] + "...\n")

# Call OpenAI
print("Calling OpenAI...")
try:
    messages = [
        {"role": "system", "content": "You are an expert Islamic investment advisor."},
        {"role": "user", "content": inv_prompt}
    ]
    
    investments = get_json_completion(messages, model="gpt-4", max_tokens=1500)
    
    print(f"✅ Got {len(investments)} investment suggestions\n")
    
    for i, inv in enumerate(investments, 1):
        print(f"{i}. {inv.get('name', 'N/A')}")
        print(f"   السبب: {inv.get('reason', 'N/A')}")
        print()

except Exception as e:
    print(f"❌ Error: {e}\n")

print("✅ Prompt tests complete!")