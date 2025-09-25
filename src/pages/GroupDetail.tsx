import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSharedExpenses } from "@/hooks/useSharedExpenses";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Users, DollarSign, Receipt } from "lucide-react";
import { ExpenseGroup, GroupMember } from "@/types/database";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { expenses, loading: expensesLoading, createExpense } = useSharedExpenses(groupId);
  
  const [group, setGroup] = useState<ExpenseGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupData = async () => {
    if (!groupId || !user) return;

    try {
      setLoading(true);
      
      // Buscar dados do grupo
      const { data: groupData, error: groupError } = await supabase
        .from('expense_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData as ExpenseGroup);

      // Buscar membros do grupo
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          profile:profiles!group_members_user_id_fkey(*)
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData as any || []);

    } catch (error) {
      console.error('Erro ao buscar dados do grupo:', error);
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const myExpenses = expenses.filter(expense => expense.paid_by === user?.id);
    const myTotal = myExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      totalSpent,
      myTotal,
      expenseCount: expenses.length
    };
  };

  const isGroupAdmin = members.find(member => 
    member.user_id === user?.id && member.role === 'admin'
  );

  useEffect(() => {
    fetchGroupData();
  }, [groupId, user]);

  if (loading || expensesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Grupo não encontrado</p>
            <Button onClick={() => navigate('/groups')} className="mt-4">
              Voltar aos Grupos
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Cabeçalho do grupo */}
        <div className="flex items-start gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                {group.description && (
                  <p className="text-muted-foreground mt-1">{group.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {group.group_type === 'travel' && 'Viagem'}
                    {group.group_type === 'party' && 'Festa'}
                    {group.group_type === 'gathering' && 'Confraternização'}
                    {group.group_type === 'house' && 'Casa'}
                    {group.group_type === 'other' && 'Outros'}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {members.length} membros
                  </div>
                </div>
              </div>
              
              <Button className="shadow-card">
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            </div>
          </div>
        </div>

        {/* Resumo financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(totals.totalSpent)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Minhas Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(totals.myTotal)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-foreground">
                  {totals.expenseCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas de conteúdo */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="pools">Caixinha</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            {expenses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onViewSplits={(expenseId) => console.log('View splits:', expenseId)}
                    isOwner={expense.paid_by === user?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg mb-4">
                  Nenhuma despesa adicionada ainda
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Adicione a primeira despesa para começar a dividir custos
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Despesa
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card key={member.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {member.profile?.full_name || 'Usuário'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profile?.phone || 'Sem telefone'}
                        </p>
                      </div>
                      <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                        {member.role === 'admin' ? 'Admin' : 'Membro'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pools" className="space-y-6">
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-4">
                Funcionalidade de Caixinha em desenvolvimento
              </div>
              <p className="text-sm text-muted-foreground">
                Em breve você poderá criar caixinhas coletivas para o grupo
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}