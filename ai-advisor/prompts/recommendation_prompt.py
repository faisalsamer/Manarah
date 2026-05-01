"""
Recommendation Prompt Template
High-quality prompt engineering for accurate financial recommendations
"""

def build_recommendation_prompt(user_data, financial_analysis, expense_issues):
    """
    Build detailed prompt for generating recommendations
    
    Args:
        user_data: User profile data from user_profile.json
        financial_analysis: Calculated metrics (zakah, savings rate, etc.)
        expense_issues: List of overspending categories
    
    Returns:
        str: Complete prompt for OpenAI
    """
    
    # Extract data
    income = user_data.get('financial_summary', {}).get('monthly_income', 0)
    expenses = user_data.get('financial_summary', {}).get('monthly_expenses', 0)
    net_worth = user_data.get('financial_summary', {}).get('total_net_worth', 0)
    current_savings = user_data.get('financial_summary', {}).get('current_savings', 0)
    available_cash = user_data.get('financial_summary', {}).get('available_cash', 0)
    
    savings_goals = user_data.get('savings_goals', [])
    zakah_info = user_data.get('zakah_info', {})
    
    # Build expense breakdown text
    expense_text = ""
    if expense_issues:
        expense_text = "\n".join([
            f"- {issue['category']}: {issue['amount']:.2f} ريال ({issue['percentage']}% من الدخل) - يجب أن يكون أقل من {issue['threshold']}%"
            for issue in expense_issues[:3]  # Top 3 issues only
        ])
    else:
        expense_text = "جميع المصروفات ضمن الحدود المعقولة"
    
    # Build goals text
    goals_text = ""
    if savings_goals:
        goals_text = "\n".join([
            f"- {goal['name']}: {goal['current_amount']:.2f} ريال من أصل {goal['target_amount']:.2f} ريال (تقدم {goal.get('progress_percentage', 0)}%)"
            for goal in savings_goals
        ])
    else:
        goals_text = "لا توجد أهداف ادخار محددة حالياً"
    
    prompt = f"""أنت مستشار مالي إسلامي خبير. قم بتحليل البيانات المالية التالية وقدم توصيات عملية ودقيقة.

═══════════════════════════════════════════════
البيانات المالية للمستخدم:
═══════════════════════════════════════════════

💰 الدخل والمصروفات:
- الدخل الشهري: {income:,.2f} ريال سعودي
- المصروفات الشهرية: {expenses:,.2f} ريال سعودي
- معدل الادخار الحالي: {financial_analysis.get('savings_rate', 0):.1f}%

💵 الثروة الصافية:
- إجمالي الثروة: {net_worth:,.2f} ريال سعودي
- المدخرات الحالية: {current_savings:,.2f} ريال سعودي
- النقد المتاح: {available_cash:,.2f} ريال سعودي

📊 تحليل المصروفات (الفئات التي تتجاوز الحد المسموح):
{expense_text}

🎯 أهداف الادخار:
{goals_text}

💎 الزكاة:
- الزكاة المستحقة: {zakah_info.get('zakah_due', 0):,.2f} ريال سعودي
- نصاب الزكاة: {zakah_info.get('nisab_threshold', 7480):,.2f} ريال سعودي
- هل الزكاة واجبة: {"نعم" if zakah_info.get('is_due', False) else "لا"}

═══════════════════════════════════════════════
التعليمات المهمة:
═══════════════════════════════════════════════

1. قدم 3-5 توصيات عملية فقط بناءً على البيانات أعلاه
2. استخدم الأرقام الدقيقة من البيانات المقدمة - لا تخترع أرقاماً
3. كل توصية يجب أن تكون قابلة للتنفيذ ومحددة
4. رتب التوصيات حسب الأولوية (الزكاة أولاً إن وجدت)
5. استجب بصيغة JSON فقط - بدون أي نص إضافي

═══════════════════════════════════════════════
أنواع التوصيات المسموح بها فقط (3 أنواع):
═══════════════════════════════════════════════

1. **pay_zakah** — فقط إذا كانت الزكاة واجبة (is_due = true)
   - action: "pay_zakah"
   - action_params: {{"amount": قيمة_الزكاة_الدقيقة}}
   - priority: "high"

2. **reduce_expense** — فقط إذا كانت فئة مصروفات تتجاوز الحد المسموح
   - action: "set_budget_alert"
   - action_params: {{"category": "اسم_الفئة", "current_amount": X, "target_amount": Y}}
   - priority: "high" أو "medium"

3. **create_marasi** أو **increase_marasi** — لإنشاء هدف ادخاري جديد أو زيادة قائم
   - action: "create_marasi"
   - action_params: {{"goal_name": "اسم_الهدف", "suggested_monthly": المبلغ}}
   - priority: "medium" أو "low"

═══════════════════════════════════════════════
ممنوع منعاً باتاً:
═══════════════════════════════════════════════

❌ لا تقترح استثمارات (صناديق، أسهم، صكوك) — هذه تذهب لقسم الاستثمارات
❌ لا تقترح بناء صندوق طوارئ — هذا استثمار لا توصية
❌ لا تقترح increase_savings أو emergency_fund أو goal_acceleration
❌ لا تخترع أرقاماً — استخدم فقط الأرقام من البيانات أعلاه
❌ لا تضف نصوص خارج JSON

═══════════════════════════════════════════════
صيغة JSON المطلوبة (بدون markdown):
═══════════════════════════════════════════════

[
  {{
    "id": "rec_1",
    "type": "pay_zakah",
    "message": "رسالة واضحة بالعربية مع الأرقام الدقيقة",
    "action": "pay_zakah",
    "action_params": {{"amount": الرقم_الدقيق_من_البيانات}},
    "priority": "high"
  }},
  {{
    "id": "rec_2",
    "type": "reduce_expense",
    "message": "قلل مصاريف [الفئة] من [المبلغ_الحالي] إلى [المبلغ_المقترح] ريال",
    "action": "set_budget_alert",
    "action_params": {{"category": "اسم_الفئة", "current_amount": X, "target_amount": Y}},
    "priority": "medium"
  }},
  {{
    "id": "rec_3",
    "type": "create_marasi",
    "message": "أنشئ هدف ادخاري لـ [الهدف] بمساهمة [المبلغ] ريال شهرياً",
    "action": "create_marasi",
    "action_params": {{"goal_name": "اسم_الهدف", "suggested_monthly": المبلغ}},
    "priority": "low"
  }}
]

✅ رتب حسب الأولوية: الزكاة أولاً → تقليل المصروفات → الادخار (مرصي)

الآن قدم التوصيات بصيغة JSON فقط:"""

    return prompt


def build_simple_recommendation_prompt(user_data):
    """
    Simplified prompt for quick testing
    """
    income = user_data.get('financial_summary', {}).get('monthly_income', 0)
    expenses = user_data.get('financial_summary', {}).get('monthly_expenses', 0)
    
    prompt = f"""أنت مستشار مالي. المستخدم دخله {income} ريال ومصروفاته {expenses} ريال.

أعط توصية واحدة فقط بهذه الصيغة:
[
  {{
    "message": "توصية بالعربية",
    "action": "save"
  }}
]

استجب بـ JSON فقط:"""
    
    return prompt