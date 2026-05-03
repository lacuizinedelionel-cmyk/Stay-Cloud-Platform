import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, ClipboardList, Star, UtensilsCrossed, Sparkles, Clock3 } from 'lucide-react';

const MENU_SECTIONS = [
  {
    title: 'Entrées',
    tone: 'hsl(38 90% 56%)',
    items: [
      { id: 1, name: 'Salade avocat-crevettes', price: 4500, status: 'Disponible', featured: true, prep: '10 min' },
      { id: 2, name: 'Soupe claire du jour', price: 3000, status: 'Disponible', featured: false, prep: '8 min' },
      { id: 3, name: 'Beignets haricot', price: 2500, status: 'Disponible', featured: false, prep: '12 min' },
    ],
  },
  {
    title: 'Plats de Résistance',
    tone: '#F97316',
    items: [
      { id: 4, name: 'Poulet DG', price: 8500, status: 'Disponible', featured: true, prep: '25 min' },
      { id: 5, name: 'Poisson braisé', price: 9500, status: 'Disponible', featured: true, prep: '30 min' },
      { id: 6, name: 'Ndolé crevettes', price: 7000, status: 'Disponible', featured: false, prep: '20 min' },
      { id: 7, name: 'Soya premium', price: 3000, status: 'Rupture imminente', featured: false, prep: '12 min' },
    ],
  },
  {
    title: 'Boissons',
    tone: '#60A5FA',
    items: [
      { id: 8, name: 'Jus de gingembre', price: 1500, status: 'Disponible', featured: true, prep: '5 min' },
      { id: 9, name: 'Bissap maison', price: 1200, status: 'Disponible', featured: false, prep: '4 min' },
      { id: 10, name: 'Café noir', price: 1000, status: 'Disponible', featured: false, prep: '3 min' },
    ],
  },
  {
    title: 'Desserts',
    tone: '#A78BFA',
    items: [
      { id: 11, name: 'Salade de fruits', price: 2500, status: 'Disponible', featured: false, prep: '6 min' },
      { id: 12, name: 'Gâteau coco', price: 3500, status: 'Disponible', featured: true, prep: '8 min' },
    ],
  },
];

export default function RestaurantMenuPage() {
  const { business } = useAuth();
  const [query, setQuery] = useState('');

  const sections = useMemo(() => MENU_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => item.name.toLowerCase().includes(query.toLowerCase())),
  })), [query]);

  const totalItems = MENU_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
  const featuredCount = MENU_SECTIONS.reduce((sum, section) => sum + section.items.filter(item => item.featured).length, 0);

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
                {business?.name ?? 'Votre établissement'} · {totalItems} articles · {featuredCount} mis en avant
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
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un plat..." className="pl-9 h-11" />
            </div>
            <Badge variant="outline" className="h-11 px-4 flex items-center justify-center gap-2">
              <Clock3 className="w-3.5 h-3.5" /> Mise à jour en temps réel
            </Badge>
          </div>

          <ScrollArea className="h-[600px] pr-3">
            <div className="space-y-8">
              {sections.map(section => (
                <section key={section.title} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${section.tone}18`, color: section.tone }}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{section.title}</h3>
                        <p className="text-xs text-muted-foreground">{section.items.length} article(s)</p>
                      </div>
                    </div>
                    <Badge variant="outline" style={{ borderColor: `${section.tone}40`, color: section.tone }}>
                      Catégorie
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {section.items.map(item => (
                      <div key={item.id} className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-base">{item.name}</h4>
                              {item.featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{section.title}</p>
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
                </section>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
