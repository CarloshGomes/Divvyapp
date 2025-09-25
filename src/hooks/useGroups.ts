import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ExpenseGroup, GroupMember } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useGroups() {
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGroups = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_groups')
        .select(`
          *,
          group_members!inner(user_id)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups((data as ExpenseGroup[]) || []);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os grupos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (groupData: {
    name: string;
    description?: string;
    group_type: ExpenseGroup['group_type'];
  }) => {
    if (!user) return null;

    try {
      // Criar o grupo
      const { data: group, error: groupError } = await supabase
        .from('expense_groups')
        .insert({
          ...groupData,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Adicionar o criador como admin do grupo
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      await fetchGroups();
      
      toast({
        title: "Sucesso!",
        description: "Grupo criado com sucesso",
        variant: "default"
      });

      return group as ExpenseGroup;
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo",
        variant: "destructive"
      });
      return null;
    }
  };

  const joinGroup = async (groupId: string, inviteCode?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      await fetchGroups();
      
      toast({
        title: "Sucesso!",
        description: "Você entrou no grupo",
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Erro ao entrar no grupo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível entrar no grupo",
        variant: "destructive"
      });
      return false;
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchGroups();
      
      toast({
        title: "Sucesso!",
        description: "Você saiu do grupo",
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Erro ao sair do grupo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível sair do grupo",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  return {
    groups,
    loading,
    fetchGroups,
    createGroup,
    joinGroup,
    leaveGroup
  };
}