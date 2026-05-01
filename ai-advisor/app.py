#app.py
"""
AI Advisor Flask Application
"""
from flask import Flask, jsonify
from flask_cors import CORS
from config import DEBUG, PORT, DATABASE_URL

# Import database
from models import db

# Import blueprints
from routes.health import health_bp
from routes.advisor import advisor_bp
from routes.actions import actions_bp

# Create Flask app
app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Initialize database
db.init_app(app)

# Enable CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Register blueprints
app.register_blueprint(health_bp)
app.register_blueprint(advisor_bp)
app.register_blueprint(actions_bp)

# Root endpoint
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'message': 'AI Advisor API - Database Edition',
        'version': '2.0.0',
        'data_source': 'PostgreSQL',
        'endpoints': {
            'health': '/health',
            'status': '/api/status',
            'advisor': '/api/get-advisor-insights (POST)'
        }
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

# Run app
if __name__ == '__main__':
    print(f"""
    ╔═══════════════════════════════════════════╗
    ║   AI Advisor API Server (Database)        ║
    ║   Running on http://localhost:{PORT}      ║
    ╚═══════════════════════════════════════════╝
    
    📍 Endpoints:
       GET  /health
       GET  /api/status
       POST /api/get-advisor-insights
    
    💾 Database: PostgreSQL
    🤖 AI: OpenAI GPT-4
    
    Press CTRL+C to stop
    """)
    
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        print("✅ Database tables ready")
    
    app.run(debug=DEBUG, port=PORT, host='0.0.0.0')