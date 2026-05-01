"""
Input Validators
Validate API input data
"""

def validate_user_data(data):
    """Validate user data for advisor endpoint"""
    required_fields = ['user_id', 'monthly_income', 'monthly_expenses']
    
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    return True, None
