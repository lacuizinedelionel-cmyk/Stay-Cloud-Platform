import { useAuth } from '@/context/AuthContext';
import { 
  useGetGroceryStats,
  getGetGroceryStatsQueryKey,
  useListGroceryProducts, 
  getListGroceryProductsQueryKey
} from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { DashboardHero } from '@/components/dashboard-hero';
import { ShoppingCart, Package, AlertTriangle, Truck } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';

function PulseDot({ color = '#EF4444' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ background: color }}
      />
      <span
        className="relative inline-flex h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
    </span>
  );
}

export default function GroceryDashboard() {
  const { business } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetGroceryStats(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getGetGroceryStatsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: products, isLoading: productsLoading } = useListGroceryProducts(
    { businessId: business?.id ?? 0, lowStock: true },
    { query: { enabled: !!business?.id, queryKey: getListGroceryProductsQueryKey({ businessId: business?.id ?? 0, lowStock: true }) } }
  );

  const criticalCount = (products ?? []).filter(p => p.stock === 0).length;
  const hasCritical = criticalCount > 0;

  return (
    <div className="p-6 md:p-8 space-y-6 page-enter">
      <DashboardHero
        title="Tableau de bord Supérette"
        subtitle="Gérez vos stocks et vos ventes"
        gradient="linear-gradient(135deg,#059669,#34D399)"
        color="#34D399"
        bg="rgba(52,211,153,0.08)"
        icon={ShoppingCart}
        badge="PRO"
        stats={stats ? [
          { label: 'ventes du jour', value: new Intl.NumberFormat('fr-FR').format(stats.dailySales) + ' FCFA' },
          { label: 'articles vendus', value: String(stats.itemsSoldToday) },
          ...(criticalCount > 0 ? [{ label: 'ruptures', value: String(criticalCount), color: '#EF4444' }] : []),
        ] : undefined}
      />

      {/* Critical stock banner */}
      <AnimatePresence>
        {hasCritical && !statsLoading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{
              background: 'hsl(0 72% 51% / 0.08)',
              border: '1px solid hsl(0 72% 51% / 0.3)',
            }}
          >
            <PulseDot />
            <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>
              Alerte stock critique — {criticalCount} produit{criticalCount > 1 ? 's' : ''} en rupture totale
            </p>
            <span className="ml-auto text-xs text-muted-foreground">Action requise</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Ventes du Jour" value={stats.dailySales} icon={ShoppingCart} isCurrency accent staggerIndex={0} />
            <KPICard title="Articles Vendus" value={stats.itemsSoldToday} icon={Package} color="#34D399" staggerIndex={1} />
            <div className="relative">
              {hasCritical && (
                <span className="absolute top-3 right-3 z-10">
                  <PulseDot />
                </span>
              )}
              <KPICard title="Ruptures de Stock" value={stats.lowStockCount} icon={AlertTriangle} color={hasCritical ? '#EF4444' : '#F59E0B'} staggerIndex={2} />
            </div>
            <KPICard title="Fournisseurs Actifs" value={stats.activeSuppliers} icon={Truck} color="#60A5FA" staggerIndex={3} />
          </>
        ) : null}
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Produits en rupture ou stock critique
            {hasCritical && <PulseDot />}
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
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={product.stock <= 0
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}
                          >
                            {product.stock}
                          </Badge>
                          {product.stock === 0 && <PulseDot />}
                        </div>
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
