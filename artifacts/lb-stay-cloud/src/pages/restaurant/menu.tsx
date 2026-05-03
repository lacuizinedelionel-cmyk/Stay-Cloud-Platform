import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, ClipboardList, Star, UtensilsCrossed, Sparkles, Clock3 } from 'lucide-react';

const MENU_ITEMS = [
  { id: 1, name: 'Poulet DG', category: 'Plats', price: 8500, status: 'Disponible', featured: true, prep: '25 min' },
  { id: 2, name: 'Poisson braisé', category: 'Plats', price: 9500, status: 'Disponible', featured: true, prep: '30 min' },
  { id: 3, name: 'Ndolé crevettes', category: 'Plats', price: 7000, status: 'Disponible', featured: false, prep: '20 min' },
  { id: 4, name: 'Jus de gingembre', category: 'Boissons', price: 1500, status: 'Disponible', featured: true, prep: '5 min' },
  { id: 5, name: 'Soya premium', category: 'Grillades', price: 3000, status: 'Rupture imminente', featured: false, prep: '12 min' },
  { id: 6, name: 'Plantain mûr', category: 'Accompagnements', price: 2500, status: 'Disponible', featured: false, prep: '10 min' },
  { id: 7, name: 'Omelette complète', category: 'Petit-déjeuner', price: 4000, status: 'Disponible', featured: false, prep: '8 min' },
  { id: 8, name: 'Café noir', category: 'Boissons', price: 1000, status: 'Disponible', featured: false, prep: '3 min' },
];

const categories = ['Tous', ...Array.from(new Set(MENU_ITEMS.map(item => item.category)))];

export default function RestaurantMenuPage() {
  const { business } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tous');

  const filtered = useMemo(() => MENU_ITEMS.filter(item => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'Tous' || item.category === category;
    return matchesQuery && matchesCategory;
  }), [query, category]);

  const featuredCount = MENU_ITEMS.filter(item => item.featured).length;

  return (
    <div className="p-6 md:p-8 space-y-6 page-enter">
      <Card className="border-border/50 bg-card overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UtensilsCrossed className="w-4 h-4" />
                Restaurant · Menu & Carte
              </div>
              <CardTitle className="text-2xl">Carte du restaurant</CardTitle>
              <p className="text-sm text-muted-foreground">
                {business?.name ?? 'Votre établissement'} · {MENU_ITEMS.length} articles · {featuredCount} mis en avant
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2 gradient-gold text-white">
                <Plus className="w-4 h-4" /> Ajouter un plat
              </Button>
              <Button variant="outline" className="gap-2">
                <ClipboardList className="w-4 h-4" /> Imprimer la carte
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un plat..." className="pl-9 h-11" />
            </div>
            <Badge variant="outline" className="h-11 px-4 flex items-center justify-center gap-2">
              <Clock3 className="w-3.5 h-3.5" /> Mise à jour en temps réel
            </Badge>
          </div>

          <Tabs value={category} onValueChange={setCategory} className="w-full">
            <TabsList className="h-auto flex flex-wrap gap-2 bg-transparent p-0 justify-start">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={category} className="mt-4">
              <ScrollArea className="h-[520px] pr-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map(item => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base">{item.name}</h3>
                            {item.featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <Badge variant={item.status === 'Rupture imminente' ? 'destructive' : 'outline'}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Préparation</span>
                        <span className="font-medium">{item.prep}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">{new Intl.NumberFormat('fr-FR').format(item.price)} FCFA</span>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Sparkles className="w-4 h-4" /> Modifier
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
