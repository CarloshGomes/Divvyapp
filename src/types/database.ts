// Tipos do sistema de divisão de despesas

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseGroup {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  group_type: 'travel' | 'party' | 'gathering' | 'house' | 'other';
  total_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface SharedExpense {
  id: string;
  group_id: string;
  paid_by: string;
  title: string;
  description?: string;
  amount: number;
  expense_date: string;
  category: string;
  receipt_url?: string;
  split_type: 'equal' | 'percentage' | 'custom';
  created_at: string;
  updated_at: string;
  paid_by_profile?: Profile;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage?: number;
  is_paid: boolean;
  paid_at?: string;
  profile?: Profile;
}

export interface GroupPool {
  id: string;
  group_id: string;
  name: string;
  description?: string;
  target_amount?: number;
  current_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PoolContribution {
  id: string;
  pool_id: string;
  user_id: string;
  amount: number;
  contribution_date: string;
  payment_method: string;
  pix_key?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  profile?: Profile;
}

export interface PixPayment {
  id: string;
  expense_split_id?: string;
  pool_contribution_id?: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
  pix_key: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  payment_date?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'expense_added' | 'payment_pending' | 'payment_confirmed' | 'group_invite' | 'pool_contribution';
  title: string;
  message: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
}