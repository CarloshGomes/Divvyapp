import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "./TransactionForm";

interface ReportsSectionProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDateBR = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export function ReportsSection({ transactions }: ReportsSectionProps) {
  const [reportType, setReportType] = useState<'week' | 'month' | 'custom' | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getWeekRange = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0],
      label: `Semana (${formatDateBR(startOfWeek.toISOString().split('T')[0])} a ${formatDateBR(endOfWeek.toISOString().split('T')[0])})`
    };
  };

  const getMonthRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0],
      label: `Mês (${startOfMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })})`
    };
  };

  const generateReport = (startDate: string, endDate: string, label: string) => {
    const filteredTransactions = transactions.filter(t => {
      if (t.type === 'debt' && t.status === 'paid') {
        return t.paidDate && t.paidDate >= startDate && t.paidDate <= endDate;
      }
      return t.date >= startDate && t.date <= endDate;
    });

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense' || (t.type === 'debt' && t.status === 'paid'))
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = filteredTransactions
      .filter(t => t.type === 'expense' || (t.type === 'debt' && t.status === 'paid'))
      .reduce((acc, t) => {
        const category = t.category || 'Outros';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      label,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      topCategories,
      transactionCount: filteredTransactions.length
    };
  };

  const handleWeekReport = () => {
    const range = getWeekRange();
    const report = generateReport(range.start, range.end, range.label);
    setReportType('week');
    setCurrentReport(report);
  };

  const handleMonthReport = () => {
    const range = getMonthRange();
    const report = generateReport(range.start, range.end, range.label);
    setReportType('month');
    setCurrentReport(report);
  };

  const handleCustomReport = () => {
    if (!customStartDate || !customEndDate) {
      alert('Selecione as datas de início e fim para o relatório personalizado');
      return;
    }
    
    if (customStartDate > customEndDate) {
      alert('A data de início deve ser anterior à data final');
      return;
    }

    const label = `Personalizado (${formatDateBR(customStartDate)} a ${formatDateBR(customEndDate)})`;
    const report = generateReport(customStartDate, customEndDate, label);
    setReportType('custom');
    setCurrentReport(report);
  };

  const [currentReport, setCurrentReport] = useState<any>(null);

  return (
    <Card className="animate-fadeIn shadow-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Relatórios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botões de Relatório */}
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={handleWeekReport}
            className={reportType === 'week' ? 'bg-primary/10 border-primary' : ''}
          >
            Semana Atual
          </Button>
          <Button 
            variant="outline" 
            onClick={handleMonthReport}
            className={reportType === 'month' ? 'bg-primary/10 border-primary' : ''}
          >
            Mês Atual
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setReportType('custom')}
            className={reportType === 'custom' ? 'bg-primary/10 border-primary' : ''}
          >
            Personalizado
          </Button>
        </div>

        {/* Formulário de Relatório Personalizado */}
        {reportType === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={handleCustomReport}
                className="w-full"
                disabled={!customStartDate || !customEndDate}
              >
                Gerar Relatório
              </Button>
            </div>
          </div>
        )}

        {/* Resultados do Relatório */}
        {currentReport ? (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-semibold text-lg mb-3">{currentReport.label}</h4>
              
              {/* Resumo Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Receitas no Período
                  </div>
                  <div className="text-xl font-bold text-success mt-1">
                    {formatCurrency(currentReport.totalIncome)}
                  </div>
                </div>
                
                <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Gastos no Período
                  </div>
                  <div className="text-xl font-bold text-danger mt-1">
                    {formatCurrency(currentReport.totalExpenses)}
                  </div>
                </div>
                
                <div className={`${currentReport.balance >= 0 ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20'} border rounded-lg p-4`}>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Saldo do Período
                  </div>
                  <div className={`text-xl font-bold mt-1 ${currentReport.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(currentReport.balance)}
                  </div>
                </div>
              </div>

              {/* Top Categorias */}
              {currentReport.topCategories.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <h5 className="font-semibold mb-3">Top Categorias de Gastos</h5>
                  <div className="space-y-3">
                    {currentReport.topCategories.map(([category, amount]: [string, number], index: number) => {
                      const percentage = currentReport.totalExpenses > 0 
                        ? (amount / currentReport.totalExpenses) * 100 
                        : 0;
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{category}</span>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(amount)}</div>
                              <div className="text-xs text-muted-foreground">
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Badge variant="outline" className="mt-4">
                📊 {currentReport.transactionCount} transação(ões) no período
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">📊 Clique em um dos botões para gerar o relatório</p>
            <p className="text-sm mt-2">Analise seus gastos e receitas por período</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}