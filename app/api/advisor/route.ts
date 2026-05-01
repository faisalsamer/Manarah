import { NextRequest } from 'next/server';
import halalInvestmentsData from '../../../ai-advisor/data/halal_investments.json';
const FLASK_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

// Helper function to add Arabic names and reasons to investments
const enrichInvestment = (inv: any) => {
  const arabicNames: Record<string, string> = {
    'Wahed Dow Jones Islamic Market ETF': 'صندوق واحد للأسواق الإسلامية',
    'SP Funds S&P 500 Sharia Industry Exclusions ETF': 'صندوق S&P 500 المتوافق مع الشريعة',
    'iShares MSCI World Islamic UCITS ETF': 'صندوق iShares العالمي الإسلامي',
    'Falcom Saudi Equity ETF': 'صندوق فالكم للأسهم السعودية',
    'Saudi Government Sukuk 2027': 'صكوك حكومية سعودية 2027',
    'Dubai Islamic Bank Sukuk 2028': 'صكوك بنك دبي الإسلامي',
    'Malaysia Sovereign Sukuk 2029': 'صكوك ماليزيا السيادية',
    'Saudi Aramco Sukuk 2030': 'صكوك أرامكو السعودية',
    'Microsoft Corporation': 'مايكروسوفت',
    'Apple Inc.': 'أبل',
    'Saudi Aramco': 'أرامكو السعودية',
    'Al Rajhi Bank': 'بنك الراجحي',
    'Amazon.com Inc.': 'أمازون',
    'STC (Saudi Telecom)': 'الاتصالات السعودية',
    'Al Ahli REIT Fund': 'صندوق الأهلي العقاري',
    'Riyad REIT Fund': 'صندوق الرياض العقاري',
  };

  const reasons: Record<string, string> = {
    'etf': 'تنويع واسع في الأسواق المالية مع توافق شرعي كامل',
    'sukuk': 'دخل ثابت ومضمون بضمانات حكومية – مثالي للمحافظين على رأس المال',
    'stock': 'فرصة نمو طويلة الأجل في شركات كبرى متوافقة مع الشريعة',
    'reit': 'دخل دوري من الإيجارات العقارية مع نمو رأس المال',
  };

  return {
    ...inv,
    name_ar: arabicNames[inv.name] || inv.name,
    reason: reasons[inv.type] || inv.description,
  };
};

// Get 6 investments from JSON file
const getHalalInvestments = () => {
  const allInvestments: any[] = [];
  
  // Combine all investment types
  if (halalInvestmentsData.etfs) {
    allInvestments.push(...halalInvestmentsData.etfs);
  }
  if (halalInvestmentsData.sukuk) {
    allInvestments.push(...halalInvestmentsData.sukuk);
  }
  if (halalInvestmentsData.stocks) {
    allInvestments.push(...halalInvestmentsData.stocks);
  }
  if (halalInvestmentsData.real_estate) {
    allInvestments.push(...halalInvestmentsData.real_estate);
  }
  
  // Return first 6 investments with enrichment
  return allInvestments.slice(0, 6).map(enrichInvestment);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const flaskRes = await fetch(`${FLASK_URL}/api/get-advisor-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await flaskRes.json();
    
    // Inject halal investments from JSON file (max 6)
    if (data.success && data.data) {
      data.data.investments = getHalalInvestments();
    }
    
    return Response.json(data, { status: flaskRes.status });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/advisor] Flask unreachable:', message);
    return Response.json(
      { success: false, error: 'خدمة المستشار غير متاحة حالياً. تأكد من تشغيل Flask API.' },
      { status: 503 }
    );
  }
}