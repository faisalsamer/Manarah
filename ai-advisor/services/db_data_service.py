"""
Database Data Service
Handles reading data from PostgreSQL database
"""
from models import (
    db, User, Bank, Account, RecurringExpense, 
    Marsa, UserZakatSettings, ZakatAsset, AIRecommendation
)
from sqlalchemy import func
from decimal import Decimal
from datetime import datetime
import json

# ============ USER & ACCOUNTS ============

def get_user_profile_from_db(user_id):
    """Get user profile from database"""
    user = User.query.get(user_id)
    if not user:
        return None
    
    # Get all accounts across all banks
    accounts = []
    total_balance = Decimal('0')
    
    for bank in user.banks:
        if bank.is_connected:
            for account in bank.accounts:
                accounts.append({
                    'account_id': account.id,
                    'bank_id': bank.bank_id,
                    'bank_name': bank.bank_name,
                    'account_type': account.account_type,
                    'balance': float(account.balance),
                    'currency': account.currency
                })
                total_balance += account.balance
    
    # Calculate financial summary
    monthly_expenses = calculate_monthly_expenses(user_id)
    monthly_income = calculate_monthly_income(user_id)
    
    return {
        'user_id': user.id,
        'full_name': user.name,
        'email': user.email,
        'accounts': accounts,
        'financial_summary': {
            'total_net_worth': float(total_balance),
            'monthly_income': float(monthly_income),
            'monthly_expenses': float(monthly_expenses),
            'current_savings': float(get_savings_balance(user_id)),
            'available_cash': float(get_available_cash(user_id)),
            'total_debt': 0,
            'savings_rate': calculate_savings_rate(monthly_income, monthly_expenses)
        },
        'savings_goals': get_savings_goals(user_id),
        'zakah_info': get_zakah_info(user_id)
    }


def calculate_monthly_expenses(user_id):
    """Calculate total monthly recurring expenses"""
    expenses = RecurringExpense.query.filter_by(
        user_id=user_id,
        status='active'
    ).all()
    
    total = Decimal('0')
    for expense in expenses:
        if expense.amount_type == 'fixed' and expense.amount:
            # Convert to monthly
            if expense.unit == 'month':
                total += expense.amount
            elif expense.unit == 'week':
                total += (expense.amount * 4)
            elif expense.unit == 'day':
                total += (expense.amount * 30)
    
    return total


def calculate_monthly_income(user_id):
    """Calculate monthly income (hardcoded for now or from transactions)"""
    # TODO: Calculate from actual transactions
    # For now, use a default or query from a salary expense type
    return Decimal('8000')  # Default


def get_savings_balance(user_id):
    """Get balance in savings accounts"""
    savings_accounts = Account.query.join(Bank).filter(
        Bank.user_id == user_id,
        Account.account_type == 'savings'
    ).all()
    
    return sum(acc.balance for acc in savings_accounts)


def get_available_cash(user_id):
    """Get available cash (non-savings accounts)"""
    cash_accounts = Account.query.join(Bank).filter(
        Bank.user_id == user_id,
        Account.account_type.in_(['salary', 'current'])
    ).all()
    
    return sum(acc.balance for acc in cash_accounts)


def calculate_savings_rate(income, expenses):
    """Calculate savings rate percentage"""
    if income == 0:
        return 0
    return round(float((income - expenses) / income * 100), 2)


def get_savings_goals(user_id):
    """Get user's savings goals (Marasi)"""
    marasi = Marsa.query.filter_by(
        user_id=user_id,
        status='active'
    ).all()
    
    goals = []
    for marsa in marasi:
        progress = (marsa.current_balance / marsa.target_amount * 100) if marsa.target_amount > 0 else 0
        goals.append({
            'goal_id': marsa.id,
            'name': marsa.title,
            'target_amount': float(marsa.target_amount),
            'current_amount': float(marsa.current_balance),
            'monthly_contribution': float(marsa.periodic_amount),
            'target_date': marsa.target_date.isoformat() if marsa.target_date else None,
            'progress_percentage': round(float(progress), 1),
            'status': marsa.status
        })
    
    return goals


def get_zakah_info(user_id):
    """Get zakah information"""
    settings = UserZakatSettings.query.filter_by(user_id=user_id).first()
    
    if not settings:
        # Default zakah info
        return {
            'net_worth_for_zakah': 0,
            'zakah_due': 0,
            'nisab_threshold': 7480,
            'is_due': False,
            'last_paid': None,
            'next_due': None
        }
    
    # Calculate net worth
    net_worth = calculate_net_worth_for_zakah(user_id)
    nisab = 7480  # SAR (85g gold approximation)
    
    zakah_due = float(net_worth * Decimal('0.025')) if net_worth >= nisab else 0
    
    return {
        'net_worth_for_zakah': float(net_worth),
        'zakah_due': round(zakah_due, 2),
        'nisab_threshold': nisab,
        'is_due': net_worth >= nisab,
        'last_paid': settings.last_zakat_payment_date.isoformat() if settings.last_zakat_payment_date else None,
        'next_due': None  # Calculate based on lunar calendar
    }


def calculate_net_worth_for_zakah(user_id):
    """Calculate total net worth for zakah calculation"""
    # Bank balances
    accounts = Account.query.join(Bank).filter(Bank.user_id == user_id).all()
    bank_total = sum(acc.balance for acc in accounts)
    
    # Zakat assets
    assets = ZakatAsset.query.filter_by(
        user_id=user_id,
        status='ACTIVE'
    ).all()
    assets_total = sum(asset.amount for asset in assets)
    
    return bank_total + assets_total


# ============ TRANSACTIONS SUMMARY ============

def get_transactions_summary_from_db(user_id):
    """Get aggregated transaction summary from database"""
    # This would normally aggregate from payment_transactions table
    # For now, we'll return a simplified version
    
    # Get expenses
    monthly_expenses = calculate_monthly_expenses(user_id)
    monthly_income = calculate_monthly_income(user_id)
    
    # Get expense breakdown by category
    expenses = RecurringExpense.query.filter_by(
        user_id=user_id,
        status='active'
    ).all()
    
    category_breakdown = {}
    for expense in expenses:
        if expense.amount_type == 'fixed' and expense.amount:
            # Use title as category (or add category field to model)
            category = expense.title.lower()
            if category not in category_breakdown:
                category_breakdown[category] = 0
            category_breakdown[category] += float(expense.amount)
    
    return {
        'user_id': user_id,
        'last_30_days': {
            'total_income': float(monthly_income),
            'total_expenses': float(monthly_expenses),
            'by_category': category_breakdown
        },
        'last_3_months': {
            'average_monthly_income': float(monthly_income),
            'average_monthly_expenses': float(monthly_expenses)
        }
    }


# ============ INVESTMENTS ============

def get_halal_investments_from_json():
    """Get halal investments from JSON file (static data)"""
    # Investments are static, keep from JSON
    from services.data_service import get_halal_investments
    return get_halal_investments()


# ============ AI RECOMMENDATIONS ============
def save_ai_recommendation(user_id, recommendation):
    """Save AI-generated recommendation to database"""
    import uuid
    
    # Get the message text
    message_text = recommendation.get('message', '')
    
    # DB column is UUID — must be a real UUID, not a 'rec_<hex>' string.
    rec_id = str(uuid.uuid4())

    # Write the real DB id back into the dict so the caller's list stays in sync.
    # Without this, the response returns the old/missing id while the DB has the UUID.
    recommendation['id'] = rec_id

    print(f"💾 Saving recommendation with ID: {rec_id}")
    print(f"   Type: {recommendation.get('type')}")
    print(f"   Action: {recommendation.get('action')}")
    print(f"   Priority: {recommendation.get('priority')}")
    
    rec = AIRecommendation(
        id=rec_id,  # Use AI-generated ID
        user_id=user_id,
        recommendation_type=recommendation.get('type', 'general'),
        title=recommendation.get('type', 'Recommendation'),
        description=message_text,
        message=message_text,
        action=recommendation.get('action', ''),
        action_params=recommendation.get('action_params'),
        priority=recommendation.get('priority', 'medium')
    )
    
    db.session.add(rec)
    db.session.commit()
    
    print(f"✅ Saved recommendation: {rec.id}")
    
    return rec.id


def mark_recommendation_applied(recommendation_id):
    """Mark a recommendation as applied"""
    rec = AIRecommendation.query.get(recommendation_id)
    if rec:
        rec.is_applied = True
        rec.applied_at = datetime.utcnow()
        db.session.commit()
        return True
    return False