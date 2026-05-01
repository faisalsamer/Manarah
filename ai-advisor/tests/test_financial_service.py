import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.financial_service import *

print("Testing Financial Service...\n")

# Test Zakah
print("=== ZAKAH CALCULATIONS ===")
net_worth = 58850.30
zakah = calculate_zakah(net_worth)
print(f"Net Worth: SAR {net_worth:,.2f}")
print(f"Zakah Due: SAR {zakah:,.2f}")
print(f"Is Due: {is_zakah_due(net_worth)}\n")

# Test Savings Rate
print("=== SAVINGS RATE ===")
income = 8000
expenses = 3456.78
rate = calculate_savings_rate(income, expenses)
print(f"Income: SAR {income:,.2f}")
print(f"Expenses: SAR {expenses:,.2f}")
print(f"Savings Rate: {rate}%\n")

# Test Emergency Fund
print("=== EMERGENCY FUND ===")
current_savings = 38200
months = calculate_emergency_fund_months(current_savings, expenses)
adequate = is_emergency_fund_adequate(current_savings, expenses)
print(f"Savings: SAR {current_savings:,.2f}")
print(f"Months Covered: {months} months")
print(f"Adequate (6+ months): {adequate}\n")

# Test Goal Progress
print("=== SAVINGS GOAL ===")
goal_amount = 30000
current_amount = 15000
monthly_contribution = 2000
progress = calculate_goal_progress(current_amount, goal_amount)
months_needed = calculate_months_to_goal(goal_amount, current_amount, monthly_contribution)
print(f"Goal: SAR {goal_amount:,.2f}")
print(f"Current: SAR {current_amount:,.2f}")
print(f"Progress: {progress}%")
print(f"Months to Goal: {months_needed} months\n")

# Test Expense Analysis
print("=== EXPENSE ANALYSIS ===")
expense_breakdown = {
    'rent': 1200,
    'groceries': 850,
    'restaurants': 645,
    'transport': 234
}
issues = analyze_all_expenses(expense_breakdown, income)
print(f"Found {len(issues)} overspending categories:")
for issue in issues:
    print(f"  • {issue['category']}: {issue['percentage']}% (should be <{issue['threshold']}%)")
    print(f"    {issue['recommendation']}\n")

print("✅ Financial Service working!")