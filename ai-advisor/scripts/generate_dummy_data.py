import json
import random
from datetime import datetime, timedelta
import os

def load_banks_data():
    """Load banks data from banks_data.json"""
    try:
        with open('data/banks_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data['banks']
    except FileNotFoundError:
        print("❌ Error: banks_data.json not found. Run generate_banks_data.py first.")
        exit(1)

def get_user_banks(banks, customer_id='CUST001'):
    """Extract user's connected banks and accounts"""
    user_banks = {}
    
    for bank in banks:
        if bank.get('is_user_connected'):
            for customer in bank.get('customers', []):
                if customer['customer_id'] == customer_id:
                    user_banks[bank['bank_id']] = {
                        'bank_id': bank['bank_id'],
                        'bank_name': bank['bank_name'],
                        'accounts': customer['accounts']
                    }
    
    return user_banks

# Transaction categories with realistic ranges
CATEGORIES = {
    'groceries': {
        'merchants': ['Panda Supermarket', 'Carrefour Hypermarket', 'Tamimi Markets', 'Lulu Hypermarket', 'Danube'],
        'amount_range': (30, 350),
        'type': 'debit',
        'frequency_weight': 25
    },
    'restaurants': {
        'merchants': ['Albaik', 'McDonald\'s', 'Subway', 'Starbucks', 'Kudu', 'Shawarmer', 'Pizza Hut'],
        'amount_range': (15, 120),
        'type': 'debit',
        'frequency_weight': 30
    },
    'transport': {
        'merchants': ['Uber Riyadh', 'Careem', 'ADNOC Fuel', 'Petromin Station', 'Saudi Aramco Fuel'],
        'amount_range': (15, 100),
        'type': 'debit',
        'frequency_weight': 20
    },
    'utilities': {
        'merchants': ['STC Internet', 'Saudi Electricity Co.', 'Mobily Postpaid', 'NWC Water', 'Zain'],
        'amount_range': (100, 350),
        'type': 'debit',
        'frequency_weight': 5
    },
    'entertainment': {
        'merchants': ['Netflix', 'Spotify', 'VOX Cinemas', 'iTunes', 'PlayStation Store', 'OSN'],
        'amount_range': (20, 80),
        'type': 'debit',
        'frequency_weight': 10
    },
    'shopping': {
        'merchants': ['Jarir Bookstore', 'Extra Stores', 'Amazon', 'Noon.com', 'Zara', 'H&M', 'Centrepoint'],
        'amount_range': (50, 600),
        'type': 'debit',
        'frequency_weight': 15
    },
    'healthcare': {
        'merchants': ['Dr. Sulaiman Al Habib', 'Nahdi Pharmacy', 'Al Dawa Pharmacy', 'United Pharmacy'],
        'amount_range': (50, 400),
        'type': 'debit',
        'frequency_weight': 8
    },
    'rent': {
        'merchants': ['Monthly Rent Transfer'],
        'amount_range': (1200, 1200),
        'type': 'debit',
        'frequency_weight': 0
    },
    'salary': {
        'merchants': ['Tech Corp LLC', 'Company Salary Transfer'],
        'amount_range': (8000, 8000),
        'type': 'credit',
        'frequency_weight': 0
    },
    'transfer': {
        'merchants': ['Internal Transfer'],
        'amount_range': (500, 3000),
        'type': 'internal',
        'frequency_weight': 5
    }
}

def generate_multi_account_transactions(user_banks, start_date_str='2025-04-28', num_days=365, customer_id='CUST001'):
    """
    Generate realistic transaction data across multiple banks and accounts
    """
    all_transactions = []
    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
    
    # Initialize balances for each account from banks_data.json
    account_balances = {}
    account_info = {}  # Store account metadata
    
    for bank_id, bank_data in user_banks.items():
        for account in bank_data['accounts']:
            acc_id = account['account_id']
            account_balances[acc_id] = account['balance']
            account_info[acc_id] = {
                'bank_id': bank_id,
                'bank_name': bank_data['bank_name'],
                'account_type': account['account_type']
            }
    
    transaction_counter = 1
    
    # Find salary account (ACC001 - first Rajhi account)
    salary_account = None
    for bank_id, bank_data in user_banks.items():
        if bank_id == 'rajhi_bank':
            for acc in bank_data['accounts']:
                if acc['account_type'] == 'salary':
                    salary_account = acc['account_id']
                    break
    
    # Find savings account (ACC002 - second Rajhi account)
    savings_account = None
    for bank_id, bank_data in user_banks.items():
        if bank_id == 'rajhi_bank':
            for acc in bank_data['accounts']:
                if acc['account_type'] == 'savings':
                    savings_account = acc['account_id']
                    break
    
    for day in range(num_days):
        current_date = start_date + timedelta(days=day)
        
        # MONTHLY TRANSACTIONS (1st of month)
        if current_date.day == 1 and salary_account:
            # 1. Salary to salary account
            salary_amount = 8000.00
            account_balances[salary_account] += salary_amount
            
            all_transactions.append({
                'transaction_id': f'TXN{transaction_counter:04d}',
                'account_id': salary_account,
                'customer_id': customer_id,
                'bank_id': account_info[salary_account]['bank_id'],
                'date': current_date.strftime('%Y-%m-%d'),
                'timestamp': current_date.replace(hour=9, minute=0, second=0).isoformat() + 'Z',
                'type': 'credit',
                'category': 'salary',
                'merchant': random.choice(CATEGORIES['salary']['merchants']),
                'amount': round(salary_amount, 2),
                'currency': 'SAR',
                'balance_after': round(account_balances[salary_account], 2),
                'status': 'completed',
                'description': 'Monthly salary deposit'
            })
            transaction_counter += 1
            
            # 2. Rent from salary account
            rent_amount = CATEGORIES['rent']['amount_range'][0]
            account_balances[salary_account] -= rent_amount
            
            all_transactions.append({
                'transaction_id': f'TXN{transaction_counter:04d}',
                'account_id': salary_account,
                'customer_id': customer_id,
                'bank_id': account_info[salary_account]['bank_id'],
                'date': current_date.strftime('%Y-%m-%d'),
                'timestamp': current_date.replace(hour=10, minute=0, second=0).isoformat() + 'Z',
                'type': 'debit',
                'category': 'rent',
                'merchant': CATEGORIES['rent']['merchants'][0],
                'amount': round(rent_amount, 2),
                'currency': 'SAR',
                'balance_after': round(account_balances[salary_account], 2),
                'status': 'completed',
                'description': 'Monthly rent payment'
            })
            transaction_counter += 1
            
            # 3. Transfer from salary to savings (if both exist)
            if savings_account and random.random() > 0.2:  # 80% chance
                transfer_amount = random.uniform(1500, 2500)
                account_balances[salary_account] -= transfer_amount
                account_balances[savings_account] += transfer_amount
                
                # Debit from salary account
                all_transactions.append({
                    'transaction_id': f'TXN{transaction_counter:04d}',
                    'account_id': salary_account,
                    'customer_id': customer_id,
                    'bank_id': account_info[salary_account]['bank_id'],
                    'date': current_date.strftime('%Y-%m-%d'),
                    'timestamp': current_date.replace(hour=11, minute=0, second=0).isoformat() + 'Z',
                    'type': 'debit',
                    'category': 'transfer',
                    'merchant': 'Transfer to Savings',
                    'amount': round(transfer_amount, 2),
                    'currency': 'SAR',
                    'balance_after': round(account_balances[salary_account], 2),
                    'status': 'completed',
                    'description': 'Transfer to savings account'
                })
                transaction_counter += 1
                
                # Credit to savings account
                all_transactions.append({
                    'transaction_id': f'TXN{transaction_counter:04d}',
                    'account_id': savings_account,
                    'customer_id': customer_id,
                    'bank_id': account_info[savings_account]['bank_id'],
                    'date': current_date.strftime('%Y-%m-%d'),
                    'timestamp': current_date.replace(hour=11, minute=0, second=1).isoformat() + 'Z',
                    'type': 'credit',
                    'category': 'transfer',
                    'merchant': 'Transfer from Salary Account',
                    'amount': round(transfer_amount, 2),
                    'currency': 'SAR',
                    'balance_after': round(account_balances[savings_account], 2),
                    'status': 'completed',
                    'description': 'Received from salary account'
                })
                transaction_counter += 1
        
        # UTILITIES on 5th of month from salary account
        if current_date.day == 5 and salary_account:
            category = 'utilities'
            merchant = random.choice(CATEGORIES[category]['merchants'])
            min_amt, max_amt = CATEGORIES[category]['amount_range']
            amount = round(random.uniform(min_amt, max_amt), 2)
            account_balances[salary_account] -= amount
            
            all_transactions.append({
                'transaction_id': f'TXN{transaction_counter:04d}',
                'account_id': salary_account,
                'customer_id': customer_id,
                'bank_id': account_info[salary_account]['bank_id'],
                'date': current_date.strftime('%Y-%m-%d'),
                'timestamp': current_date.replace(hour=8, minute=30, second=0).isoformat() + 'Z',
                'type': 'debit',
                'category': category,
                'merchant': merchant,
                'amount': amount,
                'currency': 'SAR',
                'balance_after': round(account_balances[salary_account], 2),
                'status': 'completed',
                'description': 'Utility bill payment'
            })
            transaction_counter += 1
        
        # DAILY TRANSACTIONS - Distribute across all accounts
        num_daily_txns = random.randint(1, 3)
        
        for _ in range(num_daily_txns):
            # Choose category based on weights
            categories_list = [cat for cat in CATEGORIES.keys() 
                             if cat not in ['rent', 'salary', 'transfer'] 
                             and CATEGORIES[cat]['frequency_weight'] > 0]
            weights = [CATEGORIES[cat]['frequency_weight'] for cat in categories_list]
            
            category = random.choices(categories_list, weights=weights)[0]
            merchant = random.choice(CATEGORIES[category]['merchants'])
            min_amt, max_amt = CATEGORIES[category]['amount_range']
            amount = round(random.uniform(min_amt, max_amt), 2)
            
            # Choose which account to use (weighted by type)
            # Salary account: 80%, Savings: 5%, Other: 15%
            account_ids = list(account_balances.keys())
            if len(account_ids) == 3:
                account_choice = random.choices(account_ids, weights=[80, 5, 15])[0]
            elif len(account_ids) == 2:
                account_choice = random.choices(account_ids, weights=[85, 15])[0]
            else:
                account_choice = account_ids[0]
            
            # Random time
            hour = random.randint(8, 22)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            
            # Deduct from balance
            account_balances[account_choice] -= amount
            
            # Status
            status = random.choices(
                ['completed', 'pending', 'failed'],
                weights=[95, 4, 1]
            )[0]
            
            all_transactions.append({
                'transaction_id': f'TXN{transaction_counter:04d}',
                'account_id': account_choice,
                'customer_id': customer_id,
                'bank_id': account_info[account_choice]['bank_id'],
                'date': current_date.strftime('%Y-%m-%d'),
                'timestamp': current_date.replace(hour=hour, minute=minute, second=second).isoformat() + 'Z',
                'type': 'debit',
                'category': category,
                'merchant': merchant,
                'amount': amount,
                'currency': 'SAR',
                'balance_after': round(account_balances[account_choice], 2),
                'status': status,
                'description': f'{category.capitalize()} purchase'
            })
            transaction_counter += 1
    
    return {'transactions': all_transactions}


def main():
    """Generate and save multi-account transaction data"""
    
    # Create data directory
    os.makedirs('data', exist_ok=True)
    
    print("🔄 Generating multi-account transaction data...")
    
    # Load banks from banks_data.json
    print("\n📥 Loading banks data from banks_data.json...")
    banks = load_banks_data()
    
    # Get user's connected banks
    user_banks = get_user_banks(banks, customer_id='CUST001')
    
    if not user_banks:
        print("❌ Error: No connected banks found for CUST001")
        return
    
    print(f"\n🏦 User's connected banks:")
    for bank_id, bank_data in user_banks.items():
        print(f"   {bank_data['bank_name']}:")
        for acc in bank_data['accounts']:
            print(f"      - {acc['account_id']} ({acc['account_type']}) - Balance: SAR {acc['balance']:,.2f}")
    
    # Generate transactions
    data = generate_multi_account_transactions(
        user_banks=user_banks,
        start_date_str='2025-04-28',
        num_days=365,
        customer_id='CUST001'
    )
    
    # Save to file
    output_file = 'data/transactions_data.json'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    # Statistics
    total_txns = len(data['transactions'])
    start_date = data['transactions'][0]['date']
    end_date = data['transactions'][-1]['date']
    
    # Breakdown by account
    account_stats = {}
    category_stats = {}
    total_debit = 0
    total_credit = 0
    
    for txn in data['transactions']:
        # Account stats
        acc_id = txn['account_id']
        if acc_id not in account_stats:
            account_stats[acc_id] = {'count': 0, 'debit': 0, 'credit': 0}
        account_stats[acc_id]['count'] += 1
        
        # Category stats
        cat = txn['category']
        category_stats[cat] = category_stats.get(cat, 0) + 1
        
        # Totals
        if txn['type'] == 'debit':
            total_debit += txn['amount']
            account_stats[acc_id]['debit'] += txn['amount']
        else:
            total_credit += txn['amount']
            account_stats[acc_id]['credit'] += txn['amount']
    
    print(f"\n✅ Generated {total_txns} transactions")
    print(f"📅 Date range: {start_date} to {end_date}")
    print(f"💰 Total Credit (income): SAR {total_credit:,.2f}")
    print(f"💸 Total Debit (spending): SAR {total_debit:,.2f}")
    print(f"📊 Net: SAR {(total_credit - total_debit):,.2f}")
    
    print("\n💳 Transaction breakdown by account:")
    for acc_id, stats in sorted(account_stats.items()):
        print(f"   {acc_id}: {stats['count']:4} txns | Credit: SAR {stats['credit']:10,.2f} | Debit: SAR {stats['debit']:10,.2f}")
    
    print("\n📈 Transaction breakdown by category:")
    for cat, count in sorted(category_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"   {cat:15} {count:4} transactions")
    
    print(f"\n📁 Saved to: {output_file}")


if __name__ == '__main__':
    main()