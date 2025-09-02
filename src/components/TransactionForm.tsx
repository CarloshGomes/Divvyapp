import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'debt';
  amount: number;
  date: string;
  description: string;
  category: string;
  dueDate?: string;
  status?: 'open' | 'paid';
  createdAt: string;
  paidDate?: string;
}

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

const INCOME_CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Reembolso', 'Outros'];
const EXPENSE_CATEGORIES = ['Alimentação', 'Transporte', 'Lazer', 'Contas Fixas', 'Investimentos', 'Saúde', 'Educação', 'Outros'];

const parseValue = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isFinite(parsed) ? parsed : 0;
};

const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense' | 'debt'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getCurrentDate());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseValue(amount);
    if (parsedAmount <= 0) {
      alert('Informe um valor válido.');
      return;
    }
    
    if (!date) {
      alert('Informe a data.');
      return;
    }
    
    if (type === 'debt' && !dueDate) {
      alert('Informe o vencimento da dívida.');
      return;
    }

    const transaction = {
      type,
      amount: parsedAmount,
      date,
      description: description.trim(),
      category: category || 'Outros',
      dueDate: type === 'debt' ? dueDate : undefined,
      status: type === 'debt' ? 'open' as const : undefined,
      paidDate: undefined
    };

    onSubmit(transaction);
    
    // Reset form
    setAmount('');
    setDate(getCurrentDate());
    setDescription('');
    setCategory('');
    setDueDate('');
  };

  const handleClear = () => {
    setAmount('');
    setDate(getCurrentDate());
    setDescription('');
    setCategory('');
    setDueDate('');
    setType('expense');
  };

  return (
    <Card className="animate-fadeIn shadow-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Adicionar Movimentação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(value: 'income' | 'expense' | 'debt') => setType(value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="debt">Dívida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 1200,50"
                inputMode="decimal"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            {type === 'debt' && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Supermercado, Salário, Boleto de cartão..."
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="success" className="min-w-32">
              Adicionar
            </Button>
            <Button type="button" variant="secondary" onClick={handleClear}>
              Limpar
            </Button>
          </div>

          <div className="mt-4">
            <Badge variant="outline" className="text-xs">
              💡 Dica: Use "Dívida" para contas a pagar com prazo. Ao pagar, marque como "Pago" na lista.
            </Badge>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}