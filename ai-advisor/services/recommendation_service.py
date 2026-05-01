"""
Recommendation Service
Combines database data, financial calculations, and OpenAI
"""

from models import db, AIRecommendation
from services.db_data_service import (
    get_user_profile_from_db,
    get_transactions_summary_from_db,
    get_halal_investments_from_json,
    save_ai_recommendation
)
from services.financial_service import (
    calculate_zakah,
    calculate_savings_rate,
    analyze_all_expenses,
    calculate_emergency_fund_months
)
from services.openai_service import get_json_completion
from prompts.recommendation_prompt import build_recommendation_prompt
from prompts.investment_prompt import build_investment_prompt
from datetime import datetime
import random


def _build_fallback_recommendations(income, expenses, zakah_due, savings_rate):
    """
    Fallback recommendations with MESSAGE VARIATION.
    Each type has multiple message templates to avoid repetition.
    """
    recs = []

    # ZAKAH - 4 different messages
    if zakah_due > 0:
        zakah_messages = [
            f'الزكاة المستحقة عليك هي {zakah_due:,.0f} ريال. أدِّها في أقرب وقت ممكن لتبرئة الذمة وتزكية مالك.',
            f'واجب عليك دفع الزكاة والمبلغ المستحق هو {zakah_due:,.0f} ريال سعودي. أخرجها الآن لتطهير مالك.',
            f'حان وقت تزكية مالك. المبلغ الواجب: {zakah_due:,.0f} ريال. بادر بإخراجها لتحصيل البركة.',
            f'يجب عليك إخراج الزكاة بقيمة {zakah_due:,.0f} ريال قبل حلول الحول. لا تؤخر حق الله في مالك.',
        ]
        
        recs.append({
            'type': 'pay_zakah',
            'message': random.choice(zakah_messages),
            'action': 'pay_zakah',
            'action_params': {'amount': zakah_due},
            'priority': 'high',
        })

    # EXPENSE REDUCTION - 5 different messages
    if expenses > 0:
        entertainment_estimate = round(expenses * 0.15, 0)
        target = round(entertainment_estimate * 0.70, 0)
        savings_amount = entertainment_estimate - target
        
        expense_messages = [
            f'قلل مصاريف الترفيه والمطاعم من {entertainment_estimate:,.0f} إلى {target:,.0f} ريال شهرياً لتوفير {savings_amount:,.0f} ريال إضافية.',
            f'يمكنك توفير {savings_amount:,.0f} ريال شهرياً بتقليل مصاريف الترفيه من {entertainment_estimate:,.0f} إلى {target:,.0f} ريال.',
            f'راجع مصاريف الترفيه والمطاعم البالغة {entertainment_estimate:,.0f} ريال واخفضها إلى {target:,.0f} ريال لزيادة مدخراتك.',
            f'تنفق {entertainment_estimate:,.0f} ريال شهرياً على الترفيه. اخفضها إلى {target:,.0f} ريال ووفّر {savings_amount:,.0f} ريال.',
            f'ميزانية الترفيه مرتفعة ({entertainment_estimate:,.0f} ريال). اجعلها {target:,.0f} ريال لتحسين وضعك المالي.',
        ]
        
        recs.append({
            'type': 'reduce_expense',
            'message': random.choice(expense_messages),
            'action': 'set_budget_alert',
            'action_params': {
                'category': 'entertainment',
                'current_amount': entertainment_estimate,
                'target_amount': target
            },
            'priority': 'high' if savings_rate < 10 else 'medium',
        })

    # MARASI (SAVINGS GOAL) - 6 different messages
    suggested_monthly = round(income * 0.10, 0)
    
    marasi_messages = [
        f'أنشئ هدفاً ادخارياً جديداً (مرصي) بمبلغ {suggested_monthly:,.0f} ريال شهرياً لتحقيق أهدافك كالسفر أو شراء سيارة.',
        f'ابدأ مرصي ادخاري بـ {suggested_monthly:,.0f} ريال شهرياً نحو هدف محدد تختاره أنت (عمرة، سيارة، زواج).',
        f'نظّم مدخراتك بإنشاء مرصي جديد. ابدأ بـ {suggested_monthly:,.0f} ريال شهرياً واجعل لأموالك هدفاً واضحاً.',
        f'خصص {suggested_monthly:,.0f} ريال شهرياً في مرصي جديد لبناء صندوق طوارئ أو تحقيق حلم مستقبلي.',
        f'أنشئ هدفاً ادخارياً ذكياً (مرصي) لتنظيم مدخراتك. ابدأ بـ {suggested_monthly:,.0f} ريال كل شهر.',
        f'حدد هدفاً مالياً واضحاً وابدأ مرصي بـ {suggested_monthly:,.0f} ريال شهرياً للوصول إليه بشكل منظم.',
    ]
    
    recs.append({
        'type': 'create_marasi',
        'message': random.choice(marasi_messages),
        'action': 'create_marasi',
        'action_params': {'suggested_monthly': suggested_monthly},
        'priority': 'low',
    })

    return recs


FALLBACK_INVESTMENTS = [
    {
        'name': 'Albilad Saudi Index ETF',
        'name_ar': 'صندوق البلاد للمؤشر السعودي',
        'type': 'etf',
        'min_investment': 500,
        'expected_return': '8-12%',
        'risk_level': 'medium',
        'reason': 'تنويع واسع في السوق السعودي بتكلفة منخفضة وتوافق شرعي كامل',
    },
    {
        'name': 'Saudi Government Sukuk',
        'name_ar': 'صكوك حكومية سعودية',
        'type': 'sukuk',
        'min_investment': 1000,
        'expected_return': '4-6%',
        'risk_level': 'low',
        'reason': 'دخل ثابت مضمون بضمان حكومي — مثالي للحفاظ على رأس المال',
    },
    {
        'name': 'Riyad REIT Fund',
        'name_ar': 'صندوق ريت الرياض',
        'type': 'real_estate',
        'min_investment': 1000,
        'expected_return': '6-9%',
        'risk_level': 'medium',
        'reason': 'دخل إيجاري منتظم من العقارات التجارية والسكنية بالمملكة',
    },
]


def generate_user_recommendations(user_id='CUST001'):
    """
    Generate complete AI-powered recommendations from DATABASE
    
    Args:
        user_id: User identifier
    
    Returns:
        dict: {recommendations, investments, financial_summary}
    """
    
    try:
        # Step 1: Load user data FROM DATABASE
        print(f"📊 Loading data for user: {user_id}")
        user_profile = get_user_profile_from_db(user_id)
        if not user_profile:
            raise Exception(f"User {user_id} not found in database")
        
        transactions_summary = get_transactions_summary_from_db(user_id)
        
        # Extract financial data
        financial_summary = user_profile.get('financial_summary', {})
        zakah_info = user_profile.get('zakah_info', {})
        savings_goals = user_profile.get('savings_goals', [])
        
        income = financial_summary.get('monthly_income', 0)
        expenses = financial_summary.get('monthly_expenses', 0)
        net_worth = financial_summary.get('total_net_worth', 0)
        current_savings = financial_summary.get('current_savings', 0)
        available_cash = financial_summary.get('available_cash', 0)
        
        # Step 2: Calculate financial metrics
        zakah_due = calculate_zakah(net_worth)
        savings_rate = calculate_savings_rate(income, expenses)
        emergency_months = calculate_emergency_fund_months(current_savings, expenses)
        
        financial_analysis = {
            'zakah_due': zakah_due,
            'savings_rate': savings_rate,
            'emergency_months': emergency_months
        }
        
        # Step 3: Analyze expenses
        last_30_days = transactions_summary.get('last_30_days', {})
        expense_breakdown = last_30_days.get('by_category', {})
        
        expense_issues = analyze_all_expenses(expense_breakdown, income)
        
        # Step 4: Delete ALL previous recommendations (clean slate every session)
        old_count = AIRecommendation.query.filter_by(user_id=user_id).count()
        AIRecommendation.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        print(f"🗑️  Cleared {old_count} old recommendations for user {user_id}")

        # Step 5: Generate NEW recommendations using AI
        recommendations = []
        
        try:
            rec_prompt = build_recommendation_prompt(
                user_profile,
                financial_analysis,
                expense_issues
            )
            
            messages = [
                {
                    "role": "system",
                    "content": "أنت مستشار مالي إسلامي خبير. قدم نصائح دقيقة وعملية بناءً على البيانات فقط."
                },
                {
                    "role": "user",
                    "content": rec_prompt
                }
            ]
            
            print(f"🤖 Calling OpenAI for recommendations...")
            ai_recommendations = get_json_completion(messages, model="gpt-4", max_tokens=2000)
            
            # Ensure it's a list
            if isinstance(ai_recommendations, dict):
                if 'recommendations' in ai_recommendations:
                    recommendations = ai_recommendations['recommendations']
                else:
                    recommendations = [ai_recommendations]
            else:
                recommendations = ai_recommendations
            
            print(f"📋 Received {len(recommendations)} recommendations from AI")

            # Filter to only allowed types
            ALLOWED_TYPES = {'pay_zakah', 'reduce_expense', 'create_marasi', 'increase_marasi'}
            ALLOWED_ACTIONS = {'pay_zakah', 'reduce_expense', 'set_budget_alert', 'create_marasi'}
            filtered = []
            for rec in recommendations:
                if rec.get('type') in ALLOWED_TYPES or rec.get('action') in ALLOWED_ACTIONS:
                    filtered.append(rec)
                else:
                    print(f"⚠️  Filtered out: type={rec.get('type')}, action={rec.get('action')}")
            recommendations = filtered
            print(f"✅ {len(recommendations)} recommendations passed type filter")

            # Save each recommendation to database
            for rec in recommendations:
                save_ai_recommendation(user_id, rec)

            print(f"✅ Successfully saved {len(recommendations)} recommendations")
            
        except Exception as e:
            print(f"❌ OpenAI unavailable, using fallback recommendations: {str(e)}")
            recommendations = _build_fallback_recommendations(
                income, expenses, zakah_due, savings_rate
            )
            for rec in recommendations:
                save_ai_recommendation(user_id, rec)
            print(f"✅ Saved {len(recommendations)} fallback recommendations")
        
        # Step 6: Generate investment suggestions
        investments = []
        
        if emergency_months >= 6 and available_cash > 1000:
            try:
                print(f"💰 User qualifies for investments (emergency fund: {emergency_months:.1f} months)")
                
                available_investments = get_suitable_investments_filtered(
                    available_cash=available_cash,
                    risk_tolerance='medium'
                )
                
                print(f"📊 Found {len(available_investments)} suitable investments")
                
                if available_investments:
                    inv_prompt = build_investment_prompt(
                        user_profile,
                        available_investments
                    )
                    
                    messages = [
                        {
                            "role": "system",
                            "content": "أنت مستشار استثمار إسلامي. اختر فقط من الخيارات المتاحة."
                        },
                        {
                            "role": "user",
                            "content": inv_prompt
                        }
                    ]
                    
                    print(f"🤖 Calling OpenAI for investment suggestions...")
                    ai_investments = get_json_completion(messages, model="gpt-4", max_tokens=1500)
                    
                    if isinstance(ai_investments, dict):
                        if 'investments' in ai_investments:
                            investments = ai_investments['investments']
                        else:
                            investments = [ai_investments]
                    else:
                        investments = ai_investments
                    
                    investments = investments[:4]
                    print(f"✅ Generated {len(investments)} investment suggestions")
                
            except Exception as e:
                print(f"❌ OpenAI unavailable for investments, using fallback: {str(e)}")
                investments = FALLBACK_INVESTMENTS
        else:
            print(f"ℹ️  User does not qualify for investments yet (emergency fund: {emergency_months:.1f} months, need 6+)")
        
        # Step 7: Format final response
        response = {
            'recommendations': recommendations,
            'investments': investments,
            'financial_summary': {
                'monthly_income': income,
                'monthly_expenses': expenses,
                'savings_rate': savings_rate,
                'zakah_due': zakah_due,
                'emergency_fund_months': emergency_months,
                'net_worth': net_worth
            },
            'generated_at': datetime.utcnow().isoformat() + 'Z'
        }
        
        print(f"✅ Successfully generated response with {len(recommendations)} recommendations and {len(investments)} investments")
        
        return response
    
    except Exception as e:
        print(f"❌ CRITICAL ERROR in generate_user_recommendations: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Error generating recommendations: {str(e)}")


def get_suitable_investments_filtered(available_cash, risk_tolerance='medium', limit=15):
    """Filter investments by criteria"""
    all_investments = get_halal_investments_from_json()
    suitable = []
    
    risk_levels = {'low': 1, 'medium': 2, 'high': 3}
    max_risk = risk_levels.get(risk_tolerance, 2)
    
    for inv_type in ['etfs', 'sukuk', 'stocks', 'real_estate']:
        for investment in all_investments.get(inv_type, []):
            min_investment = investment.get('min_investment', 0)
            if min_investment > available_cash:
                continue
            
            inv_risk = risk_levels.get(investment.get('risk_level', 'medium'), 2)
            if inv_risk > max_risk:
                continue
            
            suitable.append(investment)
    
    return suitable[:limit]


def get_single_recommendation(user_id, exclude_ids=None):
    """
    Return one new recommendation to replace an applied one.
    Uses message variation to avoid repetition.
    """
    exclude_ids = set(exclude_ids or [])
    
    print(f"🔄 Generating replacement recommendation for user {user_id}")
    print(f"   Excluding IDs: {list(exclude_ids)}")

    user_profile = get_user_profile_from_db(user_id)
    if not user_profile:
        raise Exception(f"User {user_id} not found")

    financial_summary = user_profile.get('financial_summary', {})
    income = float(financial_summary.get('monthly_income', 0))
    expenses = float(financial_summary.get('monthly_expenses', 0))
    net_worth = float(financial_summary.get('total_net_worth', 0))

    zakah_due = float(calculate_zakah(net_worth))
    savings_rate = calculate_savings_rate(income, expenses)

    # Check what types are currently visible
    from datetime import timedelta
    recent_cutoff = datetime.utcnow() - timedelta(minutes=5)
    
    existing = AIRecommendation.query.filter(
        AIRecommendation.user_id == user_id,
        AIRecommendation.created_at >= recent_cutoff
    ).filter(
        db.or_(
            AIRecommendation.is_applied == False,
            AIRecommendation.id.in_(list(exclude_ids))
        )
    ).all()
    
    existing_types = {r.recommendation_type for r in existing}
    print(f"📋 Types already showing: {existing_types}")

    # Build pool with VARIED messages
    pool = _build_fallback_recommendations(income, expenses, zakah_due, savings_rate)
    
    print(f"🎯 Recommendation pool: {[r.get('type') for r in pool]}")

    # PREFER a type NOT already visible
    for rec in pool:
        rec_type = rec.get('type')
        if rec_type not in existing_types:
            print(f"✅ Selected new type: {rec_type} (not in {existing_types})")
            save_ai_recommendation(user_id, rec)
            return rec

    # All 3 types taken — generate another marasi with varied message
    print(f"⚠️  All types taken, using marasi variant")
    marasi_variants = [
        f'خصص {round(income * 0.05, 0):,.0f} ريال شهرياً نحو هدف ادخاري جديد لتحقيق حلمك المالي القادم.',
        f'ابدأ بادخار {round(income * 0.08, 0):,.0f} ريال شهرياً في مرصي جديد للطوارئ أو مشروع مستقبلي.',
        f'نظّم مدخراتك بإنشاء مرصي بمبلغ شهري {round(income * 0.10, 0):,.0f} ريال نحو هدف تحدده أنت.',
        f'ادخر {round(income * 0.06, 0):,.0f} ريال كل شهر في مرصي خاص بهدف مالي تطمح إليه.',
        f'أنشئ مرصي جديد بمساهمة شهرية {round(income * 0.07, 0):,.0f} ريال لبناء ثروتك المستقبلية.',
    ]
    
    varied = {
        'type': 'create_marasi',
        'message': random.choice(marasi_variants),
        'action': 'create_marasi',
        'action_params': {'suggested_monthly': round(income * random.uniform(0.05, 0.10), 0)},
        'priority': 'low',
    }
    save_ai_recommendation(user_id, varied)
    print(f"✅ Replacement: {varied.get('type')} → {varied.get('id')}")
    return varied