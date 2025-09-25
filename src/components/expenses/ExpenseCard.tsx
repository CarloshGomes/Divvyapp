import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, User, Receipt } from "lucide-react";
import { SharedExpense } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface ExpenseCardProps {
  expense: SharedExpense;
  onViewSplits: (expenseId: string) => void;
  isOwner?: boolean;
}

const SPLIT_TYPE_LABELS = {
  equal: 'Divisão Igual',
  percentage: 'Por Porcentagem',
  custom: 'Personalizada'
};

const SPLIT_TYPE_COLORS = {
  equal: 'text-success border-success/20 bg-success/10',
  percentage: 'text-warning border-warning/20 bg-warning/10',
  custom: 'text-accent border-accent/20 bg-accent/10'
};

export function ExpenseCard({ expense, onViewSplits, isOwner = false }: ExpenseCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="animate-fadeIn shadow-card hover:shadow-hover transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{expense.title}</CardTitle>
            {expense.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {expense.description}
              </p>
            )}
          </div>
          {isOwner && (
            <Badge variant="outline" className="text-xs">
              Você pagou
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span className="font-bold text-lg text-success">
              {formatCurrency(expense.amount)}
            </span>
          </div>
          
          <Badge className={SPLIT_TYPE_COLORS[expense.split_type]}>
            {SPLIT_TYPE_LABELS[expense.split_type]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(expense.expense_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {expense.paid_by_profile?.full_name || 'Usuário'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {expense.category}
          </Badge>
          
          <div className="flex gap-2">
            {expense.receipt_url && (
              <Button size="sm" variant="outline">
                <Receipt className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={() => onViewSplits(expense.id)}
            >
              Ver Divisão
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}