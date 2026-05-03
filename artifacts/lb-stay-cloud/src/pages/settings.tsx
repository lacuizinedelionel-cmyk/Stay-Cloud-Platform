import { useMemo, useRef, useState } from 'react';
import { Redirect } from 'wouter';
import { CheckCircle2, Building2, Globe, Layers3, Save, ToggleLeft, ToggleRight, Store, Hotel, Soup, Pill, BriefcaseBusiness, BadgeDollarSign, Sparkles, Percent, ReceiptText, ArrowRightLeft, Landmark, Users, ShieldCheck, History, PhoneCall, MessageCircle, MessageCircleMore, MessageSquare, Radio, User, Mail, Phone, LockKeyhole, Upload, Camera, FileText, Languages, MoonStar, SunMedium, BellRing, CalendarCheck2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

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

function ProfileSection() {
  const { profileData, updateProfileData, updateFullName } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [draftName, setDraftName] = useState(profileData.fullName);

  const uploadAvatar = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => updateProfileData({ avatarUrl: String(reader.result ?? '') });
    reader.readAsDataURL(file);
  };

  const initials = profileData.fullName.trim().charAt(0).toUpperCase();

  const saveProfileName = () => {
    updateFullName(draftName.trim() || profileData.fullName);
  };

  return (
    <div className="rounded-2xl p-5 border space-y-5" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Mon Profil</h2>
          <p className="text-sm text-muted-foreground">Vos informations personnelles s'affichent dans toute l'application.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center gradient-gold shrink-0" style={{ background: profileData.avatarUrl ? 'transparent' : 'linear-gradient(135deg,#D97706,#F5A623)' }}>
            {profileData.avatarUrl ? <img src={profileData.avatarUrl} alt={profileData.fullName} className="w-full h-full object-cover" /> : <span className="text-white font-extrabold text-lg">{initials}</span>}
          </div>
          <div className="space-y-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border" style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}>
              <Camera className="w-4 h-4" /> Simuler l'upload photo
            </button>
            {profileData.avatarUrl && <button type="button" onClick={() => updateProfileData({ avatarUrl: '' })} className="block text-xs text-muted-foreground">Supprimer la photo</button>}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nom complet de l'administrateur</span><div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}><User className="w-4 h-4 text-muted-foreground" /><input value={draftName} onChange={e => setDraftName(e.target.value)} className="w-full bg-transparent outline-none" /></div></label>
        <label className="space-y-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</span><div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}><Mail className="w-4 h-4 text-muted-foreground" /><input value={profileData.email} onChange={e => updateProfileData({ email: e.target.value })} className="w-full bg-transparent outline-none" /></div></label>
        <label className="space-y-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Téléphone</span><div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}><Phone className="w-4 h-4 text-muted-foreground" /><input value={profileData.phone} onChange={e => updateProfileData({ phone: e.target.value })} className="w-full bg-transparent outline-none" /></div></label>
        <div className="space-y-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mot de passe</span><button type="button" onClick={() => setPasswordOpen(v => !v)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold border" style={{ background: passwordOpen ? 'hsl(38 90% 56% / 0.12)' : 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}><LockKeyhole className="w-4 h-4" />Changer le mot de passe</button></div>
      </div>

      {passwordOpen && <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><input value={passwords.current} onChange={e => setPasswords(prev => ({ ...prev, current: e.target.value }))} placeholder="Mot de passe actuel" type="password" className="px-3 py-2 rounded-xl outline-none" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }} /><input value={passwords.next} onChange={e => setPasswords(prev => ({ ...prev, next: e.target.value }))} placeholder="Nouveau mot de passe" type="password" className="px-3 py-2 rounded-xl outline-none" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }} /><input value={passwords.confirm} onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))} placeholder="Confirmer" type="password" className="px-3 py-2 rounded-xl outline-none" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }} /></div>}
      <div className="flex justify-end">
        <button type="button" onClick={saveProfileName} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg,#B7791F,#F5A623)', color: '#fff' }}>
          <Save className="w-4 h-4" /> Enregistrer
        </button>
      </div>
    </div>
  );
}

function BrandingSection() {
  const [niu, setNiu] = useState('M0721XXXXXXXXX');
  const [rccm, setRccm] = useState('RC/DLA/2024/B/1234');

  return (
    <div className="rounded-2xl p-5 border space-y-5" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <span className="font-bold">Branding & Légal</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NIU</span><div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}><BadgeDollarSign className="w-4 h-4 text-muted-foreground" /><input value={niu} onChange={e => setNiu(e.target.value)} className="w-full bg-transparent outline-none" /></div></label>
        <label className="space-y-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RCCM</span><div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}><Building2 className="w-4 h-4 text-muted-foreground" /><input value={rccm} onChange={e => setRccm(e.target.value)} className="w-full bg-transparent outline-none" /></div></label>
      </div>
      <p className="text-xs text-muted-foreground">Ces informations apparaissent sur les factures et documents légaux.</p>
    </div>
  );
}

function PreferencesSection() {
  const { preferencesData, updatePreferencesData } = useAuth();
  return (
    <div className="rounded-2xl p-5 border space-y-5" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center gap-2"><Languages className="w-4 h-4" /><span className="font-bold">Préférences</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Langue</span><div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}><Globe className="w-4 h-4 text-muted-foreground" /><select value={preferencesData.language} onChange={e => updatePreferencesData({ language: e.target.value === 'en' ? 'en' : 'fr' })} className="w-full bg-transparent outline-none"><option value="fr">Français</option><option value="en">English</option></select></div></label>
        <div className="space-y-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Thème</span><button type="button" onClick={() => updatePreferencesData({ theme: preferencesData.theme === 'dark' ? 'light' : 'dark' })} className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl font-semibold border" style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}><span className="inline-flex items-center gap-2">{preferencesData.theme === 'dark' ? <MoonStar className="w-4 h-4" /> : <SunMedium className="w-4 h-4" />} {preferencesData.theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}</span><span className="text-xs text-muted-foreground">Basculer</span></button></div>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const { preferencesData, updatePreferencesData } = useAuth();
  return (
    <div className="rounded-2xl p-5 border space-y-5" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center gap-2"><BellRing className="w-4 h-4" /><span className="font-bold">Notifications stock</span></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { key: 'email', label: 'Email' },
          { key: 'sms', label: 'SMS' },
          { key: 'whatsapp', label: 'WhatsApp' },
        ].map(item => (
          <label key={item.key} className="flex items-center gap-3 rounded-xl px-4 py-3 border" style={{ background: 'hsl(var(--muted) / 0.35)', borderColor: 'hsl(var(--border))' }}>
            <input type="checkbox" checked={preferencesData.stockAlerts[item.key as 'email' | 'sms' | 'whatsapp']} onChange={() => updatePreferencesData({ stockAlerts: { [item.key]: !preferencesData.stockAlerts[item.key as 'email' | 'sms' | 'whatsapp'] } as any })} />
            <span className="font-medium">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SubscriptionSection() {
  return (
    <div className="rounded-2xl p-5 border space-y-4" style={{ background: 'linear-gradient(135deg, hsl(222 50% 7%) 0%, hsl(222 50% 4%) 100%)', borderColor: 'hsl(38 90% 56% / 0.25)' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Abonnement</p>
          <h3 className="text-xl font-extrabold text-white">Pack Premium - Actif</h3>
        </div>
        <CalendarCheck2 className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'hsl(var(--muted) / 0.12)' }}>
        <span className="text-sm text-muted-foreground">Prochaine date de paiement</span>
        <span className="text-sm font-bold text-white">12 Juin 2026</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { profileData } = useAuth();
  const [sites, setSites] = useState(initialSites);
  const [selectedSite, setSelectedSite] = useState(initialSites[0].id);
  const [vat, setVat] = useState('19.25');
  const [currency, setCurrency] = useState('XAF');
  const [exchangeRates, setExchangeRates] = useState({ XAF: '1', EUR: '656.00', USD: '610.00' });
  const [invoicePrefix, setInvoicePrefix] = useState('INV-CM-');
  const [legalFooter, setLegalFooter] = useState('RCCM: RC/DLA/2024/B/1234 • NIU: M0721XXXXXXXXX');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [smsGateway, setSmsGateway] = useState('Twilio / CamSMS');
  const [whatsappGateway, setWhatsappGateway] = useState('WhatsApp Business API');
  const [orangeMoneyStatus, setOrangeMoneyStatus] = useState('Connecté');
  const [mtnMoMoStatus, setMtnMoMoStatus] = useState('Connecté');
  const users = [
    { name: 'Aline M.', role: 'Réceptionniste', site: 'Douala', status: 'Actif' },
    { name: 'Mika T.', role: 'Serveur', site: 'Yaoundé', status: 'Actif' },
    { name: 'Jean P.', role: 'Gérant', site: 'Bafoussam', status: 'Actif' },
    { name: 'Sarah N.', role: 'Comptable', site: 'Douala', status: 'Suspendu' },
  ];
  const auditLogs = [
    'Aline M. a annulé la facture #INV-CM-0142',
    'Jean P. a modifié le stock de riz parfumé',
    'Sarah N. a exporté le rapport de caisse',
    'Mika T. a créé une réservation chambre 204',
    'Jean P. a validé une remise exceptionnelle',
    'Aline M. a mis à jour le profil client',
    'Sarah N. a clôturé la journée comptable',
    'Jean P. a ajusté le taux EUR/XAF',
    'Mika T. a imprimé un ticket POS',
    'Aline M. a réactivé un compte employé',
  ];
  const communicationsCards = [
    { title: 'Passerelle SMS', icon: MessageSquare, subtitle: 'Alertes stock, notifications opérationnelles, codes courts.', value: smsGateway, accent: 'hsl(38 90% 56%)' },
    { title: 'Passerelle WhatsApp', icon: MessageCircleMore, subtitle: 'Factures, relances et messages clients premium.', value: whatsappGateway, accent: '#F59E0B' },
    { title: 'Orange Money', icon: Radio, subtitle: 'Statut de connexion API paiement.', value: orangeMoneyStatus, accent: '#FB923C' },
    { title: 'MTN MoMo', icon: Radio, subtitle: 'Statut de connexion API paiement.', value: mtnMoMoStatus, accent: '#FACC15' },
  ];

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

  if (false) return <Redirect to="/login" />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em]" style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}>
            <Globe className="w-3.5 h-3.5" />
            Command Center
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold" style={{ letterSpacing: '-0.03em' }}>Gestion Multi-Enseignes</h1>
          <p className="text-muted-foreground max-w-2xl">Activez les modules par établissement et finalisez votre profil pro.</p>
        </div>
        <button onClick={save} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #D97706, #F5A623)', color: '#000' }}>
          <Save className="w-4 h-4" /> Enregistrer la configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Établissements" value={`${sites.length}`} />
        <StatCard title="Modules actifs" value={`${sites.reduce((sum, s) => sum + Object.values(s.modules).filter(Boolean).length, 0)}`} />
        <StatCard title="Profil" value={profileData.fullName} />
      </div>

      <ProfileSection />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BrandingSection />
        <PreferencesSection />
      </div>
      <NotificationsSection />
      <SubscriptionSection />

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
        </div>
      </div>
    </div>
  );
}
