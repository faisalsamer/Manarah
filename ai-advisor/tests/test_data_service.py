import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.data_service import (
    get_user_profile,
    get_user_accounts,
    get_financial_summary,
    get_last_30_days_summary,
    get_suitable_investments
)

# Test user profile
print("Testing Data Service...\n")

profile = get_user_profile('CUST001')
print(f"✓ User: {profile['full_name']}")

accounts = get_user_accounts()
print(f"✓ Accounts: {len(accounts)}")

financial = get_financial_summary()
print(f"✓ Net Worth: SAR {financial['total_net_worth']:,.2f}")

# Test transactions summary
summary = get_last_30_days_summary()
print(f"✓ Last 30 days transactions: {summary['transaction_count']}")

# Test investments
investments = get_suitable_investments(available_cash=10000, risk_tolerance='medium')
print(f"✓ Suitable investments: {len(investments)}")

print("\n✅ Data service working!")