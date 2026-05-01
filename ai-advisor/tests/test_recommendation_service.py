import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.recommendation_service import generate_user_recommendations
import json

print("Testing Recommendation Service...\n")
print("=" * 60)

try:
    # Generate recommendations
    print("🔄 Generating recommendations for CUST001...\n")
    
    result = generate_user_recommendations('CUST001')
    
    # Display results
    print("✅ Success!\n")
    print("=" * 60)
    
    # Financial Summary
    print("\n📊 FINANCIAL SUMMARY:")
    print("-" * 60)
    summary = result['financial_summary']
    print(f"Monthly Income:       {summary['monthly_income']:>12,.2f} SAR")
    print(f"Monthly Expenses:     {summary['monthly_expenses']:>12,.2f} SAR")
    print(f"Savings Rate:         {summary['savings_rate']:>12.1f}%")
    print(f"Net Worth:            {summary['net_worth']:>12,.2f} SAR")
    print(f"Zakah Due:            {summary['zakah_due']:>12,.2f} SAR")
    print(f"Emergency Fund:       {summary['emergency_fund_months']:>12.1f} months")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    print("-" * 60)
    recommendations = result['recommendations']
    print(f"Total: {len(recommendations)} recommendations\n")
    
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec.get('message', 'N/A')}")
        print(f"   Priority: {rec.get('priority', 'N/A')}")
        print(f"   Action: {rec.get('action', 'N/A')}")
        if 'action_params' in rec:
            print(f"   Parameters: {rec['action_params']}")
        print()
    
    # Investments
    print("\n💰 INVESTMENT SUGGESTIONS:")
    print("-" * 60)
    investments = result['investments']
    
    if investments:
        print(f"Total: {len(investments)} investments\n")
        
        for i, inv in enumerate(investments, 1):
            print(f"{i}. {inv.get('name', 'N/A')}")
            if 'name_ar' in inv:
                print(f"   Arabic: {inv['name_ar']}")
            print(f"   Type: {inv.get('type', 'N/A')}")
            print(f"   Min Investment: {inv.get('min_investment', 0):,.0f} SAR")
            print(f"   Expected Return: {inv.get('expected_return', 'N/A')}")
            print(f"   Risk: {inv.get('risk_level', 'N/A')}")
            if 'reason' in inv:
                print(f"   Reason: {inv['reason']}")
            print()
    else:
        print("No investment suggestions (emergency fund may need building first)\n")
    
    # Save to file for inspection
    output_file = 'tests/sample_output.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print("=" * 60)
    print(f"\n📁 Full output saved to: {output_file}")
    print("\n✅ Recommendation Service test complete!")

except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()