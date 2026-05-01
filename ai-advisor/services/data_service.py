"""
Data Service
Handles reading and writing JSON data files
"""
import json
import os

DATA_DIR = 'data'

# ============ CORE JSON OPERATIONS ============

def read_json(filename):
    """
    Read JSON file from data directory
    
    Args:
        filename: Name of JSON file (e.g., 'user_profile.json')
    
    Returns:
        dict or list: Parsed JSON data
    
    Raises:
        FileNotFoundError: If file doesn't exist
    """
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def write_json(filename, data):
    """
    Write JSON file to data directory
    
    Args:
        filename: Name of JSON file
        data: Data to write
    """
    filepath = os.path.join(DATA_DIR, filename)
    
    # Ensure directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# ============ USER PROFILE ============

def get_user_profile(user_id='CUST001'):
    """
    Get user profile data
    
    Args:
        user_id: User identifier (default: CUST001)
    
    Returns:
        dict: User profile data or None if not found
    """
    try:
        data = read_json('user_profile.json')
        
        # If file contains single user object
        if data.get('user_id') == user_id:
            return data
        
        # If file is a dictionary of users
        if isinstance(data, dict) and user_id in data:
            return data[user_id]
        
        return None
    except FileNotFoundError:
        return None

def get_user_accounts(user_id='CUST001'):
    """
    Get all accounts for a user
    
    Args:
        user_id: User identifier
    
    Returns:
        list: List of account objects
    """
    profile = get_user_profile(user_id)
    return profile.get('accounts', []) if profile else []

def get_account_by_id(account_id, user_id='CUST001'):
    """
    Get specific account by ID
    
    Args:
        account_id: Account identifier (e.g., 'ACC001')
        user_id: User identifier
    
    Returns:
        dict: Account data or None if not found
    """
    accounts = get_user_accounts(user_id)
    for account in accounts:
        if account['account_id'] == account_id:
            return account
    return None

def get_financial_summary(user_id='CUST001'):
    """
    Get user's financial summary
    
    Args:
        user_id: User identifier
    
    Returns:
        dict: Financial summary data
    """
    profile = get_user_profile(user_id)
    return profile.get('financial_summary', {}) if profile else {}

def get_savings_goals(user_id='CUST001'):
    """
    Get user's savings goals
    
    Args:
        user_id: User identifier
    
    Returns:
        list: List of savings goal objects
    """
    profile = get_user_profile(user_id)
    return profile.get('savings_goals', []) if profile else []

def get_zakah_info(user_id='CUST001'):
    """
    Get user's zakah information
    
    Args:
        user_id: User identifier
    
    Returns:
        dict: Zakah data including due amount and dates
    """
    profile = get_user_profile(user_id)
    return profile.get('zakah_info', {}) if profile else {}

def update_user_profile(user_id, updates):
    """
    Update user profile with new data
    
    Args:
        user_id: User identifier
        updates: Dictionary of fields to update
    
    Returns:
        bool: True if updated, False if user not found
    """
    try:
        data = read_json('user_profile.json')
        
        if data.get('user_id') == user_id:
            data.update(updates)
            write_json('user_profile.json', data)
            return True
        
        return False
    except FileNotFoundError:
        return False

# ============ TRANSACTIONS SUMMARY ============

def get_transactions_summary(user_id='CUST001'):
    """
    Get aggregated transaction summary
    
    Args:
        user_id: User identifier
    
    Returns:
        dict: Transaction summary data or None
    """
    try:
        data = read_json('transactions_summary.json')
        
        if data.get('user_id') == user_id:
            return data
        
        return None
    except FileNotFoundError:
        return None

def get_last_30_days_summary(user_id='CUST001'):
    """
    Get last 30 days transaction summary
    
    Args:
        user_id: User identifier
    
    Returns:
        dict: Summary of last 30 days transactions
    """
    summary = get_transactions_summary(user_id)
    return summary.get('last_30_days', {}) if summary else {}

def get_last_3_months_summary(user_id='CUST001'):
    """
    Get last 3 months summary
    
    Args:
        user_id: User identifier
    
    Returns:
        dict: Summary of last 3 months
    """
    summary = get_transactions_summary(user_id)
    return summary.get('last_3_months', {}) if summary else {}

def get_year_to_date_summary(user_id='CUST001'):
    """
    Get year to date summary
    
    Args:
        user_id: User identifier
    
    Returns:
        dict: Year to date summary
    """
    summary = get_transactions_summary(user_id)
    return summary.get('year_to_date', {}) if summary else {}

def get_category_spending(user_id='CUST001', period='last_30_days'):
    """
    Get spending by category for a time period
    
    Args:
        user_id: User identifier
        period: 'last_30_days', 'last_3_months', or 'year_to_date'
    
    Returns:
        dict: Category spending {category: amount}
    """
    summary = get_transactions_summary(user_id)
    if not summary:
        return {}
    
    period_data = summary.get(period, {})
    return period_data.get('by_category', {})

def get_account_spending(user_id='CUST001', period='last_30_days'):
    """
    Get spending/income by account for a time period
    
    Args:
        user_id: User identifier
        period: 'last_30_days' (only period with account breakdown)
    
    Returns:
        dict: Account data {account_id: {income: X, expenses: Y}}
    """
    summary = get_transactions_summary(user_id)
    if not summary:
        return {}
    
    period_data = summary.get(period, {})
    return period_data.get('by_account', {})

def get_monthly_breakdown(user_id='CUST001'):
    """
    Get monthly transaction breakdown
    
    Args:
        user_id: User identifier
    
    Returns:
        dict: Monthly data by month key
    """
    summary = get_transactions_summary(user_id)
    if not summary:
        return {}
    
    return summary.get('monthly_breakdown', {})

# ============ HALAL INVESTMENTS ============

def get_halal_investments():
    """
    Get all halal investment options
    
    Returns:
        dict: Investment data by type {etfs: [], sukuk: [], stocks: []}
    """
    try:
        return read_json('halal_investments.json')
    except FileNotFoundError:
        # Return empty structure if file doesn't exist yet
        return {'etfs': [], 'sukuk': [], 'stocks': []}

def get_investments_by_type(investment_type):
    """
    Get investments of a specific type
    
    Args:
        investment_type: 'etfs', 'sukuk', or 'stocks'
    
    Returns:
        list: List of investments of that type
    """
    all_investments = get_halal_investments()
    return all_investments.get(investment_type, [])

def filter_investments_by_amount(max_amount):
    """
    Filter investments by maximum investment amount
    
    Args:
        max_amount: Maximum amount user can invest
    
    Returns:
        dict: Filtered investments by type
    """
    all_investments = get_halal_investments()
    filtered = {'etfs': [], 'sukuk': [], 'stocks': []}
    
    for inv_type in ['etfs', 'sukuk', 'stocks']:
        for investment in all_investments.get(inv_type, []):
            if investment.get('min_investment', 0) <= max_amount:
                filtered[inv_type].append(investment)
    
    return filtered

def filter_investments_by_risk(risk_level):
    """
    Filter investments by risk level
    
    Args:
        risk_level: 'low', 'medium', or 'high'
    
    Returns:
        dict: Filtered investments by type
    """
    all_investments = get_halal_investments()
    filtered = {'etfs': [], 'sukuk': [], 'stocks': []}
    
    for inv_type in ['etfs', 'sukuk', 'stocks']:
        for investment in all_investments.get(inv_type, []):
            if investment.get('risk_level') == risk_level:
                filtered[inv_type].append(investment)
    
    return filtered

def get_suitable_investments(available_cash, risk_tolerance='medium', limit=10):
    """
    Get suitable investments based on user criteria
    
    Args:
        available_cash: Amount user can invest
        risk_tolerance: 'low', 'medium', or 'high'
        limit: Maximum number of investments to return
    
    Returns:
        list: Sorted list of suitable investments
    """
    all_investments = get_halal_investments()
    suitable = []
    
    # Define risk hierarchy
    risk_levels = {'low': 1, 'medium': 2, 'high': 3}
    max_risk = risk_levels.get(risk_tolerance, 2)
    
    for inv_type in ['etfs', 'sukuk', 'stocks']:
        for investment in all_investments.get(inv_type, []):
            # Filter by amount
            min_investment = investment.get('min_investment', 0)
            if min_investment > available_cash:
                continue
            
            # Filter by risk (allow same or lower risk)
            inv_risk = risk_levels.get(investment.get('risk_level', 'medium'), 2)
            if inv_risk > max_risk:
                continue
            
            suitable.append(investment)
    
    # Sort by expected return (descending)
    # Extract numeric value from "8-12%" format
    def get_return_value(inv):
        ret_str = inv.get('expected_return', '0%')
        # Get first number from "8-12%" -> 8
        try:
            return int(ret_str.split('-')[0].replace('%', ''))
        except:
            return 0
    
    suitable.sort(key=get_return_value, reverse=True)
    
    return suitable[:limit]

# ============ RAW TRANSACTIONS (if needed) ============

def get_all_transactions():
    """
    Get all raw transactions
    
    Returns:
        list: List of all transaction objects
    """
    try:
        data = read_json('transactions_data.json')
        return data.get('transactions', [])
    except FileNotFoundError:
        return []

def get_user_transactions(user_id='CUST001', limit=None):
    """
    Get transactions for specific user
    
    Args:
        user_id: User identifier
        limit: Maximum number of transactions to return
    
    Returns:
        list: List of user's transactions
    """
    all_txns = get_all_transactions()
    user_txns = [t for t in all_txns if t.get('customer_id') == user_id]
    
    # Sort by date descending (most recent first)
    user_txns.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    if limit:
        return user_txns[:limit]
    
    return user_txns

def get_account_transactions(account_id, user_id='CUST001', limit=None):
    """
    Get transactions for specific account
    
    Args:
        account_id: Account identifier
        user_id: User identifier
        limit: Maximum number of transactions
    
    Returns:
        list: List of account transactions
    """
    user_txns = get_user_transactions(user_id)
    account_txns = [t for t in user_txns if t.get('account_id') == account_id]
    
    if limit:
        return account_txns[:limit]
    
    return account_txns

def get_transactions_by_category(category, user_id='CUST001', limit=None):
    """
    Get transactions by category
    
    Args:
        category: Transaction category (e.g., 'groceries')
        user_id: User identifier
        limit: Maximum number of transactions
    
    Returns:
        list: List of transactions in that category
    """
    user_txns = get_user_transactions(user_id)
    category_txns = [t for t in user_txns if t.get('category') == category]
    
    if limit:
        return category_txns[:limit]
    
    return category_txns