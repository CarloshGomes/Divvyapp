import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ExpenseGroup } from "@/types/database";

interface CreateGroupDialogProps {
  onCreateGroup: (groupData: {
    name: string;
    description?: string;
    group_type: ExpenseGroup['group_type'];
  }) => Promise<ExpenseGroup | null>;
}

const GROUP_TYPES = [
  { value: 'travel', label: 'Viagem' },
  { value: 'party', label: 'Festa' },
  { value: 'gathering', label: 'Confraternização' },
  { value: 'house', label: 'Casa' },
  { value: 'other', label: 'Outros' }
] as const;

export function CreateGroupDialog({ onCreateGroup }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'other' as ExpenseGroup['group_type']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    setLoading(true);
    
    try {
      const result = await onCreateGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        group_type: formData.group_type
      });

      if (result) {
        setFormData({ name: '', description: '', group_type: 'other' });
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-card">
          <Plus className="h-4 w-4 mr-2" />
          Criar Grupo
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Grupo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Viagem para a praia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Grupo</Label>
            <Select
              value={formData.group_type}
              onValueChange={(value: ExpenseGroup['group_type']) => 
                setFormData(prev => ({ ...prev, group_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o propósito do grupo..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !formData.name.trim()} className="flex-1">
              {loading ? "Criando..." : "Criar Grupo"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}