import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Transaction } from "./TransactionForm";

interface FinancialChartProps {
  transactions: Transaction[];
}

const COLORS = {
  income: 'hsl(var(--success))',
  expense: 'hsl(var(--danger))',
  debt: 'hsl(var(--warning))',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function FinancialChart({ transactions }: FinancialChartProps) {
  // Dados para gráfico de pizza (por tipo)
  const pieData = [
    {
      name: 'Receitas',
      value: transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
      color: COLORS.income
    },
    {
      name: 'Gastos',
      value: transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) +
        transactions
        .filter(t => t.type === 'debt' && t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0),
      color: COLORS.expense
    },
    {
      name: 'Dívidas Abertas',
      value: transactions
        .filter(t => t.type === 'debt' && t.status === 'open')
        .reduce((sum, t) => sum + t.amount, 0),
      color: COLORS.debt
    }
  ].filter(item => item.value > 0);

  // Dados para gráfico de barras (gastos por categoria)
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense' || (t.type === 'debt' && t.status === 'paid'))
    .reduce((acc, t) => {
      const category = t.category || 'Outros';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const barData = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({
      category,
      amount
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // Dados para gráfico de linha temporal (últimos 7 dias)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const timelineData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date === date);
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      receitas: income,
      gastos: expenses
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'amount' ? 'Valor' : entry.dataKey}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p style={{ color: data.payload.color }}>
            Valor: {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza - Distribuição por Tipo */}
      <Card className="animate-fadeIn shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Distribuição por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend 
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Gastos por Categoria */}
      <Card className="animate-fadeIn shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Top Categorias de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem gastos para exibir
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Últimos 7 Dias */}
      <Card className="animate-fadeIn shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Movimentação dos Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="receitas" 
                fill="hsl(var(--success))" 
                name="Receitas"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="gastos" 
                fill="hsl(var(--danger))" 
                name="Gastos"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}