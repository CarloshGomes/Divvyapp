import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGroups } from "@/hooks/useGroups";
import { Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Groups() {
  const { groups, loading, createGroup } = useGroups();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  const filteredGroups = useMemo(() => {
    let filtered = groups;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (filterType !== "all") {
      filtered = filtered.filter(group => group.group_type === filterType);
    }

    return filtered;
  }, [groups, searchTerm, filterType]);

  const handleViewGroup = (groupId: string) => {
    navigate(`/group/${groupId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando grupos...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meus Grupos</h1>
            <p className="text-muted-foreground">
              Gerencie seus grupos de divisão de despesas
            </p>
          </div>
          <CreateGroupDialog onCreateGroup={createGroup} />
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="travel">Viagem</SelectItem>
                <SelectItem value="party">Festa</SelectItem>
                <SelectItem value="gathering">Confraternização</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de grupos */}
        {filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onViewGroup={handleViewGroup}
                memberCount={0} // TODO: Calcular número de membros
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-4">
              {searchTerm || filterType !== "all" 
                ? "Nenhum grupo encontrado com os filtros aplicados" 
                : "Você ainda não tem grupos"
              }
            </div>
            {!searchTerm && filterType === "all" && (
              <p className="text-sm text-muted-foreground mb-6">
                Crie seu primeiro grupo para começar a dividir despesas com amigos e família
              </p>
            )}
            {(!searchTerm && filterType === "all") && (
              <CreateGroupDialog onCreateGroup={createGroup} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}