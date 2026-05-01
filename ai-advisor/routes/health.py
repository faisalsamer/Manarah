"""
Health Check Routes
"""
from flask import Blueprint, jsonify
import os

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check"""
    return jsonify({
        'status': 'healthy',
        'message': 'AI Advisor API is running',
        'version': '1.0.0'
    })

@health_bp.route('/api/status', methods=['GET'])
def status_check():
    """Detailed status check"""
    
    # Check if data files exist
    data_files = [
        'data/user_profile.json',
        'data/transactions_data.json',
        'data/transactions_summary.json',
        'data/halal_investments.json',
        'data/banks_data.json'
    ]
    
    files_status = {}
    all_files_exist = True
    
    for file_path in data_files:
        exists = os.path.exists(file_path)
        files_status[file_path] = 'OK' if exists else 'MISSING'
        if not exists:
            all_files_exist = False
    
    return jsonify({
        'status': 'healthy' if all_files_exist else 'degraded',
        'message': 'AI Advisor API',
        'data_files': files_status,
        'openai_configured': bool(os.getenv('OPENAI_API_KEY'))
    })