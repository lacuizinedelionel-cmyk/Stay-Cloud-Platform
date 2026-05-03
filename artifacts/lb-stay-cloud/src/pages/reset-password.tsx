import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, LockKeyhole, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const valid = password.length >= 8 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setIsLoading(false);
    toast({ title: 'Succès', description: 'Votre mot de passe a été réinitialisé.' });
    setStep('success');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'hsl(var(--background))' }}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-2/5 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, hsl(222 50% 7%) 0%, hsl(222 50% 4%) 100%)', borderRight: '1px solid hsl(var(--border))' }}
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(38 90% 56%), transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-extrabold text-lg" style={{ letterSpacing: '-0.02em' }}>LB Stay Cloud</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
            Réinitialisez votre<br />
            <span className="text-gradient-gold">mot de passe en sécurité.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Le même parcours fonctionne pour Hôtel, Restaurant, Pharmacie et toutes les enseignes.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Secteurs compatibles', value: 'Tous' },
            { label: 'Protection', value: 'E2E' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
              <p className="text-2xl font-extrabold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-base text-foreground" style={{ letterSpacing: '-0.02em' }}>LB Stay Cloud</span>
          </div>

          {step === 'success' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'hsl(160 84% 39% / 0.12)' }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: '#10B981' }} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
                  Mot de passe mis à jour !
                </h2>
                <p className="text-sm text-muted-foreground">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              </div>
              <button onClick={() => setLocation('/login')} className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ background: 'hsl(38 90% 56%)', color: '#000' }}>
                Retour à la connexion <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8 hover:text-foreground transition-colors w-fit">
                <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
              </Link>

              <h1 className="text-3xl font-extrabold text-foreground mb-1" style={{ letterSpacing: '-0.03em' }}>Réinitialiser le mot de passe</h1>
              <p className="text-muted-foreground text-sm mb-8">Entrez votre nouveau mot de passe après réception du code sécurisé.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nouveau mot de passe</label>
                  <div className="flex items-center gap-2 px-3 h-11 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <LockKeyhole className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 caractères" className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmer le mot de passe</label>
                  <div className="flex items-center gap-2 px-3 h-11 rounded-xl" style={{ background: 'hsl(var(--card))', border: `1px solid ${confirm && confirm !== password ? '#EF4444' : 'hsl(var(--border))'}` }}>
                    <LockKeyhole className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répétez votre mot de passe" className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  {confirm && confirm !== password && <p className="text-[11px]" style={{ color: '#EF4444' }}>Les mots de passe ne correspondent pas</p>}
                </div>

                <Button type="submit" className="w-full h-11 gradient-gold text-white font-semibold text-sm hover:opacity-90 transition-opacity" disabled={!valid || isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Réinitialisation…</> : 'Réinitialiser le mot de passe'}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
