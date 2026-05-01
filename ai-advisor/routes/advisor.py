"""
Advisor Routes
Main API endpoint for AI advisor insights
"""
from flask import Blueprint, request, jsonify
from services.recommendation_service import generate_user_recommendations, get_single_recommendation
from services.db_data_service import get_transactions_summary_from_db  # ADD THIS
from services.user_resolver import resolve_user_id
from models import Marsa  # ADD THIS
import traceback
from models import db  # IMPORTANT!
from datetime import datetime  # IMPORTANT!

advisor_bp = Blueprint('advisor', __name__)

@advisor_bp.route('/api/get-advisor-insights', methods=['POST'])
def get_advisor_insights():
    """
    Main endpoint for AI advisor
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate user_id
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400

        user_id = resolve_user_id(user_id)
        print(f"🔍 Generating recommendations for user: {user_id}")

        result = generate_user_recommendations(user_id)
        
        print(f"✅ Successfully generated {len(result.get('recommendations', []))} recommendations")
        
        # Return successful response
        return jsonify({
            'success': True,
            'data': result
        }), 200
    
    except FileNotFoundError as e:
        print(f"❌ FileNotFoundError: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'User data not found: {str(e)}'
        }), 404
    
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@advisor_bp.route('/api/get-next-recommendation', methods=['POST'])
def get_next_recommendation():
    """
    Return one replacement recommendation after one is applied
    
    Request:
        {
            "user_id": "CUST001",
            "exclude_ids": ["rec_1", "rec_2"]  // IDs already showing
        }
    
    Response:
        {
            "success": true,
            "recommendation": {...}
        }
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        user_id = resolve_user_id(data.get('user_id', 'CUST001'))
        exclude_ids = data.get('exclude_ids', [])

        print(f"🔄 Getting next recommendation for user {user_id}")
        print(f"   Excluding: {exclude_ids}")

        rec = get_single_recommendation(user_id, exclude_ids)

        return jsonify({'success': True, 'recommendation': rec}), 200

    except Exception as e:
        print(f"❌ get_next_recommendation error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@advisor_bp.route('/api/get-advisor-insights', methods=['GET'])
def get_advisor_insights_get():
    """
    GET version for quick testing
    """
    try:
        user_id = resolve_user_id(request.args.get('user_id', 'CUST001'))

        print(f"🔍 GET request for user: {user_id}")

        result = generate_user_recommendations(user_id)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
    
    except Exception as e:
        print(f"❌ GET ERROR: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
@advisor_bp.route('/api/get-marasi-goals', methods=['POST'])
def get_marasi_goals():
    """Get user's savings goals (marasi)"""
    data = request.json
    user_id = resolve_user_id(data.get('user_id', 'CUST001'))

    marasi_list = Marsa.query.filter_by(
        user_id=user_id,
        status='active'
    ).order_by(Marsa.target_amount.desc()).all()
    
    goals = []
    for m in marasi_list:
        progress = float(m.current_balance / m.target_amount * 100) if m.target_amount > 0 else 0
        goals.append({
            'id': m.id,
            'title': m.title,
            'target_amount': float(m.target_amount),
            'current_balance': float(m.current_balance),
            'periodic_amount': float(m.periodic_amount),
            'frequency': m.frequency,
            'progress': round(progress, 1),
            'target_date': m.target_date.isoformat() if m.target_date else None
        })
    
    return jsonify({'success': True, 'data': goals})


@advisor_bp.route('/api/get-expense-summary', methods=['POST'])
def get_expense_summary():
    """Get transaction summary from JSON"""
    data = request.json
    user_id = resolve_user_id(data.get('user_id', 'CUST001'))

    # Use existing function
    summary = get_transactions_summary_from_db(user_id)
    
    return jsonify({'success': True, 'data': summary})

@advisor_bp.route('/api/get-user-banks-accounts', methods=['POST'])
def get_user_banks_accounts():
    """
    Get user's connected banks and accounts from JSON
    Returns only banks where is_user_connected = true
    """
    import json
    import os
    
    data = request.json
    user_id = data.get('user_id', 'CUST001')
    
    try:
        # FIXED: Correct filename is banks_data.json
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        json_path = os.path.join(root_dir, 'data', 'banks_data.json')  # Changed from banks.json
        
        print(f"📂 Looking for banks_data.json at: {json_path}")
        
        if not os.path.exists(json_path):
            print(f"❌ File not found at: {json_path}")
            return jsonify({
                'success': False,
                'error': f'banks_data.json not found at {json_path}'
            }), 500
        
        with open(json_path, 'r', encoding='utf-8') as f:
            banks_data = json.load(f)
        
        print(f"✅ Loaded banks data successfully")
        
        # Filter banks that are connected and have the user as customer
        connected_banks = []
        for bank in banks_data['banks']:
            if bank.get('is_user_connected'):
                # Find customer data for this user
                customer = next(
                    (c for c in bank.get('customers', []) if c['customer_id'] == user_id),
                    None
                )
                
                if customer:
                    connected_banks.append({
                        'bank_id': bank['bank_id'],
                        'bank_name': bank['bank_name'],
                        'bank_name_ar': bank['bank_name_ar'],
                        'bank_code': bank['bank_code'],
                        'bank_type': bank['type'],
                        'accounts': [
                            {
                                'account_id': acc['account_id'],
                                'account_name': acc['account_name'],
                                'account_number': acc['account_number'],
                                'account_type': acc['account_type'],
                                'iban': acc['iban'],
                                'balance': acc['balance'],
                                'currency': acc['currency'],
                                'is_primary': acc.get('is_primary', False)
                            }
                            for acc in customer.get('accounts', [])
                        ]
                    })
        
        print(f"✅ Found {len(connected_banks)} connected banks")
        print(f"✅ Total accounts: {sum(len(b['accounts']) for b in connected_banks)}")
        
        return jsonify({
            'success': True,
            'data': {
                'banks': connected_banks,
                'total_banks': len(connected_banks),
                'total_accounts': sum(len(b['accounts']) for b in connected_banks)
            }
        })
    
    except Exception as e:
        print(f"❌ Error loading banks: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
@advisor_bp.route('/api/get-user-transactions-history', methods=['POST'])
def get_user_transactions_history():
    """
    Get user's transaction history from applied recommendations and investments
    Returns chronological list of all actions taken
    """
    from models import AIRecommendation, ZakatPayment, Marsa
    from datetime import datetime

    data = request.json
    user_id = resolve_user_id(data.get('user_id', 'CUST001'))
    
    try:
        transactions = []
        
        # Get applied recommendations (including investments)
        applied_recs = AIRecommendation.query.filter_by(
            user_id=user_id,
            is_applied=True
        ).order_by(AIRecommendation.applied_at.desc()).all()
        
        for rec in applied_recs:
            # Determine icon and type based on recommendation_type
            if rec.recommendation_type == 'investment':
                icon = '📈'
                transaction_type = 'investment'
            else:
                icon = '💡'
                transaction_type = 'recommendation'
            
            # Get amount from action_params
            amount = None
            if rec.action_params:
                if rec.recommendation_type == 'investment':
                    amount = rec.action_params.get('min_investment')
                else:
                    amount = rec.action_params.get('amount')
            
            transactions.append({
                'id': rec.id,
                'type': transaction_type,
                'action_type': rec.action,
                'title': rec.title or rec.recommendation_type,
                'description': rec.message,
                'amount': amount,
                'status': 'completed',
                'created_at': rec.applied_at.isoformat() if rec.applied_at else rec.created_at.isoformat(),
                'icon': icon
            })
        
        # Get zakah payments
        zakah_payments = ZakatPayment.query.filter_by(
            user_id=user_id
        ).order_by(ZakatPayment.created_at.desc()).limit(10).all()
        
        for payment in zakah_payments:
            transactions.append({
                'id': payment.id,
                'type': 'zakah_payment',
                'action_type': 'pay_zakah',
                'title': 'دفع الزكاة',
                'description': f'تم دفع الزكاة بمبلغ {float(payment.amount):,.2f} ريال',
                'amount': float(payment.amount),
                'status': payment.status.lower(),
                'created_at': payment.paid_at.isoformat() if payment.paid_at else payment.created_at.isoformat(),
                'icon': '🕌'
            })
        
        # Get created marasi (savings goals)
        marasi = Marsa.query.filter_by(
            user_id=user_id
        ).order_by(Marsa.created_at.desc()).limit(10).all()
        
        for marsa in marasi:
            transactions.append({
                'id': marsa.id,
                'type': 'savings_goal',
                'action_type': 'create_marasi',
                'title': marsa.title,
                'description': f'هدف ادخاري بقيمة {float(marsa.target_amount):,.2f} ريال',
                'amount': float(marsa.target_amount),
                'status': marsa.status,
                'created_at': marsa.created_at.isoformat(),
                'icon': '🎯'
            })
        
        # Sort all transactions by date (newest first)
        transactions.sort(key=lambda x: x['created_at'], reverse=True)
        
        print(f"✅ Found {len(transactions)} transactions for user {user_id}")
        print(f"   - Investments: {len([t for t in transactions if t['type'] == 'investment'])}")
        print(f"   - Recommendations: {len([t for t in transactions if t['type'] == 'recommendation'])}")
        
        return jsonify({
            'success': True,
            'data': {
                'transactions': transactions,
                'total': len(transactions)
            }
        })
    
    except Exception as e:
        print(f"❌ Error fetching transactions: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advisor_bp.route('/api/track-investment', methods=['POST'])
def track_investment():
    """
    Track when user invests in an opportunity
    Stores in AIRecommendation table with type='investment'
    """
    from models import AIRecommendation, Account
    import uuid

    data = request.json
    user_id = resolve_user_id(data.get('user_id', 'CUST001'))
    investment_name = data.get('investment_name')
    investment_data = data.get('investment_data', {})
    account_id = data.get('account_id')
    
    try:
        # DB column is UUID — must be a real UUID, not an 'INV<hex>' string.
        investment_id = str(uuid.uuid4())
        
        # Get account info if provided
        account_info = None
        if account_id:
            account = Account.query.filter_by(id=account_id).first()
            if account:
                account_info = f"من حساب {account.account_type}"
        
        investment_rec = AIRecommendation(
            id=investment_id,
            user_id=user_id,
            recommendation_type='investment',
            title=investment_data.get('name_ar', investment_name),
            description=f"استثمار في {investment_data.get('name_ar', investment_name)}",
            message=investment_data.get('reason', f"استثمار بحد أدنى {investment_data.get('min_investment', 0)} ريال"),
            action='invest',
            action_params={
                'investment_name': investment_name,
                'min_investment': investment_data.get('min_investment'),
                'expected_return': investment_data.get('expected_return'),
                'risk_level': investment_data.get('risk_level'),
                'account_id': account_id
            },
            priority='medium',
            is_applied=True,
            applied_at=datetime.utcnow()
        )
        
        db.session.add(investment_rec)
        db.session.commit()
        
        print(f"✅ Investment tracked: {investment_id} - {investment_name}")
        
        return jsonify({
            'success': True,
            'message': 'تم تسجيل الاستثمار بنجاح',
            'data': {
                'investment_id': investment_id
            }
        })
    
    except Exception as e:
        print(f"❌ Error tracking investment: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500