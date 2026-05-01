"""
Calculation Utilities
Helper functions for financial calculations
"""

def format_currency(amount, currency='SAR'):
    """Format currency with proper decimals"""
    return f"{currency} {amount:,.2f}"

def percentage(part, whole):
    """Calculate percentage"""
    if whole == 0:
        return 0
    return round((part / whole) * 100, 2)
