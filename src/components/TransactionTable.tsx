import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Transaction } from "./TransactionForm";

interface TransactionTableProps {
  transactions: Transaction[];
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

const getTypeDisplay = (type: string) => {
  switch (type) {
    case 'income':
      return { label: 'Receita', className: 'text-success border-success/20 bg-success/10' };
    case 'expense':
      return { label: 'Gasto', className: 'text-primary border-primary/20 bg-primary/10' };
    case 'debt':
      return { label: 'Dívida', className: 'text-warning border-warning/20 bg-warning/10' };
    default:
      return { label: type, className: 'text-muted-foreground' };
  }
};

export function TransactionTable({ 
  transactions, 
  onPayDebt, 
  onEditTransaction, 
  onDeleteTransaction 
}: TransactionTableProps) {
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(b.date + 'T' + b.createdAt);
    const dateB = new Date(a.date + 'T' + a.createdAt);
    return dateA.getTime() - dateB.getTime();
  });

  const handlePayDebt = async (id: string) => {
    const paymentDate = prompt('Digite a data do pagamento (AAAA-MM-DD):', new Date().toISOString().split('T')[0]);
    if (paymentDate && /^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      onPayDebt(id, paymentDate);
    } else if (paymentDate !== null) {
      alert('Formato de data inválido.');
    }
  };

  return (
    <Card className="animate-fadeIn shadow-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Movimentações</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            📊 Ordenado por data (mais recente)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status/Vencimento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((transaction) => {
                const typeDisplay = getTypeDisplay(transaction.type);
                const isDebt = transaction.type === 'debt';
                
                let statusColumn = <span className="text-muted-foreground">—</span>;
                
                if (isDebt) {
                  if (transaction.status === 'open' && transaction.dueDate) {
                    const daysDiff = getDaysDiff(transaction.dueDate);
                    const isOverdue = daysDiff < 0;
                    const isDueSoon = daysDiff <= 7 && daysDiff >= 0;
                    
                    const statusClass = isOverdue 
                      ? 'text-danger' 
                      : isDueSoon 
                        ? 'text-warning' 
                        : 'text-muted-foreground';
                    
                    const label = isOverdue 
                      ? `Vencido há ${Math.abs(daysDiff)}d`
                      : `Em ${daysDiff}d`;
                    
                    statusColumn = (
                      <div className="space-y-1">
                        <Badge className="text-warning border-warning/20 bg-warning/10">
                          Em aberto
                        </Badge>
                        <div className={`text-xs ${statusClass}`}>
                          {formatDateBR(transaction.dueDate)} • {label}
                        </div>
                      </div>
                    );
                  } else if (transaction.status === 'paid') {
                    statusColumn = (
                      <Badge className="text-success border-success/20 bg-success/10">
                        Pago em {formatDateBR(transaction.paidDate || '')}
                      </Badge>
                    );
                  }
                }

                return (
                  <TableRow key={transaction.id} className="hover:bg-accent/5">
                    <TableCell>{formatDateBR(transaction.date)}</TableCell>
                    <TableCell>
                      <Badge className={typeDisplay.className}>
                        {typeDisplay.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.description || '(Sem descrição)'}
                    </TableCell>
                    <TableCell>{transaction.category || 'Outros'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>{statusColumn}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {isDebt && transaction.status === 'open' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handlePayDebt(transaction.id)}
                          >
                            Pagar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onEditTransaction(transaction.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDeleteTransaction(transaction.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma movimentação encontrada. Comece adicionando uma receita ou gasto!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}