import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, DollarSign } from "lucide-react";
import { ExpenseGroup } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface GroupCardProps {
  group: ExpenseGroup;
  onViewGroup: (groupId: string) => void;
  memberCount?: number;
}

const GROUP_TYPE_LABELS = {
  travel: 'Viagem',
  party: 'Festa',
  gathering: 'Confraternização',
  house: 'Casa',
  other: 'Outros'
};

const GROUP_TYPE_COLORS = {
  travel: 'text-accent border-accent/20 bg-accent/10',
  party: 'text-warning border-warning/20 bg-warning/10',
  gathering: 'text-success border-success/20 bg-success/10',
  house: 'text-primary border-primary/20 bg-primary/10',
  other: 'text-muted-foreground border-muted/20 bg-muted/10'
};

export function GroupCard({ group, onViewGroup, memberCount = 0 }: GroupCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="animate-fadeIn shadow-card hover:shadow-hover transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {group.name}
            </CardTitle>
            {group.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
          <Badge className={GROUP_TYPE_COLORS[group.group_type]}>
            {GROUP_TYPE_LABELS[group.group_type]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{memberCount} membros</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(group.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {formatCurrency(group.total_amount || 0)}
            </span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => onViewGroup(group.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}