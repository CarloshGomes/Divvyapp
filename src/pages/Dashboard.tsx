import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FinancialSummary } from "@/components/FinancialSummary";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { DebtsList } from "@/components/DebtsList";
import { TransactionTable } from "@/components/TransactionTable";
import { useToast } from "@/components/ui/use-toast";

const generateId = () => {
  return 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
};

const DEFAULT_STATE = {
  transactions: [] as Transaction[],
  initialBalance: 0
};

function loadState() {
  try {
    const raw = localStorage.getItem('financeState_v3');
    if (!raw) return { ...DEFAULT_STATE };
    
    const data = JSON.parse(raw);
    return {
      transactions: (data.transactions || []).map((t: any) => ({
        id: t.id || generateId(),
        type: t.type,
        amount: Number(t.amount) || 0,
        date: t.date || new Date().toISOString().split('T')[0],
        description: t.description || '',
        category: t.category || 'Outros',
        dueDate: t.dueDate || '',
        status: t.status || (t.type === 'debt' ? 'open' : ''),
        createdAt: t.createdAt || new Date().toISOString(),
        paidDate: t.paidDate || ''
      })),
      initialBalance: Number(data.initialBalance || 0)
    };
  } catch (e) {
    console.error("Erro ao carregar dados locais:", e);
    return { ...DEFAULT_STATE };
  }
}

function saveState(state: typeof DEFAULT_STATE) {
  try {
    localStorage.setItem('financeState_v3', JSON.stringify(state));
  } catch (e) {
    console.error("Erro ao salvar dados locais:", e);
  }
}

export default function Dashboard() {
  const [state, setState] = useState(loadState);
  const { toast } = useToast();

  // Save state whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const computeTotals = () => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalDebt = 0;

    for (const transaction of state.transactions) {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount;
      } else if (transaction.type === 'debt') {
        if (transaction.status === 'open') {
          totalDebt += transaction.amount;
        } else if (transaction.status === 'paid') {
          totalExpenses += transaction.amount;
        }
      }
    }

    const currentBalance = state.initialBalance + totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      totalDebt,
      currentBalance
    };
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    setState(prevState => ({
      ...prevState,
      transactions: [...prevState.transactions, newTransaction]
    }));

    const typeLabels = {
      income: 'Receita',
      expense: 'Gasto', 
      debt: 'Dívida'
    };

    toast({
      title: "Sucesso!",
      description: `${typeLabels[transactionData.type]} adicionada com sucesso!`,
      variant: "default"
    });
  };

  const handlePayDebt = (id: string, paymentDate: string) => {
    setState(prevState => ({
      ...prevState,
      transactions: prevState.transactions.map(t =>
        t.id === id 
          ? { ...t, status: 'paid' as const, paidDate: paymentDate }
          : t
      )
    }));

    toast({
      title: "Dívida paga!",
      description: "Dívida marcada como paga com sucesso.",
      variant: "default"
    });
  };

  const handleEditTransaction = async (id: string) => {
    const transaction = state.transactions.find(t => t.id === id);
    if (!transaction) return;

    const newValueStr = prompt(
      `Editando: ${transaction.description || 'item sem descrição'}. Qual o novo valor?`,
      String(transaction.amount).replace('.', ',')
    );

    if (newValueStr === null) return;

    const newValue = parseFloat(newValueStr.replace(',', '.'));
    if (newValue > 0) {
      setState(prevState => ({
        ...prevState,
        transactions: prevState.transactions.map(t =>
          t.id === id ? { ...t, amount: newValue } : t
        )
      }));

      toast({
        title: "Valor atualizado",
        description: "Valor da transação atualizado com sucesso!",
        variant: "default"
      });
    } else {
      toast({
        title: "Erro",
        description: "Valor inválido.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.')) {
      setState(prevState => ({
        ...prevState,
        transactions: prevState.transactions.filter(t => t.id !== id)
      }));

      toast({
        title: "Movimentação excluída",
        description: "A movimentação foi removida com sucesso.",
        variant: "default"
      });
    }
  };

  const summaryData = computeTotals();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <FinancialSummary data={summaryData} />
        
        <TransactionForm onSubmit={handleAddTransaction} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DebtsList
            debts={state.transactions}
            onPayDebt={handlePayDebt}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
          
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="text-xl font-bold mb-4">Relatórios</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button className="px-4 py-2 text-sm border border-border rounded-lg hover:border-accent transition-colors">
                  Semana atual
                </button>
                <button className="px-4 py-2 text-sm border border-border rounded-lg hover:border-accent transition-colors">
                  Mês atual
                </button>
                <button className="px-4 py-2 text-sm border border-border rounded-lg hover:border-accent transition-colors">
                  Personalizado
                </button>
              </div>
              <div className="text-center py-8 text-muted-foreground text-sm">
                📊 Clique em um dos botões para gerar o relatório
              </div>
            </div>
          </div>
        </div>

        <TransactionTable
          transactions={state.transactions}
          onPayDebt={handlePayDebt}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </main>
    </div>
  );
}