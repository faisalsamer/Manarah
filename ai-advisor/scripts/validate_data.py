import json
import os
from datetime import datetime

def validate_json_file(filepath):
    """Validate JSON file exists and is valid"""
    if not os.path.exists(filepath):
        return False, f"File not found: {filepath}"
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return True, data
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON: {str(e)}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def validate_transactions(data):
    """Validate transactions data"""
    errors = []
    
    if 'transactions' not in data:
        errors.append("Missing 'transactions' key")
        return errors
    
    transactions = data['transactions']
    
    # Check required fields
    required_fields = ['transaction_id', 'account_id', 'customer_id', 'bank_id', 'date', 'type', 'amount']
    
    for i, txn in enumerate(transactions[:10]):  # Check first 10
        for field in required_fields:
            if field not in txn:
                errors.append(f"Transaction {i}: Missing field '{field}'")
    
    # Check unique IDs
    txn_ids = [t['transaction_id'] for t in transactions]
    if len(txn_ids) != len(set(txn_ids)):
        errors.append("Duplicate transaction IDs found")
    
    # Check account IDs are valid
    valid_accounts = ['ACC001', 'ACC002', 'ACC003']
    invalid_accounts = set()
    for txn in transactions:
        if txn.get('account_id') not in valid_accounts:
            invalid_accounts.add(txn.get('account_id'))
    
    if invalid_accounts:
        errors.append(f"Invalid account IDs: {invalid_accounts}")
    
    return errors

def validate_user_profile(data):
    """Validate user profile data"""
    errors = []
    
    # Check required top-level fields
    required_fields = ['user_id', 'accounts', 'financial_summary', 'zakah_info']
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing field: {field}")
    
    # Validate accounts
    if 'accounts' in data:
        expected_accounts = {'ACC001', 'ACC002', 'ACC003'}
        actual_accounts = {acc['account_id'] for acc in data['accounts']}
        
        if expected_accounts != actual_accounts:
            errors.append(f"Account mismatch. Expected {expected_accounts}, got {actual_accounts}")
        
        # Check balances are numbers
        for acc in data['accounts']:
            if not isinstance(acc.get('current_balance'), (int, float)):
                errors.append(f"Invalid balance for {acc.get('account_id')}")
    
    # Validate financial summary
    if 'financial_summary' in data:
        summary = data['financial_summary']
        
        # Check net worth matches sum of account balances
        if 'accounts' in data:
            total_balance = sum(acc['current_balance'] for acc in data['accounts'])
            net_worth = summary.get('total_net_worth', 0)
            
            if abs(total_balance - net_worth) > 1:  # Allow 1 SAR difference for rounding
                errors.append(f"Net worth mismatch: {net_worth} vs sum of balances {total_balance}")
    
    # Validate zakah
    if 'zakah_info' in data and 'financial_summary' in data:
        zakah = data['zakah_info']
        net_worth = data['financial_summary'].get('total_net_worth', 0)
        
        expected_zakah = round(net_worth * 0.025, 2) if net_worth >= zakah.get('nisab_threshold', 7480) else 0
        actual_zakah = zakah.get('zakah_due', 0)
        
        if abs(expected_zakah - actual_zakah) > 1:
            errors.append(f"Zakah calculation error: expected {expected_zakah}, got {actual_zakah}")
    
    return errors

def validate_transactions_summary(data):
    """Validate transactions summary"""
    errors = []
    
    required_fields = ['user_id', 'last_30_days', 'last_3_months', 'year_to_date']
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing field: {field}")
    
    # Validate last_30_days
    if 'last_30_days' in data:
        l30 = data['last_30_days']
        
        if 'by_account' not in l30:
            errors.append("Missing 'by_account' in last_30_days")
        else:
            # Check all accounts present
            expected_accounts = {'ACC001', 'ACC002', 'ACC003'}
            actual_accounts = set(l30['by_account'].keys())
            
            if not actual_accounts.issubset(expected_accounts):
                errors.append(f"Invalid accounts in summary: {actual_accounts - expected_accounts}")
    
    return errors

def cross_validate_data(transactions_data, profile_data, summary_data):
    """Cross-validate data across files"""
    errors = []
    
    # Check customer IDs match
    txn_customer_ids = set(t.get('customer_id') for t in transactions_data.get('transactions', []))
    profile_user_id = profile_data.get('user_id')
    summary_user_id = summary_data.get('user_id')
    
    if profile_user_id != summary_user_id:
        errors.append(f"User ID mismatch: profile={profile_user_id}, summary={summary_user_id}")
    
    if profile_user_id not in txn_customer_ids:
        errors.append(f"User {profile_user_id} has no transactions")
    
    # Check account consistency
    profile_accounts = {acc['account_id'] for acc in profile_data.get('accounts', [])}
    txn_accounts = set(t.get('account_id') for t in transactions_data.get('transactions', []))
    
    if txn_accounts - profile_accounts:
        errors.append(f"Transactions reference unknown accounts: {txn_accounts - profile_accounts}")
    
    return errors

def main():
    """Validate all data files"""
    
    print("🔍 Validating Data Files...\n")
    
    all_valid = True
    
    # File paths
    files = {
        'transactions': 'data/transactions_data.json',
        'profile': 'data/user_profile.json',
        'summary': 'data/transactions_summary.json'
    }
    
    data = {}
    
    # Step 1: Validate JSON structure
    print("📄 Step 1: Validating JSON files...")
    for name, filepath in files.items():
        valid, result = validate_json_file(filepath)
        if valid:
            print(f"   ✓ {filepath} - Valid JSON")
            data[name] = result
        else:
            print(f"   ✗ {filepath} - {result}")
            all_valid = False
    
    if not all_valid:
        print("\n❌ JSON validation failed. Fix errors and try again.")
        return
    
    print()
    
    # Step 2: Validate individual files
    print("🔎 Step 2: Validating data integrity...")
    
    # Validate transactions
    print("   Checking transactions_data.json...")
    errors = validate_transactions(data['transactions'])
    if errors:
        print(f"      ✗ Found {len(errors)} errors:")
        for err in errors:
            print(f"        - {err}")
        all_valid = False
    else:
        print("      ✓ Transactions valid")
    
    # Validate user profile
    print("   Checking user_profile.json...")
    errors = validate_user_profile(data['profile'])
    if errors:
        print(f"      ✗ Found {len(errors)} errors:")
        for err in errors:
            print(f"        - {err}")
        all_valid = False
    else:
        print("      ✓ User profile valid")
    
    # Validate summary
    print("   Checking transactions_summary.json...")
    errors = validate_transactions_summary(data['summary'])
    if errors:
        print(f"      ✗ Found {len(errors)} errors:")
        for err in errors:
            print(f"        - {err}")
        all_valid = False
    else:
        print("      ✓ Transactions summary valid")
    
    print()
    
    # Step 3: Cross-validate
    print("🔗 Step 3: Cross-validating data relationships...")
    errors = cross_validate_data(data['transactions'], data['profile'], data['summary'])
    if errors:
        print(f"   ✗ Found {len(errors)} errors:")
        for err in errors:
            print(f"     - {err}")
        all_valid = False
    else:
        print("   ✓ Data relationships valid")
    
    print()
    
    # Final result
    if all_valid:
        print("✅ All validations passed!")
        print("\n📊 Data Summary:")
        print(f"   Transactions: {len(data['transactions']['transactions'])}")
        print(f"   User: {data['profile']['full_name']}")
        print(f"   Net Worth: SAR {data['profile']['financial_summary']['total_net_worth']:,.2f}")
        print(f"   Accounts: {len(data['profile']['accounts'])}")
    else:
        print("❌ Validation failed. Please fix the errors above.")

if __name__ == '__main__':
    main()