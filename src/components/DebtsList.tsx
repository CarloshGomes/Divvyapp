import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "./TransactionForm";

interface DebtsListProps {
  debts: Transaction[];
  onPayDebt: (id: string, paymentDate: string) => void;
  onEditTransaction: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDateBR = (dateStr: string) => {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const getDaysDiff = (dateStr: string): number => {
  const today = new Date();
  const targetDate = new Date(dateStr + 'T00:00:00');
  return Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getDueBadge = (dueDate: string) => {
  const daysDiff = getDaysDiff(dueDate);
  
  if (daysDiff < 0) {
    return {
      text: `Vencido há ${Math.abs(daysDiff)} dia(s)`,
      variant: 'destructive' as const,
      className: 'text-danger border-danger/20 bg-danger/10'
    };
  } else if (daysDiff <= 7) {
    return {
      text: `Vence em ${daysDiff} dia(s)`,
      variant: 'outline' as const,
      className: 'text-warning border-warning/20 bg-warning/10'
    };
  } else {
    return {
      text: `Vence em ${daysDiff} dia(s)`,
      variant: 'outline' as const,
      className: 'text-muted-foreground'
    };
  }
};

export function DebtsList({ debts, onPayDebt, onEditTransaction, onDeleteTransaction }: DebtsListProps) {
  const openDebts = debts
    .filter(debt => debt.type === 'debt' && debt.status === 'open')
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 6);

  const handlePayDebt = async (id: string) => {
    const paymentDate = prompt('Digite a data do pagamento (AAAA-MM-DD):', new Date().toISOString().split('T')[0]);
    if (paymentDate && /^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      onPayDebt(id, paymentDate);
    } else if (paymentDate !== null) {
      alert('Formato de data inválido.');
    }
  };

  return (
    <Card className="animate-fadeIn shadow-card min-h-[200px]">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Próximas Dívidas a Pagar</CardTitle>
      </CardHeader>
      <CardContent>
        {openDebts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">🎉 Nenhuma dívida em aberto!</p>
            <p className="text-sm mt-2">Parabéns por manter suas finanças em dia!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openDebts.map((debt) => {
              const dueBadge = getDueBadge(debt.dueDate || '');
              
              return (
                <div
                  key={debt.id}
                  className="bg-background/50 border border-border rounded-xl p-4 hover:border-accent/50 transition-all duration-200 hover:translate-x-1"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {debt.description || '(Sem descrição)'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {debt.category} • Vencimento: {formatDateBR(debt.dueDate || '')}
                      </p>
                      <p className="text-xl font-bold text-warning mt-1">
                        {formatCurrency(debt.amount)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3 lg:items-end">
                      <Badge className={dueBadge.className}>
                        {dueBadge.text}
                      </Badge>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handlePayDebt(debt.id)}
                        >
                          Pagar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onEditTransaction(debt.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDeleteTransaction(debt.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}