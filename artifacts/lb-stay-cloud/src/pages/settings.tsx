import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, MessageSquare, CreditCard, ImagePlus, X,
  CheckCircle2, Upload, Globe, Loader2, Phone, Switch as SwitchIcon,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

/* ── helpers ── */
function SectionHeading({ icon: Icon, title, subtitle, color = '#F5A623' }: {
  icon: React.ElementType; title: string; subtitle: string; color?: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
        {title}
      </h3>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{subtitle}</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 space-y-4"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled }: {
  value?: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg text-sm text-foreground outline-none transition-all disabled:opacity-50"
      style={{
        background: 'hsl(var(--muted))',
        border: '1px solid hsl(var(--border))',
      }}
      onFocus={e  => { (e.target as HTMLInputElement).style.borderColor = 'hsl(38 90% 56% / 0.6)'; }}
      onBlur={e   => { (e.target as HTMLInputElement).style.borderColor = 'hsl(var(--border))'; }}
    />
  );
}

/* ══════════════════════════════════════
   Section Logo Upload
══════════════════════════════════════ */
function LogoUploadSection({ businessId }: { businessId: number }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [isDragging, setDrag]   = useState(false);

  /* Charger le logo actuel */
  const { data: billingSettings } = useQuery({
    queryKey: ['billing-settings', businessId],
    queryFn: async () => {
      const res = await fetch(`/api/billing/settings?businessId=${businessId}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ logoUrl?: string | null }>;
    },
    enabled: !!businessId,
  });

  const currentLogo = preview ?? billingSettings?.logoUrl ?? null;

  /* Sauvegarder le logo */
  const { mutate: saveLogo, isPending: saving } = useMutation({
    mutationFn: async (logoUrl: string | null) => {
      const res = await fetch('/api/billing/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, logoUrl }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-settings', businessId] });
      toast({ title: '✅ ' + t.settings.savedOk });
    },
    onError: () => toast({ title: t.common.error, variant: 'destructive' }),
  });

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Fichier invalide', description: 'PNG, JPG ou SVG uniquement', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Fichier trop lourd', description: 'Maximum 2 Mo', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const removeLogo = () => {
    setPreview(null);
    saveLogo(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Card>
      <FormField label={t.settings.logo}>
        <p className="text-[11px] text-muted-foreground -mt-1">{t.settings.logoSubtitle}</p>
      </FormField>

      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Preview */}
        <div className="relative shrink-0">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden transition-all"
            style={{
              background: currentLogo ? 'white' : 'hsl(var(--muted))',
              border: `2px dashed ${currentLogo ? 'hsl(38 90% 56% / 0.4)' : 'hsl(var(--border))'}`,
            }}
          >
            {currentLogo ? (
              <img src={currentLogo} alt="Logo" className="w-full h-full object-contain p-1.5" />
            ) : (
              <ImagePlus className="w-8 h-8 text-muted-foreground/40" strokeWidth={1} />
            )}
          </div>
          {currentLogo && (
            <button
              onClick={removeLogo}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all"
              style={{ background: '#EF4444', border: '2px solid hsl(var(--background))' }}
              title={t.settings.removeLogo}
            >
              <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Drop zone + boutons */}
        <div className="flex-1 space-y-3">
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl flex flex-col items-center justify-center gap-2 p-5 cursor-pointer transition-all"
            style={{
              border: `2px dashed ${isDragging ? 'hsl(38 90% 56%)' : 'hsl(var(--border))'}`,
              background: isDragging ? 'hsl(38 90% 56% / 0.06)' : 'hsl(var(--muted) / 0.4)',
            }}
          >
            <Upload className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-xs font-semibold text-foreground">
              {t.settings.uploadLogo}
            </p>
            <p className="text-[10px] text-muted-foreground text-center">{t.settings.logoTip}</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {preview && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              disabled={saving}
              onClick={() => saveLogo(preview)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.actions.saving}</>
                : <><CheckCircle2 className="w-4 h-4" /> {t.actions.save}</>
              }
            </motion.button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════
   PAGE PARAMÈTRES
══════════════════════════════════════ */
export default function SettingsPage() {
  const { user, business } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { toast } = useToast();

  const [name, setName]     = useState(business?.name ?? '');
  const [city, setCity]     = useState((business as any)?.city ?? '');
  const [phone, setPhone]   = useState((business as any)?.phone ?? '');
  const [address, setAddr]  = useState((business as any)?.address ?? '');

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
          {t.settings.title}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{t.settings.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Profil de l'enseigne ── */}
        <SectionHeading
          icon={Building2}
          title={t.settings.businessName}
          subtitle={lang === 'fr'
            ? 'Informations affichées sur vos reçus et factures.'
            : 'Information displayed on your receipts and invoices.'}
        />
        <div className="md:col-span-2 space-y-4">
          <Card>
            <FormField label={t.settings.businessName}>
              <TextInput value={name} onChange={setName} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t.settings.city}>
                <TextInput value={city} onChange={setCity} />
              </FormField>
              <FormField label={t.settings.phone}>
                <TextInput value={phone} onChange={setPhone} placeholder="+237 6XX XXX XXX" />
              </FormField>
            </div>
            <FormField label={lang === 'fr' ? 'Adresse complète' : 'Full address'}>
              <TextInput value={address} onChange={setAddr} />
            </FormField>
            <button
              onClick={() => toast({ title: '✅ ' + t.settings.savedOk })}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
            >
              {t.actions.save}
            </button>
          </Card>
        </div>

        {/* ── Logo ── */}
        <SectionHeading
          icon={ImagePlus}
          title={t.settings.logo}
          subtitle={t.settings.logoSubtitle}
        />
        <div className="md:col-span-2">
          {business?.id
            ? <LogoUploadSection businessId={business.id} />
            : <div className="h-20 rounded-xl flex items-center justify-center text-xs text-muted-foreground"
                style={{ background: 'hsl(var(--muted))', border: '1px dashed hsl(var(--border))' }}>
                {lang === 'fr' ? 'Enseigne non associée' : 'No business linked'}
              </div>
          }
        </div>

        {/* ── Langue ── */}
        <SectionHeading
          icon={Globe}
          title={t.settings.language}
          subtitle={lang === 'fr'
            ? 'Choisissez la langue de l\'interface utilisateur.'
            : 'Choose the interface language.'}
          color="#60A5FA"
        />
        <div className="md:col-span-2">
          <Card>
            <div className="flex gap-3">
              {(['fr', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="flex items-center gap-2.5 flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: lang === l ? 'hsl(38 90% 56% / 0.15)' : 'hsl(var(--muted))',
                    color: lang === l ? 'hsl(38 90% 56%)' : 'hsl(var(--muted-foreground))',
                    border: lang === l ? '1px solid hsl(38 90% 56% / 0.35)' : '1px solid transparent',
                  }}
                >
                  <span className="text-lg">{l === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                  <div className="text-left">
                    <p className="text-sm font-bold">{l === 'fr' ? 'Français' : 'English'}</p>
                    <p className="text-[10px] opacity-70">{l === 'fr' ? 'Interface en français' : 'English interface'}</p>
                  </div>
                  {lang === l && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* ── WhatsApp ── */}
        <SectionHeading
          icon={MessageSquare}
          title="WhatsApp Business"
          subtitle={lang === 'fr'
            ? 'Envoi de reçus et notifications par WhatsApp.'
            : 'Send receipts and notifications via WhatsApp.'}
          color="#10B981"
        />
        <div className="md:col-span-2">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {lang === 'fr' ? 'Activer WhatsApp Business' : 'Enable WhatsApp Business'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === 'fr' ? 'Messages automatiques aux clients' : 'Automatic messages to clients'}
                </p>
              </div>
              <Switch disabled />
            </div>
            <FormField label={lang === 'fr' ? 'Numéro WhatsApp Business' : 'WhatsApp Business number'}>
              <TextInput placeholder="+237 6XX XXX XXX" disabled />
            </FormField>
            <button
              disabled
              className="px-4 py-2 rounded-lg text-xs font-semibold opacity-50 cursor-not-allowed"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
            >
              {lang === 'fr' ? 'Connecter le compte' : 'Connect account'}
            </button>
          </Card>
        </div>

        {/* ── Mobile Money ── */}
        <SectionHeading
          icon={CreditCard}
          title="Mobile Money"
          subtitle={lang === 'fr'
            ? 'Configuration des paiements MTN et Orange.'
            : 'MTN and Orange payment configuration.'}
          color="#F5A623"
        />
        <div className="md:col-span-2">
          <Card>
            {[
              { label: 'MTN Mobile Money', sub: lang === 'fr' ? 'Non configuré' : 'Not configured', bg: '#FFCC00', text: '#000', abbr: 'MTN' },
              { label: 'Orange Money',     sub: lang === 'fr' ? 'Non configuré' : 'Not configured', bg: '#FF6600', text: '#fff', abbr: 'OM'  },
            ].map((mm, i) => (
              <div key={mm.label}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: i === 0 ? '1px solid hsl(var(--border))' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ background: mm.bg, color: mm.text }}>
                    {mm.abbr}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{mm.label}</p>
                    <p className="text-[10px] text-muted-foreground">{mm.sub}</p>
                  </div>
                </div>
                <button
                  disabled
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold opacity-50 cursor-not-allowed"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
                >
                  {lang === 'fr' ? 'Configurer' : 'Configure'}
                </button>
              </div>
            ))}
          </Card>
        </div>

      </div>
    </div>
  );
}
