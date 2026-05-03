import { useMemo, useState } from 'react';
import { CheckCircle2, Building2, Globe, Layers3, Save, ToggleLeft, ToggleRight, Store, Hotel, Soup, Pill, BriefcaseBusiness, BadgeDollarSign, Sparkles, Percent, ReceiptText, ArrowRightLeft, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ModuleKey = 'hotel' | 'resto' | 'pharmacie' | 'beauty' | 'grocery' | 'garage';

type SiteConfig = {
  id: string;
  city: string;
  name: string;
  commercialName: string;
  modules: Record<ModuleKey, boolean>;
};

const moduleMeta: Record<ModuleKey, { label: string; icon: React.ElementType }> = {
  hotel: { label: 'Hôtel', icon: Hotel },
  resto: { label: 'Resto', icon: Soup },
  pharmacie: { label: 'Pharmacie', icon: Pill },
  beauty: { label: 'Beauté', icon: Sparkles },
  grocery: { label: 'Épicerie', icon: Store },
  garage: { label: 'Garage', icon: BriefcaseBusiness },
};

const initialSites: SiteConfig[] = [
  {
    id: 'site-douala',
    city: 'Douala',
    name: 'LB Stay - Akwa',
    commercialName: 'LB Stay Akwa Premium',
    modules: { hotel: true, resto: true, pharmacie: false, beauty: false, grocery: true, garage: false },
  },
  {
    id: 'site-yaounde',
    city: 'Yaoundé',
    name: 'LB Stay - Bastos',
    commercialName: 'LB Stay Bastos Business',
    modules: { hotel: true, resto: false, pharmacie: true, beauty: true, grocery: false, garage: false },
  },
  {
    id: 'site-bafoussam',
    city: 'Bafoussam',
    name: 'LB Stay - Marché C',
    commercialName: 'LB Stay Marché C Select',
    modules: { hotel: false, resto: true, pharmacie: true, beauty: false, grocery: true, garage: true },
  },
];

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">{title}</p>
      <p className="text-2xl font-extrabold mt-2" style={{ color: 'hsl(38 90% 56%)' }}>{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [sites, setSites] = useState(initialSites);
  const [selectedSite, setSelectedSite] = useState(initialSites[0].id);
  const [vat, setVat] = useState('19.25');
  const [currency, setCurrency] = useState('XAF');
  const [exchangeRates, setExchangeRates] = useState({ XAF: '1', EUR: '656.00', USD: '610.00' });
  const [invoicePrefix, setInvoicePrefix] = useState('INV-CM-');
  const [legalFooter, setLegalFooter] = useState('RCCM: RC/DLA/2024/B/1234 • NIU: M0721XXXXXXXXX');

  const current = useMemo(() => sites.find(s => s.id === selectedSite) ?? sites[0], [selectedSite, sites]);
  const activeModules = useMemo(() => Object.values(current.modules).filter(Boolean).length, [current.modules]);

  const updateSite = (siteId: string, patch: Partial<SiteConfig>) => {
    setSites(prev => prev.map(site => site.id === siteId ? { ...site, ...patch } : site));
  };

  const toggleModule = (siteId: string, module: ModuleKey) => {
    setSites(prev => prev.map(site => {
      if (site.id !== siteId) return site;
      return { ...site, modules: { ...site.modules, [module]: !site.modules[module] } };
    }));
  };

  const save = () => toast({ title: 'Configuration enregistrée', description: 'La configuration multi-site a été mise à jour.' });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em]" style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}>
            <Globe className="w-3.5 h-3.5" />
            Dashboard de configuration multi-site
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold" style={{ letterSpacing: '-0.03em' }}>Gestion Multi-Enseignes</h1>
          <p className="text-muted-foreground max-w-2xl">Activez les modules par établissement et personnalisez le nom commercial de chaque site.</p>
        </div>
        <button onClick={save} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #D97706, #F5A623)', color: '#000' }}>
          <Save className="w-4 h-4" /> Enregistrer la configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Établissements" value={`${sites.length}`} />
        <StatCard title="Modules actifs" value={`${sites.reduce((sum, s) => sum + Object.values(s.modules).filter(Boolean).length, 0)}`} />
        <StatCard title="Site sélectionné" value={current.city} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-2 mb-4"><Building2 className="w-4 h-4" /><span className="font-bold">Sites</span></div>
            <div className="space-y-3">
              {sites.map(site => (
                <button key={site.id} onClick={() => setSelectedSite(site.id)} className="w-full text-left rounded-xl p-4 border transition-all" style={{
                  background: selectedSite === site.id ? 'hsl(38 90% 56% / 0.10)' : 'transparent',
                  borderColor: selectedSite === site.id ? 'hsl(38 90% 56% / 0.35)' : 'hsl(var(--border))',
                }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{site.name}</p>
                      <p className="text-xs text-muted-foreground">{site.city}</p>
                    </div>
                    <BadgeDollarSign className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-2 mb-4">
              <Layers3 className="w-4 h-4" />
              <span className="font-bold">Nom commercial</span>
            </div>
            <input
              value={current.commercialName}
              onChange={(e) => updateSite(current.id, { commercialName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
              placeholder="Nom commercial du site"
            />
          </div>

          <div className="rounded-2xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-2 mb-4">
              <ToggleRight className="w-4 h-4" />
              <span className="font-bold">Modules par établissement</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-3 pr-4">Établissement</th>
                    <th className="py-3 px-4">Nom commercial</th>
                    <th className="py-3 px-4">Modules activés / désactivés</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map(site => (
                    <tr key={site.id} className="border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(38 90% 56% / 0.12)' }}>
                            <Building2 className="w-4 h-4" style={{ color: 'hsl(38 90% 56%)' }} />
                          </div>
                          <div>
                            <p className="font-semibold">{site.name}</p>
                            <p className="text-xs text-muted-foreground">{site.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <input
                          value={site.commercialName}
                          onChange={(e) => updateSite(site.id, { commercialName: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(moduleMeta) as ModuleKey[]).map(module => {
                            const meta = moduleMeta[module];
                            const enabled = site.modules[module];
                            const Icon = meta.icon;
                            return (
                              <button key={module} type="button" onClick={() => toggleModule(site.id, module)} className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border" style={{
                                background: enabled ? 'hsl(38 90% 56% / 0.12)' : 'transparent',
                                borderColor: enabled ? 'hsl(38 90% 56% / 0.35)' : 'hsl(var(--border))',
                                color: enabled ? 'hsl(38 90% 56%)' : 'hsl(var(--foreground))',
                              }}>
                                <Icon className="w-3.5 h-3.5" />
                                {meta.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {Object.values(site.modules).filter(Boolean).length > 0 ? (
                          <div className="inline-flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4" style={{ color: 'hsl(38 90% 56%)' }} />
                            {Object.values(site.modules).filter(Boolean).length} modules actifs
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <ToggleLeft className="w-4 h-4" /> Aucun module actif
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-sm text-muted-foreground">LB Stay Cloud garde une base commune, mais chaque enseigne peut activer ses modules et son nom commercial indépendamment.</p>
          </div>

          <div className="rounded-2xl p-5 border space-y-5" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              <span className="font-bold">Finances & Fiscalité</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TVA Cameroun</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  <input value={vat} onChange={e => setVat(e.target.value)} className="w-full bg-transparent outline-none text-sm" />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Devise principale</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-transparent outline-none text-sm">
                    <option value="XAF">XAF</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Préfixe factures</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                  <ReceiptText className="w-4 h-4 text-muted-foreground" />
                  <input value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} className="w-full bg-transparent outline-none text-sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['XAF', 'EUR', 'USD'] as const).map(code => (
                <div key={code} className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Taux {code}</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                    <span className="text-sm font-bold w-8">{code}</span>
                    <input
                      value={exchangeRates[code]}
                      onChange={e => setExchangeRates(prev => ({ ...prev, [code]: e.target.value }))}
                      className="w-full bg-transparent outline-none text-sm text-right"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pied de page légal</label>
              <textarea
                value={legalFooter}
                onChange={e => setLegalFooter(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}