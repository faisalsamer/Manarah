import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ============ INTERFACES ============

export interface AdvisorResponse {
  success: boolean;
  data: {
    recommendations: Recommendation[];
    investments: Investment[];
    financial_summary: FinancialSummary;
  };
}

export interface Recommendation {
  id: string;
  type: string;
  message: string;
  action: string;
  action_params?: any;
  priority: 'high' | 'medium' | 'low';
  is_applied?: boolean;
}

export interface Investment {
  id?: string;
  name: string;
  name_ar?: string;
  type: string;
  min_investment: number;
  expected_return: string;
  risk_level: string;
  reason?: string;
  ticker?: string;
  provider?: string;
}

export interface FinancialSummary {
  monthly_income: number;
  monthly_expenses: number;
  savings_rate: number;
  zakah_due: number;
  emergency_fund_months: number;
  net_worth: number;
}

export interface MarasiGoal {
  id: string;
  title: string;
  target_amount: number;
  current_balance: number;
  periodic_amount: number;
  frequency: string;
  progress: number;
  target_date: string | null;
}

export interface ExpenseSummary {
  last_30_days: {
    total_income: number;
    total_expenses: number;
    net: number;
    transaction_count: number;
    by_category: Record<string, number>;
    by_account: Record<string, any>;
  };
  last_3_months: {
    total_income: number;
    total_expenses: number;
    average_monthly_income: number;
    average_monthly_expenses: number;
    by_category: Record<string, number>;
  };
  monthly_breakdown: Record<string, {
    income: number;
    expenses: number;
    net: number;
    top_categories: Record<string, number>;
  }>;
}

export interface BankAccount {
  account_id: string;
  account_name: string;
  account_number: string;
  account_type: string;
  iban: string;
  balance: number;
  currency: string;
  is_primary: boolean;
}

export interface ConnectedBank {
  bank_id: string;
  bank_name: string;
  bank_name_ar: string;
  bank_code: string;
  bank_type: string;
  accounts: BankAccount[];
}

export interface BanksAccountsResponse {
  banks: ConnectedBank[];
  total_banks: number;
  total_accounts: number;
}

export interface Transaction {
  id: string;
  type: 'recommendation' | 'zakah_payment' | 'savings_goal' | 'investment';
  action_type: string;
  title: string;
  description: string;
  amount: number | null;
  status: string;
  created_at: string;
  icon: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

// ============ API FUNCTIONS ============

export async function getAdvisorInsights(userId: string): Promise<AdvisorResponse> {
  const response = await axios.post(`${API_URL}/api/get-advisor-insights`, {
    user_id: userId,
  });
  return response.data;
}

export async function applyRecommendation(
  recommendationId: string,
  userId: string,
  accountId?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const response = await axios.post(`${API_URL}/api/execute-recommendation`, {
      recommendation_id: recommendationId,
      user_id: userId,
      account_id: accountId,
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ API Error:', error.response?.data || error.message);
    
    if (error.response?.data) {
      return error.response.data;
    }
    
    return {
      success: false,
      message: 'فشل الاتصال بالخادم',
      data: null
    };
  }
}

export async function getNextRecommendation(
  userId: string,
  excludeIds: string[]
): Promise<Recommendation> {
  try {
    const response = await axios.post(`${API_URL}/api/get-next-recommendation`, {
      user_id: userId,
      exclude_ids: excludeIds
    });
    return response.data.recommendation;
  } catch (error: any) {
    console.error('Error fetching next recommendation:', error);
    throw error;
  }
}

export async function getMarasiGoals(userId: string): Promise<MarasiGoal[]> {
  const response = await axios.post(`${API_URL}/api/get-marasi-goals`, {
    user_id: userId,
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch marasi goals');
  }
  
  return response.data.data;
}

export async function getExpenseSummary(userId: string): Promise<ExpenseSummary> {
  const response = await axios.post(`${API_URL}/api/get-expense-summary`, {
    user_id: userId,
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch expense summary');
  }
  
  return response.data.data;
}

export async function getUserTransactions(userId: string): Promise<TransactionsResponse> {
  const response = await axios.post(`${API_URL}/api/get-user-transactions-history`, {
    user_id: userId,
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch transactions');
  }
  
  return response.data.data;
}

export async function getUserBanksAccounts(userId: string): Promise<BanksAccountsResponse> {
  const response = await axios.post(`${API_URL}/api/get-user-banks-accounts`, {
    user_id: userId,
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch banks and accounts');
  }
  
  return response.data.data;
}

// NEW: Track investment
export async function trackInvestment(
  userId: string,
  investmentName: string,
  investmentData: Investment,
  accountId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await axios.post(`${API_URL}/api/track-investment`, {
      user_id: userId,
      investment_name: investmentName,
      investment_data: investmentData,
      account_id: accountId,
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to track investment:', error);
    return {
      success: false,
      message: 'فشل في تسجيل الاستثمار'
    };
  }
}