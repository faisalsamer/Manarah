'use client';

import { useEffect, useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, 
  Target, Activity, Wallet, DollarSign, PiggyBank 
} from 'lucide-react';

interface MetricsViewProps {
  userId: string;
}

export default function MetricsView({ userId }: MetricsViewProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, [userId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px', height: '60px', border: '4px solid #E5E7EB',
            borderTop: '4px solid #00D9A5', borderRadius: '50%',
            margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '15px', color: '#64748B', fontWeight: '600' }}>جاري تحميل الإحصائيات...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Data from transactions_summary.json and user_profile.json
  const monthlyExpenses = [
    { month: '11/2025', expenses: 13123.2, income: 10478.32 },
    { month: '12/2025', expenses: 10461.08, income: 9519.85 },
    { month: '01/2026', expenses: 12259.6, income: 10023.4 },
    { month: '02/2026', expenses: 11284.9, income: 9638.03 },
    { month: '03/2026', expenses: 12581.39, income: 9973.5 },
    { month: '04/2026', expenses: 11636.36, income: 10435.83 },
  ];

  const categoryExpenses = [
    { name: 'تسوق', value: 2352.78, color: '#00D9A5' },
    { name: 'بقالة', value: 1905.41, color: '#3B82F6' },
    { name: 'مطاعم', value: 1487.81, color: '#8B5CF6' },
    { name: 'إيجار', value: 1200.0, color: '#F59E0B' },
    { name: 'صحة', value: 1100.37, color: '#EC4899' },
    { name: 'مرافق', value: 733.49, color: '#10B981' },
    { name: 'مواصلات', value: 651.18, color: '#F97316' },
  ];

  const incomeVsExpenses = [
    { category: 'الدخل', amount: 10435.83, color: '#00D9A5' },
    { category: 'المصروفات', amount: 11980.52, color: '#EF4444' },
  ];

  const topCategories = [
    { name: 'تسوق', amount: 2352.78 },
    { name: 'بقالة', amount: 1905.41 },
    { name: 'مطاعم', amount: 1487.81 },
    { name: 'إيجار', amount: 1200.0 },
    { name: 'صحة', amount: 1100.37 },
  ];

  const cashFlowTrend = [
    { month: '11/2025', flow: -2644.88 },
    { month: '12/2025', flow: -941.23 },
    { month: '01/2026', flow: -2236.2 },
    { month: '02/2026', flow: -1646.87 },
    { month: '03/2026', flow: -2607.89 },
    { month: '04/2026', flow: -1200.53 },
  ];

  const marasiGoals = [
    { name: 'شراء سيارة', current: 15000, target: 30000, progress: 50, color: '#00D9A5' },
    { name: 'صندوق الطوارئ', current: 10000, target: 20000, progress: 50, color: '#3B82F6' },
  ];

  const savingsAccumulation = [
    { month: '11/2025', savings: 20000 },
    { month: '12/2025', savings: 21500 },
    { month: '01/2026', savings: 22800 },
    { month: '02/2026', savings: 23500 },
    { month: '03/2026', savings: 24200 },
    { month: '04/2026', savings: 25000 },
  ];

  const zakatBreakdown = [
    { name: 'الأصول الزكوية', value: 22718.76, color: '#00D9A5' },
    { name: 'النصاب', value: 7480, color: '#94A3B8' },
    { name: 'الزكاة المستحقة', value: 567.97, color: '#FFB800' },
  ];

  const zakatPayments = [
    { month: 'أبريل 2025', amount: 567.97 },
    { month: 'أبريل 2024', amount: 512.45 },
    { month: 'أبريل 2023', amount: 489.32 },
    { month: 'أبريل 2022', amount: 445.18 },
  ];

  const assetAllocation = [
    { name: 'صناديق الاستثمار', value: 35, count: 4, color: '#00D9A5' },
    { name: 'الصكوك', value: 25, count: 4, color: '#3B82F6' },
    { name: 'الأسهم', value: 30, count: 6, color: '#8B5CF6' },
    { name: 'العقارات', value: 10, count: 2, color: '#F59E0B' },
  ];

  const riskVsReturn = [
    { name: 'HLAL', return: 10, risk: 2, type: 'etf', arabicName: 'واحد للأسواق الإسلامية' },
    { name: 'SPUS', return: 11, risk: 2, type: 'etf', arabicName: 'S&P 500 الشرعي' },
    { name: 'ISWD', return: 9, risk: 2, type: 'etf', arabicName: 'iShares الإسلامي' },
    { name: 'FALCOM', return: 8, risk: 1, type: 'etf', arabicName: 'فالكم السعودي' },
    { name: 'SAG2027', return: 6, risk: 1, type: 'sukuk', arabicName: 'صكوك حكومية 2027' },
    { name: 'DIB2028', return: 7, risk: 1, type: 'sukuk', arabicName: 'دبي الإسلامي' },
    { name: 'MAL2029', return: 6.5, risk: 1, type: 'sukuk', arabicName: 'ماليزيا السيادية' },
    { name: 'ARMCO', return: 7.5, risk: 1, type: 'sukuk', arabicName: 'أرامكو 2030' },
    { name: 'MSFT', return: 12.5, risk: 2, type: 'stock', arabicName: 'مايكروسوفت' },
    { name: 'AAPL', return: 11, risk: 2, type: 'stock', arabicName: 'أبل' },
    { name: 'ARAMCO', return: 8.5, risk: 1, type: 'stock', arabicName: 'أرامكو السعودية' },
    { name: 'RAJHI', return: 9.5, risk: 1, type: 'stock', arabicName: 'الراجحي' },
    { name: 'AMZN', return: 12.5, risk: 3, type: 'stock', arabicName: 'أمازون' },
    { name: 'STC', return: 7, risk: 1, type: 'stock', arabicName: 'الاتصالات السعودية' },
    { name: 'REIT1', return: 8.5, risk: 2, type: 'reit', arabicName: 'الأهلي العقاري' },
    { name: 'REIT2', return: 7.5, risk: 1, type: 'reit', arabicName: 'الرياض العقاري' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px',
          padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: '600', color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value} ر.س
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', animation: 'fadeSlideIn 0.6s' }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .metric-card { transition: all 0.3s; }
        .metric-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important; }
      `}</style>

      {/* CHART 1: Monthly Expense Trends */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingDown size={22} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>اتجاه المصروفات والدخل الشهري</h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>آخر 6 أشهر</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyExpenses}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <YAxis tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="expenses" name="المصروفات" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', r: 5 }} />
            <Line type="monotone" dataKey="income" name="الدخل" stroke="#00D9A5" strokeWidth={3} dot={{ fill: '#00D9A5', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CHART 2: Category Breakdown */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieIcon size={22} color="white" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>توزيع المصروفات حسب الفئة</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={categoryExpenses} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
              {categoryExpenses.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: '600' }} formatter={(value: any) => [`${value.toLocaleString()} ر.س`, '']} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categoryExpenses.slice(0, 5).map((entry) => (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: entry.color }} />
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>{entry.name}</span>
              </div>
              <span style={{ fontSize: '12px', color: '#1F2937', fontWeight: '700' }}>{entry.value.toLocaleString()} ر.س</span>
            </div>
          ))}
        </div>
      </div>

      {/* CHART 3: Income vs Expenses */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00D9A5, #00C494)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={22} color="white" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>الدخل مقابل المصروفات</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={incomeVsExpenses}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <YAxis tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[12, 12, 0, 0]}>
              {incomeVsExpenses.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CHART 4: Top Spending Categories */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={22} color="white" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>أعلى 5 فئات إنفاق</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topCategories} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} width={80} stroke="#E2E8F0" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" name="المبلغ" fill="#F59E0B" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CHART 5: Net Cash Flow */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #EC4899, #DB2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>صافي التدفق النقدي</h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>الأرباح والخسائر الشهرية</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={cashFlowTrend}>
            <defs>
              <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <YAxis tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="flow" name="الصافي" stroke="#EF4444" strokeWidth={2} fill="url(#colorFlow)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* CHART 6: Marasi Goals Progress */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={22} color="white" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>تقدم أهداف المراسي</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {marasiGoals.map((goal) => (
            <div key={goal.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: '700' }}>{goal.name}</span>
                <span style={{ fontSize: '14px', color: goal.color, fontWeight: '800' }}>{goal.progress}%</span>
              </div>
              <div style={{ height: '14px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: `${goal.progress}%`, background: `linear-gradient(90deg, ${goal.color}, ${goal.color}DD)`, borderRadius: '999px', transition: 'width 1s', boxShadow: `0 2px 8px ${goal.color}40` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '13px', color: goal.color, fontWeight: '700' }}>{goal.current.toLocaleString()} ر.س</span>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>من {goal.target.toLocaleString()} ر.س</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHART 7: Savings Accumulation */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PiggyBank size={22} color="white" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>تراكم المدخرات</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={savingsAccumulation}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <YAxis tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="savings" name="المدخرات" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CHART 8: Zakat Calculation */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #FFB800, #FFA000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} color="white" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>حساب الزكاة</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={zakatBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <YAxis tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="المبلغ" radius={[8, 8, 0, 0]}>
              {zakatBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CHART 9: Zakat Payment History */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="white" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>سجل مدفوعات الزكاة</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={zakatPayments} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" />
            <YAxis dataKey="month" type="category" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} width={100} stroke="#E2E8F0" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" name="المبلغ المدفوع" fill="#10B981" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CHART 10: Asset Allocation - INVESTMENT */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00D9A5, #00C494)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieIcon size={22} color="white" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>توزيع الأصول الاستثمارية</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={assetAllocation} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
              {assetAllocation.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: '600' }} formatter={(value: any) => [`${value}%`, '']} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assetAllocation.map((entry) => (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: entry.color }} />
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>{entry.name} ({entry.count})</span>
              </div>
              <span style={{ fontSize: '12px', color: '#1F2937', fontWeight: '700' }}>{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* CHART 11: Risk vs Return - INVESTMENT */}
      <div className="metric-card" style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={22} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>المخاطر مقابل العائد - الاستثمارات</h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>جميع الاستثمارات الحلال المتاحة</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis type="number" dataKey="risk" name="المخاطر" domain={[0, 4]} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" label={{ value: 'مستوى المخاطر', position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: '#64748B', fontWeight: 700 } }} />
            <YAxis type="number" dataKey="return" name="العائد" domain={[0, 15]} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} stroke="#E2E8F0" label={{ value: 'العائد المتوقع (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748B', fontWeight: 700 } }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: '600' }} formatter={(value: any, name: string) => { if (name === 'return') return [`${value}%`, 'العائد']; if (name === 'risk') return [value === 1 ? 'منخفض' : value === 2 ? 'متوسط' : 'عالي', 'المخاطر']; return [value, name]; }} labelFormatter={(label: any, payload: any) => { if (payload && payload.length > 0) { return payload[0].payload.arabicName; } return label; }} />
            <Legend />
            <Scatter name="صناديق استثمار" data={riskVsReturn.filter(d => d.type === 'etf')} fill="#00D9A5" />
            <Scatter name="صكوك" data={riskVsReturn.filter(d => d.type === 'sukuk')} fill="#3B82F6" />
            <Scatter name="أسهم" data={riskVsReturn.filter(d => d.type === 'stock')} fill="#8B5CF6" />
            <Scatter name="عقارات" data={riskVsReturn.filter(d => d.type === 'reit')} fill="#F59E0B" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}