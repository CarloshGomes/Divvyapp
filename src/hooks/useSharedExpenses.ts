import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SharedExpense, ExpenseSplit } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useSharedExpenses(groupId?: string) {
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExpenses = async () => {
    if (!user || !groupId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shared_expenses')
        .select(`
          *,
          paid_by_profile:profiles!shared_expenses_paid_by_fkey(*)
        `)
        .eq('group_id', groupId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses((data as any) || []);
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as despesas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSplits = async (expenseId: string) => {
    try {
      const { data, error } = await supabase
        .from('expense_splits')
        .select(`
          *,
          profile:profiles!expense_splits_user_id_fkey(*)
        `)
        .eq('expense_id', expenseId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar divisões:', error);
      return [];
    }
  };

  const createExpense = async (expenseData: {
    title: string;
    description?: string;
    amount: number;
    expense_date: string;
    category: string;
    split_type: SharedExpense['split_type'];
  }) => {
    if (!user || !groupId) return null;

    try {
      // Criar a despesa
      const { data: expense, error: expenseError } = await supabase
        .from('shared_expenses')
        .insert({
          ...expenseData,
          group_id: groupId,
          paid_by: user.id
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Calcular divisão igual automaticamente
      if (expenseData.split_type === 'equal') {
        const { error: splitError } = await supabase
          .rpc('calculate_equal_split', { expense_id: expense.id });

        if (splitError) throw splitError;
      }

      await fetchExpenses();
      
      toast({
        title: "Sucesso!",
        description: "Despesa adicionada com sucesso",
        variant: "default"
      });

      return expense;
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a despesa",
        variant: "destructive"
      });
      return null;
    }
  };

  const markSplitAsPaid = async (splitId: string) => {
    try {
      const { error } = await supabase
        .from('expense_splits')
        .update({
          is_paid: true,
          paid_at: new Date().toISOString()
        })
        .eq('id', splitId);

      if (error) throw error;

      await fetchExpenses();
      
      toast({
        title: "Sucesso!",
        description: "Pagamento confirmado",
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user, groupId]);

  return {
    expenses,
    splits,
    loading,
    fetchExpenses,
    fetchSplits,
    createExpense,
    markSplitAsPaid
  };
}