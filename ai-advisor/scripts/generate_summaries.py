import json
from datetime import datetime, timedelta
from collections import defaultdict

def load_transactions():
    """Load transactions from JSON file"""
    with open('data/transactions_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['transactions']

def generate_transactions_summary(transactions):
    """Generate aggregated transaction summary"""
    
    # Get current date and date ranges
    current_date = datetime.now()
    thirty_days_ago = current_date - timedelta(days=30)
    ninety_days_ago = current_date - timedelta(days=90)
    
    # Initialize aggregators
    last_30_days = {
        'total_income': 0,
        'total_expenses': 0,
        'transaction_count': 0,
        'by_category': defaultdict(float),
        'by_account': defaultdict(lambda: {'income': 0, 'expenses': 0})
    }
    
    last_3_months = {
        'total_income': 0,
        'total_expenses': 0,
        'by_category': defaultdict(float)
    }
    
    year_to_date = {
        'total_income': 0,
        'total_expenses': 0
    }
    
    # Monthly breakdown
    monthly_data = defaultdict(lambda: {
        'income': 0,
        'expenses': 0,
        'by_category': defaultdict(float)
    })
    
    # Process transactions
    for txn in transactions:
        txn_date = datetime.strptime(txn['date'], '%Y-%m-%d')
        amount = txn['amount']
        category = txn['category']
        account_id = txn['account_id']
        txn_type = txn['type']
        
        # Year to date
        year_to_date['total_income' if txn_type == 'credit' else 'total_expenses'] += amount
        
        # Monthly breakdown
        month_key = txn_date.strftime('%Y-%m')
        monthly_data[month_key]['income' if txn_type == 'credit' else 'expenses'] += amount
        monthly_data[month_key]['by_category'][category] += amount
        
        # Last 3 months
        if txn_date >= ninety_days_ago:
            last_3_months['total_income' if txn_type == 'credit' else 'total_expenses'] += amount
            last_3_months['by_category'][category] += amount
        
        # Last 30 days
        if txn_date >= thirty_days_ago:
            last_30_days['transaction_count'] += 1
            last_30_days['total_income' if txn_type == 'credit' else 'total_expenses'] += amount
            last_30_days['by_category'][category] += amount
            last_30_days['by_account'][account_id]['income' if txn_type == 'credit' else 'expenses'] += amount
    
    # Convert defaultdicts to regular dicts and round values
    last_30_days['by_category'] = {k: round(v, 2) for k, v in last_30_days['by_category'].items()}
    last_30_days['by_account'] = {
        k: {
            'income': round(v['income'], 2),
            'expenses': round(v['expenses'], 2)
        } for k, v in last_30_days['by_account'].items()
    }
    
    last_3_months['by_category'] = {k: round(v, 2) for k, v in last_3_months['by_category'].items()}
    
    # Calculate averages
    avg_monthly_income = last_3_months['total_income'] / 3
    avg_monthly_expenses = last_3_months['total_expenses'] / 3
    
    # Find highest spending category
    highest_category = max(last_3_months['by_category'].items(), key=lambda x: x[1]) if last_3_months['by_category'] else ('none', 0)
    
    # Determine spending trend (compare last month vs previous month)
    sorted_months = sorted(monthly_data.keys(), reverse=True)
    spending_trend = 'stable'
    if len(sorted_months) >= 2:
        last_month_expenses = monthly_data[sorted_months[0]]['expenses']
        prev_month_expenses = monthly_data[sorted_months[1]]['expenses']
        
        if last_month_expenses > prev_month_expenses * 1.1:
            spending_trend = 'increasing'
        elif last_month_expenses < prev_month_expenses * 0.9:
            spending_trend = 'decreasing'
    
    # Monthly breakdown for display
    monthly_breakdown = {}
    for month in sorted(monthly_data.keys(), reverse=True)[:6]:  # Last 6 months
        monthly_breakdown[month] = {
            'income': round(monthly_data[month]['income'], 2),
            'expenses': round(monthly_data[month]['expenses'], 2),
            'net': round(monthly_data[month]['income'] - monthly_data[month]['expenses'], 2),
            'top_categories': dict(sorted(
                monthly_data[month]['by_category'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5])  # Top 5 categories
        }
    
    # Build final summary
    summary = {
        'user_id': 'CUST001',
        'summary_date': current_date.strftime('%Y-%m-%d'),
        'last_30_days': {
            'total_income': round(last_30_days['total_income'], 2),
            'total_expenses': round(last_30_days['total_expenses'], 2),
            'net': round(last_30_days['total_income'] - last_30_days['total_expenses'], 2),
            'transaction_count': last_30_days['transaction_count'],
            'by_category': last_30_days['by_category'],
            'by_account': last_30_days['by_account']
        },
        'last_3_months': {
            'total_income': round(last_3_months['total_income'], 2),
            'total_expenses': round(last_3_months['total_expenses'], 2),
            'average_monthly_income': round(avg_monthly_income, 2),
            'average_monthly_expenses': round(avg_monthly_expenses, 2),
            'highest_category': highest_category[0],
            'highest_category_amount': round(highest_category[1], 2),
            'spending_trend': spending_trend,
            'by_category': last_3_months['by_category']
        },
        'year_to_date': {
            'total_income': round(year_to_date['total_income'], 2),
            'total_expenses': round(year_to_date['total_expenses'], 2),
            'savings_accumulated': round(year_to_date['total_income'] - year_to_date['total_expenses'], 2),
            'savings_rate': round(((year_to_date['total_income'] - year_to_date['total_expenses']) / year_to_date['total_income'] * 100), 2) if year_to_date['total_income'] > 0 else 0
        },
        'monthly_breakdown': monthly_breakdown
    }
    
    return summary

def calculate_account_balances(transactions):
    """Calculate current balance for each account"""
    account_balances = {
        'ACC001': 15000.00,  # Starting balances
        'ACC002': 25000.00,
        'ACC003': 8000.00
    }
    
    for txn in transactions:
        account_id = txn['account_id']
        if txn['type'] == 'credit':
            account_balances[account_id] += txn['amount']
        else:
            account_balances[account_id] -= txn['amount']
    
    return {k: round(v, 2) for k, v in account_balances.items()}

def generate_user_profile(transactions):
    """Generate user profile with current financial snapshot"""
    
    # Calculate current balances
    balances = calculate_account_balances(transactions)
    
    # Get recent transactions for income/expense calculation
    recent_txns = sorted(transactions, key=lambda x: x['date'], reverse=True)[:90]  # Last 3 months
    
    total_income = sum(t['amount'] for t in recent_txns if t['type'] == 'credit')
    total_expenses = sum(t['amount'] for t in recent_txns if t['type'] == 'debit')
    
    monthly_income = round(total_income / 3, 2)
    monthly_expenses = round(total_expenses / 3, 2)
    
    # Calculate totals
    total_net_worth = sum(balances.values())
    savings_balance = balances.get('ACC002', 0)
    available_cash = balances.get('ACC001', 0) + balances.get('ACC003', 0)
    
    # Savings rate
    savings_rate = round(((monthly_income - monthly_expenses) / monthly_income * 100), 2) if monthly_income > 0 else 0
    
    # Zakah calculation
    nisab_threshold = 7480  # 85g gold in SAR
    zakah_due = round(total_net_worth * 0.025, 2) if total_net_worth >= nisab_threshold else 0
    
    profile = {
        'user_id': 'CUST001',
        'full_name': 'Ahmed Al-Farsi',
        'email': 'ahmed@example.com',
        'phone': '+966501234567',
        'accounts': [
            {
                'account_id': 'ACC001',
                'bank_id': 'rajhi_bank',
                'bank_name': 'Al Rajhi Bank',
                'account_type': 'salary',
                'account_number': 'SA0380000000608010167519',
                'current_balance': balances['ACC001'],
                'available_balance': balances['ACC001'],
                'currency': 'SAR',
                'status': 'active'
            },
            {
                'account_id': 'ACC002',
                'bank_id': 'rajhi_bank',
                'bank_name': 'Al Rajhi Bank',
                'account_type': 'savings',
                'account_number': 'SA0380000000608010167520',
                'current_balance': balances['ACC002'],
                'available_balance': balances['ACC002'],
                'currency': 'SAR',
                'status': 'active'
            },
            {
                'account_id': 'ACC003',
                'bank_id': 'snb_bank',
                'bank_name': 'Saudi National Bank',
                'account_type': 'current',
                'account_number': 'SA0310000000123456789012',
                'current_balance': balances['ACC003'],
                'available_balance': balances['ACC003'],
                'currency': 'SAR',
                'status': 'active'
            }
        ],
        'financial_summary': {
            'total_net_worth': round(total_net_worth, 2),
            'monthly_income': monthly_income,
            'monthly_expenses': monthly_expenses,
            'current_savings': savings_balance,
            'available_cash': round(available_cash, 2),
            'total_debt': 0,
            'savings_rate': savings_rate
        },
        'savings_goals': [
            {
                'goal_id': 'goal_1',
                'name': 'Car Purchase',
                'description': 'Save for new car',
                'target_amount': 30000,
                'current_amount': 15000,
                'monthly_contribution': 2000,
                'target_date': '2027-01-01',
                'progress_percentage': 50,
                'status': 'active'
            },
            {
                'goal_id': 'goal_2',
                'name': 'Emergency Fund',
                'description': '6 months expenses',
                'target_amount': 20000,
                'current_amount': 10000,
                'monthly_contribution': 500,
                'target_date': '2026-12-01',
                'progress_percentage': 50,
                'status': 'active'
            }
        ],
        'zakah_info': {
            'net_worth_for_zakah': round(total_net_worth, 2),
            'zakah_due': zakah_due,
            'nisab_threshold': nisab_threshold,
            'is_due': total_net_worth >= nisab_threshold,
            'last_paid': '2025-04-01',
            'next_due': '2026-04-01'
        }
    }
    
    return profile

def main():
    """Main function to generate summary files"""
    
    print("📊 Generating summary files from transactions...\n")
    
    # Load transactions
    print("📥 Loading transactions...")
    transactions = load_transactions()
    print(f"   ✓ Loaded {len(transactions)} transactions\n")
    
    # Generate transaction summary
    print("📈 Generating transaction summary...")
    summary = generate_transactions_summary(transactions)
    
    with open('data/transactions_summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print("   ✓ Created data/transactions_summary.json")
    print(f"   → Last 30 days: {summary['last_30_days']['transaction_count']} transactions")
    print(f"   → Income: SAR {summary['last_30_days']['total_income']:,.2f}")
    print(f"   → Expenses: SAR {summary['last_30_days']['total_expenses']:,.2f}\n")
    
    # Generate user profile
    print("👤 Generating user profile...")
    profile = generate_user_profile(transactions)
    
    with open('data/user_profile.json', 'w', encoding='utf-8') as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)
    print("   ✓ Created data/user_profile.json")
    print(f"   → Net Worth: SAR {profile['financial_summary']['total_net_worth']:,.2f}")
    print(f"   → Monthly Income: SAR {profile['financial_summary']['monthly_income']:,.2f}")
    print(f"   → Monthly Expenses: SAR {profile['financial_summary']['monthly_expenses']:,.2f}")
    print(f"   → Zakah Due: SAR {profile['zakah_info']['zakah_due']:,.2f}\n")
    
    print("✅ Summary files generated successfully!")
    print("\n📁 Files created:")
    print("   - data/transactions_summary.json")
    print("   - data/user_profile.json")

if __name__ == '__main__':
    main()