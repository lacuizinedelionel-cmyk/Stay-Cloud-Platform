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
      { id: 1, name: 'Salade avocat-crevettes', price: 4500, status: 'Disponible', featured: true, prep: '10 min', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80' },
      { id: 2, name: 'Soupe claire du jour', price: 3000, status: 'Disponible', featured: false, prep: '8 min', image: 'https://images.unsplash.com/photo-1547592180-6c9d4f5e3f5e?auto=format&fit=crop&w=900&q=80' },
      { id: 3, name: 'Beignets haricot', price: 2500, status: 'Disponible', featured: false, prep: '12 min', image: 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?auto=format&fit=crop&w=900&q=80' },
    ],
  },
  {
    title: 'Plats de Résistance',
    tone: '#F97316',
    items: [
      { id: 4, name: 'Poulet DG', price: 8500, status: 'Disponible', featured: true, prep: '25 min', image: 'https://images.unsplash.com/photo-1604908177225-4c1f2e4bce36?auto=format&fit=crop&w=900&q=80' },
      { id: 5, name: 'Poisson braisé', price: 9500, status: 'Disponible', featured: true, prep: '30 min', image: 'https://images.unsplash.com/photo-1529706195479-2f0b1a3f4c57?auto=format&fit=crop&w=900&q=80' },
      { id: 6, name: 'Ndolé crevettes', price: 7000, status: 'Disponible', featured: false, prep: '20 min', image: 'https://images.unsplash.com/photo-1625938145744-4d5d45a2f22a?auto=format&fit=crop&w=900&q=80' },
      { id: 7, name: 'Soya premium', price: 3000, status: 'Rupture imminente', featured: false, prep: '12 min', image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=900&q=80' },
    ],
  },
  {
    title: 'Boissons',
    tone: '#60A5FA',
    items: [
      { id: 8, name: 'Jus de gingembre', price: 1500, status: 'Disponible', featured: true, prep: '5 min', image: 'https://images.unsplash.com/photo-1547592180-4a54f6c6c4f0?auto=format&fit=crop&w=900&q=80' },
      { id: 9, name: 'Bissap maison', price: 1200, status: 'Disponible', featured: false, prep: '4 min', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c0fcd?auto=format&fit=crop&w=900&q=80' },
      { id: 10, name: 'Café noir', price: 1000, status: 'Disponible', featured: false, prep: '3 min', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80' },
    ],
  },
  {
    title: 'Desserts',
    tone: '#A78BFA',
    items: [
      { id: 11, name: 'Salade de fruits', price: 2500, status: 'Disponible', featured: false, prep: '6 min', image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=80' },
      { id: 12, name: 'Gâteau coco', price: 3500, status: 'Disponible', featured: true, prep: '8 min', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80' },
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
                      <div key={item.id} className="overflow-hidden rounded-2xl border border-border/60 bg-background/40 shadow-sm">
                        <div className="relative h-44 overflow-hidden">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                          <div className="absolute left-4 top-4 flex gap-2">
                            {item.featured && (
                              <Badge className="bg-amber-400 text-black hover:bg-amber-400">
                                <Star className="mr-1 h-3.5 w-3.5 fill-black text-black" /> Signature
                              </Badge>
                            )}
                            <Badge variant={item.status === 'Rupture imminente' ? 'destructive' : 'outline'} className="bg-black/40 text-white border-white/20 backdrop-blur">
                              {item.status}
                            </Badge>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                            <div>
                              <h4 className="text-lg font-semibold leading-tight">{item.name}</h4>
                              <p className="text-xs text-white/80">{section.title}</p>
                            </div>
                            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                              {item.prep}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Prix</span>
                            <span className="text-2xl font-bold text-primary">{new Intl.NumberFormat('fr-FR').format(item.price)} FCFA</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline">Photo d’illustration</Badge>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Sparkles className="w-4 h-4" /> Modifier
                            </Button>
                          </div>
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
