"""
Action Execution Service
Handles applying user recommendations
"""
from models import db, AIRecommendation, RecurringExpense, Marsa, Account, Bank
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

def execute_recommendation_action(recommendation_id, user_id, account_id=None):
    """
    Execute a recommendation action and mark it as applied
    
    Args:
        recommendation_id: Recommendation ID
        user_id: User ID
        account_id: Selected account ID (optional)
    
    Returns:
        dict: {success: bool, message: str, data: dict}
    """
    
    print(f"🔍 Looking for recommendation ID: '{recommendation_id}' for user: '{user_id}'")
    print(f"📋 Selected account ID: {account_id}")
    
    # Get the recommendation
    rec = AIRecommendation.query.filter_by(
        id=recommendation_id,
        user_id=user_id
    ).first()
    
    # DEBUG: Show all recommendations for this user
    all_recs = AIRecommendation.query.filter_by(user_id=user_id).all()
    print(f"📋 Found {len(all_recs)} total recommendations for user {user_id}:")
    for r in all_recs:
        print(f"   - ID: '{r.id}' | Type: {r.recommendation_type} | Applied: {r.is_applied}")
    
    if not rec:
        print(f"❌ Recommendation '{recommendation_id}' NOT FOUND in database")
        return {
            'success': False,
            'message': 'التوصية غير موجودة',
            'data': None
        }
    
    print(f"✅ Found recommendation: {rec.id}")
    
    if rec.is_applied:
        print(f"⚠️  Recommendation already applied")
        return {
            'success': False,
            'message': 'تم تطبيق هذه التوصية مسبقاً',
            'data': None
        }
    
    # Execute based on action type
    action_type = rec.action
    action_params = rec.action_params or {}
    
    print(f"🎯 Executing action: {action_type}")
    print(f"   Parameters: {action_params}")
    
    result = None
    
    try:
        if action_type == 'pay_zakah':
            result = schedule_zakah_payment(user_id, action_params, account_id)
        
        elif action_type == 'reduce_expense' or action_type == 'set_budget_alert':
            result = create_expense_alert(user_id, action_params, account_id)
        
        elif action_type == 'increase_savings':
            result = create_savings_goal(user_id, action_params, account_id)
        
        elif action_type == 'create_emergency_fund' or action_type == 'emergency_fund':
            result = create_emergency_fund(user_id, action_params, account_id)
        
        elif action_type == 'create_marasi':  # Support for create_marasi
            result = create_savings_goal(user_id, action_params, account_id)
        
        else:
            print(f"⚠️  Unknown action type: {action_type}")
            result = {
                'success': False,
                'message': f'نوع الإجراء غير مدعوم: {action_type}'
            }
        
        if result['success']:
            # Mark recommendation as applied
            rec.is_applied = True
            rec.applied_at = datetime.utcnow()
            db.session.commit()
            
            print(f"✅ Recommendation applied successfully")
            
            return {
                'success': True,
                'message': 'تم تطبيق التوصية بنجاح',
                'data': {
                    'recommendation_id': recommendation_id,
                    'action_result': result.get('data')
                }
            }
        else:
            print(f"❌ Action execution failed: {result.get('message')}")
            return result
    
    except Exception as e:
        print(f"❌ Exception during execution: {str(e)}")
        import traceback
        traceback.print_exc()
        
        db.session.rollback()
        return {
            'success': False,
            'message': f'حدث خطأ: {str(e)}',
            'data': None
        }


# ============ ACTION HANDLERS ============

def schedule_zakah_payment(user_id, params, account_id=None):
    """
    Create a zakah payment record when user applies the recommendation.
    Marks as COMPLETED to indicate user acknowledged and committed to paying.
    
    Args:
        user_id: User ID
        params: Action parameters
        account_id: Selected account ID (optional)
    """
    from models import ZakatPayment, ZakatPaymentReceiver
    from decimal import Decimal
    import uuid
    from datetime import datetime
    
    amount = params.get('amount', 0)
    
    if amount <= 0:
        print(f"❌ Invalid zakah amount: {amount}")
        return {
            'success': False,
            'message': 'مبلغ الزكاة غير صحيح'
        }
    
    print(f"💰 Creating zakah payment record: {amount} SAR for user {user_id}")
    
    # Get account - prefer selected account, fallback to first available
    if account_id:
        account = Account.query.filter_by(id=account_id).first()
        if account:
            print(f"✅ Using selected account: {account_id} ({account.account_type})")
        else:
            print(f"⚠️ Selected account {account_id} not found, using default")
            account = Account.query.join(Bank).filter(Bank.user_id == user_id).first()
    else:
        # Fallback to first account
        account = Account.query.join(Bank).filter(Bank.user_id == user_id).first()
    
    if not account:
        print(f"⚠️ No account found for user {user_id}, creating payment without account")
        final_account_id = None
    else:
        final_account_id = account.id
        print(f"📋 Using account: {final_account_id} ({account.account_type})")
    
    # Check if user has a default receiver
    default_receiver = ZakatPaymentReceiver.query.filter_by(
        user_id=user_id,
        is_default=True
    ).first()
    
    receiver_id = default_receiver.id if default_receiver else None
    
    if receiver_id:
        print(f"✅ Using default receiver: {default_receiver.label}")
    else:
        print(f"ℹ️  No default receiver set, creating payment without receiver")
    
    # Create zakah payment record
    payment_id = f'ZKT{uuid.uuid4().hex[:8].upper()}'
    
    zakah_payment = ZakatPayment(
        id=payment_id,
        user_id=user_id,
        calculation_id=None,  # Not linked to specific calculation
        account_id=final_account_id,
        amount=Decimal(str(amount)),
        currency='SAR',
        status='COMPLETED',  # Mark as completed (user acknowledged)
        receiver_id=receiver_id,
        to_iban=default_receiver.iban if default_receiver else None,
        bank_reference=None,
        is_automated=False,
        notes='تم التطبيق من توصيات المستشار المالي الذكي',
        paid_at=datetime.utcnow(),  # Set paid_at to now
        created_at=datetime.utcnow()
    )
    
    db.session.add(zakah_payment)
    db.session.commit()
    
    print(f"✅ Zakah payment created: {payment_id} - {amount} SAR (status: COMPLETED)")
    
    return {
        'success': True,
        'message': f'تم تسجيل دفع الزكاة بمبلغ {amount:,.2f} ريال',
        'data': {
            'payment_id': payment_id,
            'amount': float(amount),
            'status': 'COMPLETED',
            'account_id': final_account_id
        }
    }


def create_expense_alert(user_id, params, account_id=None):
    """
    Create budget alert for expense reduction
    
    Args:
        user_id: User ID
        params: Action parameters
        account_id: Selected account ID (optional)
    """
    category = params.get('category', 'general')
    target_amount = params.get('target_amount', 0)
    
    # For demo: Just log the alert
    # In production: Create actual budget alert linked to account
    
    print(f"⚠️ Budget alert created: {category} - target {target_amount} SAR")
    if account_id:
        print(f"📋 Linked to account: {account_id}")
    
    return {
        'success': True,
        'message': f'تم إنشاء تنبيه لتقليل مصروفات {category}',
        'data': {
            'category': category,
            'target_amount': target_amount,
            'account_id': account_id
        }
    }


def create_savings_goal(user_id, params, account_id=None):
    """
    Create a new savings goal (Marsa)
    
    Args:
        user_id: User ID
        params: Action parameters
        account_id: Selected account ID (optional)
    """
    # Handle all possible parameter names
    amount = params.get('amount') or params.get('target_amount') or params.get('suggested_monthly', 0)
    
    # If we only have suggested_monthly, calculate target (12 months)
    if not params.get('amount') and not params.get('target_amount') and params.get('suggested_monthly'):
        amount = params.get('suggested_monthly') * 12
    
    goal_name = params.get('goal_name', 'هدف ادخاري جديد')
    
    print(f"💰 Creating Marsa with target: {amount} SAR")
    print(f"📋 Goal name: {goal_name}")
    
    # Get account - prefer selected account, fallback to first available
    if account_id:
        account = Account.query.filter_by(id=account_id).first()
        if account:
            print(f"✅ Using selected account: {account_id} ({account.account_type})")
        else:
            print(f"⚠️ Selected account {account_id} not found, using default")
            account = Account.query.join(Bank).filter(Bank.user_id == user_id).first()
    else:
        # Fallback to first account
        account = Account.query.join(Bank).filter(Bank.user_id == user_id).first()
    
    if not account:
        print(f"❌ No account found for user {user_id}")
        return {
            'success': False,
            'message': 'لا يوجد حساب متاح لإنشاء الهدف'
        }
    
    print(f"📋 Using account: {account.id} ({account.account_type})")
    
    # Create Marsa
    marsa_id = f'MAR{uuid.uuid4().hex[:6].upper()}'
    target_date = datetime.utcnow().date() + timedelta(days=365)
    periodic_amount = Decimal(str(amount)) / 12  # Monthly contribution
    
    marsa = Marsa(
        id=marsa_id,
        user_id=user_id,
        account_id=account.id,
        title=goal_name,
        target_amount=Decimal(str(amount)),
        periodic_amount=periodic_amount,
        frequency='monthly',
        target_date=target_date,
        current_balance=Decimal('0'),
        status='active',
        next_deposit_at=datetime.utcnow() + timedelta(days=30)
    )
    
    db.session.add(marsa)
    db.session.commit()
    
    print(f"🎯 Savings goal created: {goal_name} - {amount} SAR (monthly: {periodic_amount})")
    print(f"✅ Linked to account: {account.id}")
    
    return {
        'success': True,
        'message': f'تم إنشاء هدف ادخاري بقيمة {amount} ريال',
        'data': {
            'marsa_id': marsa_id,
            'target_amount': float(amount),
            'monthly_contribution': float(periodic_amount),
            'account_id': account.id
        }
    }


def create_emergency_fund(user_id, params, account_id=None):
    """
    Create emergency fund savings goal
    
    Args:
        user_id: User ID
        params: Action parameters
        account_id: Selected account ID (optional)
    """
    amount = params.get('amount', 24000)
    
    return create_savings_goal(user_id, {
        'amount': amount,
        'goal_name': 'صندوق الطوارئ'
    }, account_id)