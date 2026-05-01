"""
Investment Prompt Template
High-quality prompt for selecting suitable halal investments
"""

def build_investment_prompt(user_data, available_investments):
    """
    Build detailed prompt for investment recommendations
    
    Args:
        user_data: User profile data
        available_investments: List of filtered halal investments
    
    Returns:
        str: Complete prompt for OpenAI
    """
    
    available_cash = user_data.get('financial_summary', {}).get('available_cash', 0)
    monthly_income = user_data.get('financial_summary', {}).get('monthly_income', 0)
    risk_tolerance = user_data.get('risk_tolerance', 'medium')
    
    # Format available investments
    investment_list = []
    for inv in available_investments[:15]:  # Limit to top 15
        investment_list.append(
            f"- {inv['name']} ({inv['type'].upper()})\n"
            f"  الحد الأدنى: {inv['min_investment']:,.0f} ريال\n"
            f"  العائد المتوقع: {inv['expected_return']}\n"
            f"  مستوى المخاطر: {inv['risk_level']}\n"
            f"  معتمد من: {inv['certifier']}"
        )
    
    investments_text = "\n\n".join(investment_list)
    
    prompt = f"""أنت مستشار استثمار إسلامي خبير. اختر أفضل 2-4 خيارات استثمارية من القائمة المتاحة.

═══════════════════════════════════════════════
معلومات المستخدم:
═══════════════════════════════════════════════

💰 النقد المتاح للاستثمار: {available_cash:,.2f} ريال سعودي
📊 الدخل الشهري: {monthly_income:,.2f} ريال سعودي
⚖️ تحمل المخاطر: {risk_tolerance}

═══════════════════════════════════════════════
الاستثمارات الحلال المتاحة:
═══════════════════════════════════════════════

{investments_text}

═══════════════════════════════════════════════
معايير الاختيار:
═══════════════════════════════════════════════

1. الحد الأدنى للاستثمار يجب أن يكون <= {available_cash:,.0f} ريال
2. مستوى المخاطر يجب أن يتناسب مع تحمل المستخدم ({risk_tolerance})
3. اختر تنويعاً جيداً (مثلاً: ETF + Sukuk أو Stock + REIT)
4. الأولوية للخيارات ذات العائد الأفضل ضمن المخاطر المقبولة
5. اختر فقط من القائمة المتاحة أعلاه - لا تخترع استثمارات جديدة

═══════════════════════════════════════════════
صيغة JSON المطلوبة (بدون markdown):
═══════════════════════════════════════════════

[
  {{
    "name": "الاسم_الدقيق_من_القائمة",
    "name_ar": "الترجمة العربية للاسم",
    "type": "etf أو sukuk أو stock أو reit",
    "min_investment": الحد_الأدنى_الدقيق,
    "expected_return": "النسبة_الدقيقة_من_القائمة",
    "risk_level": "low أو medium أو high",
    "reason": "سبب الاختيار بالعربية (جملة واحدة)"
  }}
]

═══════════════════════════════════════════════
قواعد صارمة:
═══════════════════════════════════════════════

❌ لا تخترع أسماء استثمارات - اختر فقط من القائمة أعلاه
❌ لا تغير الأرقام - استخدم الأرقام الدقيقة من القائمة
❌ لا تختر استثمارات بحد أدنى أكبر من النقد المتاح
✅ انسخ الاسم الإنجليزي بالضبط من القائمة
✅ أضف ترجمة عربية مناسبة في name_ar
✅ اختر 2-4 خيارات فقط
✅ نوّع بين أنواع الاستثمارات

الآن اختر الاستثمارات المناسبة بصيغة JSON فقط:"""
    
    return prompt


def build_simple_investment_prompt(available_investments, max_investment):
    """
    Simplified prompt for quick testing
    """
    
    inv_names = [f"- {inv['name']} (حد أدنى: {inv['min_investment']} ريال)" 
                 for inv in available_investments[:5]]
    inv_text = "\n".join(inv_names)
    
    prompt = f"""اختر استثمارين من هذه القائمة (النقد المتاح: {max_investment} ريال):

{inv_text}

استجب بـ JSON فقط:
[
  {{
    "name": "الاسم من القائمة",
    "reason": "السبب بالعربية"
  }}
]"""
    
    return prompt