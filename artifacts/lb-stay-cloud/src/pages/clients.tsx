import { useAuth } from '@/context/AuthContext';
import { 
  useListClients, 
  getListClientsQueryKey,
  ClientLoyaltyLevel
} from '@workspace/api-client-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ClientsPage() {
  const { business } = useAuth();
  
  const { data: clients, isLoading } = useListClients(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getListClientsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const getLoyaltyColor = (level: ClientLoyaltyLevel) => {
    switch (level) {
      case 'BRONZE': return 'bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/30';
      case 'SILVER': return 'bg-gray-400/10 text-gray-400 border-gray-400/30';
      case 'GOLD': return 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30';
      case 'PLATINUM': return 'bg-[#E5E4E2]/10 text-[#E5E4E2] border-[#E5E4E2]/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients (CRM)</h1>
          <p className="text-muted-foreground mt-1">Gérez votre base de clients et leur fidélité</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un client
        </Button>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher un client..." className="pl-9 bg-background/50 border-border/50" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="p-6 space-y-4">
               {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
          ) : clients && clients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="pl-6">Nom</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Niveau de Fidélité</TableHead>
                    <TableHead className="text-right">Visites</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right pr-6">Total Dépensé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="border-border/50">
                      <TableCell className="font-medium pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{client.phone || '-'}</div>
                        <div className="text-xs text-muted-foreground">{client.email || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getLoyaltyColor(client.loyaltyLevel)}>
                          {client.loyaltyLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{client.visitCount}</TableCell>
                      <TableCell className="text-right font-medium">{client.loyaltyPoints}</TableCell>
                      <TableCell className="text-right font-bold pr-6">{formatXAF(client.totalSpent)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <Users className="w-12 h-12 mb-4 opacity-20" />
              <p>Aucun client enregistré</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
