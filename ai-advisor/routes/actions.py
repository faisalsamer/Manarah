"""
Action Routes
Endpoints for executing recommendations
"""
from flask import Blueprint, request, jsonify
from services.action_service import execute_recommendation_action
from services.user_resolver import resolve_user_id
import traceback

actions_bp = Blueprint('actions', __name__)
@actions_bp.route('/api/execute-recommendation', methods=['POST'])
def execute_recommendation():
    """Execute a recommendation action"""
    try:
        print("=" * 60)
        print("🔧 /api/execute-recommendation called")

        data = request.get_json(force=True, silent=True)
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        recommendation_id = data.get('recommendation_id')
        user_id = data.get('user_id')
        account_id = data.get('account_id')  # NEW: Get selected account
        
        print(f"🔍 Extracted values:")
        print(f"   recommendation_id: {recommendation_id}")
        print(f"   user_id: {user_id}")
        print(f"   account_id: {account_id}")  # NEW

        if not recommendation_id or not user_id:
            return jsonify({
                'success': False,
                'message': 'recommendation_id and user_id are required'
            }), 400

        user_id = resolve_user_id(user_id)

        # Execute the action with account_id
        result = execute_recommendation_action(recommendation_id, user_id, account_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@actions_bp.route('/api/get-user-progress', methods=['GET'])
def get_user_progress():
    """
    Get user's progress on applied recommendations
    
    Query params:
        user_id: User identifier
    
    Response:
        {
            "success": true,
            "data": {
                "total_recommendations": 10,
                "applied_recommendations": 5,
                "progress_percentage": 50
            }
        }
    """
    try:
        user_id = resolve_user_id(request.args.get('user_id', 'CUST001'))

        from models import AIRecommendation
        
        total = AIRecommendation.query.filter_by(user_id=user_id).count()
        applied = AIRecommendation.query.filter_by(
            user_id=user_id,
            is_applied=True
        ).count()
        
        progress = (applied / total * 100) if total > 0 else 0
        
        return jsonify({
            'success': True,
            'data': {
                'total_recommendations': total,
                'applied_recommendations': applied,
                'progress_percentage': round(progress, 1)
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500