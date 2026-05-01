"""
Financial Service
Handles financial calculations (zakah, savings, expense analysis, etc.)
"""

# ============ ZAKAH CALCULATIONS ============

def calculate_zakah(net_worth, nisab_threshold=7480):
    """
    Calculate zakah (2.5% on wealth above nisab)
    
    Args:
        net_worth: Total net worth in SAR
        nisab_threshold: Nisab threshold (85g gold = ~7480 SAR)
    
    Returns:
        float: Zakah amount due (0 if below nisab)
    """
    if net_worth >= nisab_threshold:
        return round(net_worth * 0.025, 2)
    return 0.0

def is_zakah_due(net_worth, nisab_threshold=7480):
    """
    Check if zakah is due
    
    Returns:
        bool: True if zakah is due
    """
    return net_worth >= nisab_threshold

# ============ SAVINGS CALCULATIONS ============

def calculate_savings_rate(income, expenses):
    """
    Calculate savings rate as percentage
    
    Args:
        income: Monthly income
        expenses: Monthly expenses
    
    Returns:
        float: Savings rate percentage (0-100)
    """
    if income == 0:
        return 0.0
    
    savings = income - expenses
    rate = (savings / income) * 100
    return round(rate, 2)

def calculate_emergency_fund_months(current_savings, monthly_expenses):
    """
    Calculate how many months of expenses are covered by savings
    
    Args:
        current_savings: Total savings amount
        monthly_expenses: Average monthly expenses
    
    Returns:
        float: Number of months covered
    """
    if monthly_expenses == 0:
        return 0.0
    
    return round(current_savings / monthly_expenses, 1)

def is_emergency_fund_adequate(current_savings, monthly_expenses, target_months=6):
    """
    Check if emergency fund is adequate (recommended: 6 months)
    
    Returns:
        bool: True if emergency fund is adequate
    """
    months_covered = calculate_emergency_fund_months(current_savings, monthly_expenses)
    return months_covered >= target_months

# ============ SAVINGS GOALS ============

def calculate_goal_progress(current_amount, target_amount):
    """
    Calculate progress toward a savings goal
    
    Returns:
        float: Progress percentage (0-100)
    """
    if target_amount == 0:
        return 0.0
    
    progress = (current_amount / target_amount) * 100
    return round(min(progress, 100), 2)

def calculate_months_to_goal(goal_amount, current_amount, monthly_contribution):
    """
    Calculate months needed to reach savings goal
    
    Args:
        goal_amount: Target amount
        current_amount: Current saved amount
        monthly_contribution: Monthly savings amount
    
    Returns:
        float: Months needed (0 if already reached or no contribution)
    """
    remaining = goal_amount - current_amount
    
    if remaining <= 0:
        return 0.0
    
    if monthly_contribution <= 0:
        return float('inf')  # Never reach goal
    
    return round(remaining / monthly_contribution, 1)

def suggest_monthly_contribution(goal_amount, current_amount, target_months):
    """
    Suggest monthly contribution to reach goal in target months
    
    Returns:
        float: Recommended monthly contribution
    """
    remaining = goal_amount - current_amount
    
    if remaining <= 0:
        return 0.0
    
    if target_months <= 0:
        return 0.0
    
    return round(remaining / target_months, 2)

# ============ EXPENSE ANALYSIS ============

def analyze_expense_category(category, amount, income):
    """
    Analyze if an expense category is too high
    
    Args:
        category: Category name (e.g., 'rent', 'restaurants')
        amount: Amount spent in category
        income: Monthly income
    
    Returns:
        dict: Analysis result with status and recommendation
    """
    if income == 0:
        return {
            'category': category,
            'amount': amount,
            'percentage': 0,
            'status': 'unknown',
            'recommendation': None
        }
    
    percentage = round((amount / income) * 100, 1)
    
    # Define thresholds for different categories
    thresholds = {
        'rent': 30,           # Rent should be < 30% of income
        'groceries': 15,      # Groceries < 15%
        'restaurants': 10,    # Dining out < 10%
        'transport': 15,      # Transport < 15%
        'entertainment': 10,  # Entertainment < 10%
        'shopping': 10,       # Shopping < 10%
        'utilities': 10,      # Utilities < 10%
        'healthcare': 10      # Healthcare < 10%
    }
    
    threshold = thresholds.get(category, 15)  # Default 15%
    
    if percentage > threshold:
        reduction = round(amount - (income * threshold / 100), 2)
        return {
            'category': category,
            'amount': amount,
            'percentage': percentage,
            'threshold': threshold,
            'status': 'high',
            'overspending': reduction,
            'recommendation': f'Reduce {category} spending by SAR {reduction:.2f} to stay within {threshold}% of income'
        }
    else:
        return {
            'category': category,
            'amount': amount,
            'percentage': percentage,
            'threshold': threshold,
            'status': 'ok',
            'overspending': 0,
            'recommendation': None
        }

def analyze_all_expenses(expense_breakdown, income):
    """
    Analyze all expense categories
    
    Args:
        expense_breakdown: Dict of {category: amount}
        income: Monthly income
    
    Returns:
        list: List of analysis results for high-spending categories
    """
    issues = []
    
    for category, amount in expense_breakdown.items():
        analysis = analyze_expense_category(category, amount, income)
        
        if analysis['status'] == 'high':
            issues.append(analysis)
    
    # Sort by overspending amount (highest first)
    issues.sort(key=lambda x: x['overspending'], reverse=True)
    
    return issues

def find_top_expense_categories(expense_breakdown, top_n=5):
    """
    Find top N expense categories by amount
    
    Returns:
        list: Top categories sorted by amount
    """
    sorted_expenses = sorted(
        expense_breakdown.items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    return [
        {'category': cat, 'amount': amt}
        for cat, amt in sorted_expenses[:top_n]
    ]

# ============ SPENDING TRENDS ============

def calculate_spending_trend(current_month_expenses, previous_month_expenses):
    """
    Calculate spending trend (increasing/decreasing/stable)
    
    Returns:
        dict: Trend analysis
    """
    if previous_month_expenses == 0:
        return {
            'trend': 'stable',
            'change_percentage': 0,
            'change_amount': 0
        }
    
    change_amount = current_month_expenses - previous_month_expenses
    change_percentage = round((change_amount / previous_month_expenses) * 100, 1)
    
    # Determine trend
    if change_percentage > 10:
        trend = 'increasing'
    elif change_percentage < -10:
        trend = 'decreasing'
    else:
        trend = 'stable'
    
    return {
        'trend': trend,
        'change_percentage': change_percentage,
        'change_amount': round(change_amount, 2)
    }

# ============ INVESTMENT READINESS ============

def calculate_available_for_investment(income, expenses, emergency_fund, monthly_expenses):
    """
    Calculate how much user can afford to invest
    
    Args:
        income: Monthly income
        expenses: Monthly expenses
        emergency_fund: Current emergency fund
        monthly_expenses: Monthly expenses (for emergency fund check)
    
    Returns:
        dict: Investment readiness analysis
    """
    monthly_surplus = income - expenses
    emergency_months = calculate_emergency_fund_months(emergency_fund, monthly_expenses)
    
    # Need 6 months emergency fund first
    if emergency_months < 6:
        return {
            'can_invest': False,
            'available_amount': 0,
            'reason': 'Build emergency fund first (need 6 months of expenses)',
            'emergency_fund_shortfall': round((6 * monthly_expenses) - emergency_fund, 2)
        }
    
    # Can invest up to 50% of monthly surplus
    investable = round(monthly_surplus * 0.5, 2)
    
    return {
        'can_invest': True,
        'available_amount': investable,
        'monthly_surplus': monthly_surplus,
        'recommendation': f'You can invest up to SAR {investable:.2f} monthly'
    }

# ============ DEBT ANALYSIS ============

def calculate_debt_to_income_ratio(total_debt, monthly_income):
    """
    Calculate debt-to-income ratio
    
    Returns:
        dict: Debt analysis
    """
    if monthly_income == 0:
        return {
            'ratio': 0,
            'status': 'unknown'
        }
    
    ratio = round((total_debt / monthly_income) * 100, 1)
    
    # Determine status
    if ratio == 0:
        status = 'debt_free'
    elif ratio < 36:
        status = 'healthy'
    elif ratio < 50:
        status = 'manageable'
    else:
        status = 'high'
    
    return {
        'ratio': ratio,
        'status': status,
        'total_debt': total_debt
    }

# ============ FINANCIAL HEALTH SCORE ============

def calculate_financial_health_score(
    savings_rate,
    emergency_months,
    debt_to_income_ratio,
    zakah_paid_on_time
):
    """
    Calculate overall financial health score (0-100)
    
    Returns:
        dict: Financial health score and breakdown
    """
    score = 0
    breakdown = {}
    
    # Savings rate (30 points)
    if savings_rate >= 20:
        savings_points = 30
    elif savings_rate >= 10:
        savings_points = 20
    elif savings_rate >= 5:
        savings_points = 10
    else:
        savings_points = 0
    
    score += savings_points
    breakdown['savings_rate'] = savings_points
    
    # Emergency fund (30 points)
    if emergency_months >= 6:
        emergency_points = 30
    elif emergency_months >= 3:
        emergency_points = 20
    elif emergency_months >= 1:
        emergency_points = 10
    else:
        emergency_points = 0
    
    score += emergency_points
    breakdown['emergency_fund'] = emergency_points
    
    # Debt management (25 points)
    if debt_to_income_ratio == 0:
        debt_points = 25
    elif debt_to_income_ratio < 36:
        debt_points = 20
    elif debt_to_income_ratio < 50:
        debt_points = 10
    else:
        debt_points = 0
    
    score += debt_points
    breakdown['debt_management'] = debt_points
    
    # Zakah compliance (15 points)
    zakah_points = 15 if zakah_paid_on_time else 0
    score += zakah_points
    breakdown['zakah_compliance'] = zakah_points
    
    # Determine grade
    if score >= 80:
        grade = 'Excellent'
    elif score >= 60:
        grade = 'Good'
    elif score >= 40:
        grade = 'Fair'
    else:
        grade = 'Needs Improvement'
    
    return {
        'score': score,
        'grade': grade,
        'breakdown': breakdown
    }