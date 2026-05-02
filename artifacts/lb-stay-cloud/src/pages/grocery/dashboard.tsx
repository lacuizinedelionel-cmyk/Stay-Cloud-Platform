import { useAuth } from '@/context/AuthContext';
import { 
  useGetGroceryStats, 
  useListGroceryProducts, 
  getListGroceryProductsQueryKey
} from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { ShoppingCart, Package, AlertTriangle, Truck } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function GroceryDashboard() {
  const { business } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetGroceryStats(
    { businessId: business?.id },
    { query: { enabled: !!business?.id } }
  );

  const { data: products, isLoading: productsLoading } = useListGroceryProducts(
    { businessId: business?.id, lowStock: true },
    { query: { enabled: !!business?.id, queryKey: getListGroceryProductsQueryKey({ businessId: business?.id, lowStock: true }) } }
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Tableau de bord Supérette</h1>
        <p className="text-muted-foreground mt-1">Gérez vos stocks et vos ventes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Ventes du Jour" value={stats.dailySales} icon={ShoppingCart} isCurrency />
            <KPICard title="Articles Vendus" value={stats.itemsSoldToday} icon={Package} />
            <KPICard title="Ruptures de Stock" value={stats.lowStockCount} icon={AlertTriangle} />
            <KPICard title="Fournisseurs Actifs" value={stats.activeSuppliers} icon={Truck} />
          </>
        ) : null}
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Produits en rupture ou stock critique
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
             <div className="space-y-4">
               {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
          ) : products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Stock Actuel</TableHead>
                    <TableHead>Stock Min.</TableHead>
                    <TableHead className="text-right">Prix de vente</TableHead>
                    <TableHead>Fournisseur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="border-border/50">
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={product.stock <= 0 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.minStock}</TableCell>
                      <TableCell className="text-right">{formatXAF(product.price)}</TableCell>
                      <TableCell>{product.supplierName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Aucun produit en rupture de stock</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
