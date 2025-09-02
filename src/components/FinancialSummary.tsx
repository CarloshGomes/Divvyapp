import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  totalDebt: number;
  currentBalance: number;
}

interface FinancialSummaryProps {
  data: SummaryData;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function FinancialSummary({ data }: FinancialSummaryProps) {
  const { totalIncome, totalExpenses, totalDebt, currentBalance } = data;
  const balanceWithDebt = currentBalance - totalDebt;
  const isPositive = balanceWithDebt >= 0;

  return (
    <Card className="animate-fadeIn shadow-card hover:shadow-hover transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Resumo Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-background/50 p-4 rounded-xl border border-border hover:border-success/50 transition-all duration-200 cursor-pointer hover:scale-105">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Total de Receitas
            </div>
            <div className="text-xl font-bold text-success mt-2">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          
          <div className="bg-background/50 p-4 rounded-xl border border-border hover:border-danger/50 transition-all duration-200 cursor-pointer hover:scale-105">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Total de Gastos
            </div>
            <div className="text-xl font-bold text-danger mt-2">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          
          <div className="bg-background/50 p-4 rounded-xl border border-border hover:border-warning/50 transition-all duration-200 cursor-pointer hover:scale-105">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Total de Dívidas
            </div>
            <div className="text-xl font-bold text-warning mt-2">
              {formatCurrency(totalDebt)}
            </div>
          </div>
          
          <div className="bg-background/50 p-4 rounded-xl border border-border hover:border-accent/50 transition-all duration-200 cursor-pointer hover:scale-105">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Saldo Atual
            </div>
            <div className={`text-xl font-bold mt-2 ${currentBalance >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(currentBalance)}
            </div>
          </div>
        </div>

        <div className="bg-background/30 p-4 rounded-xl border border-dashed border-border flex items-center gap-3">
          <div 
            className={`w-2 h-2 rounded-full animate-pulse-dot ${
              isPositive ? 'bg-success' : 'bg-danger'
            }`}
          />
          <span className="text-sm">
            {isPositive 
              ? 'Você está no positivo considerando dívidas em aberto.' 
              : 'Atenção: você está no negativo considerando dívidas em aberto.'
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
}