import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Zap, Mail, KeyRound, Lock, ArrowRight, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export default function ActivatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');

  const valid = email.includes('@') && code.length >= 6 && password.length >= 8 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsLoading(false);
    setStep('success');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'hsl(var(--background))' }}>
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-2/5 p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(222 50% 7%) 0%, hsl(222 50% 4%) 100%)',
          borderRight: '1px solid hsl(var(--border))',
        }}
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(38 90% 56%), transparent 70%)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-extrabold text-lg" style={{ letterSpacing: '-0.02em' }}>LB Stay Cloud</span>
          </div>

          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
            Bienvenue dans<br />
            <span className="text-gradient-gold">votre espace pro.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Votre code d'activation vous a été communiqué par notre équipe lors de la souscription à votre offre.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { step: '1', text: "Saisissez l'email enregistré lors de votre souscription" },
              { step: '2', text: 'Entrez le code d\'activation reçu par email ou SMS' },
              { step: '3', text: 'Définissez votre mot de passe sécurisé' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: 'hsl(38 90% 56% / 0.2)', color: 'hsl(38 90% 56%)' }}>
                  {s.step}
                </div>
                <p className="text-sm text-muted-foreground pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Activation rapide', value: '< 2 min' },
            { label: 'Support disponible', value: '24h/7j' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
              <p className="text-2xl font-extrabold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-base text-foreground" style={{ letterSpacing: '-0.02em' }}>LB Stay Cloud</span>
          </div>

          {step === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'hsl(160 84% 39% / 0.12)' }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: '#10B981' }} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
                  Compte activé !
                </h2>
                <p className="text-sm text-muted-foreground">
                  Votre compte est prêt. Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.
                </p>
              </div>
              <button
                onClick={() => setLocation('/login')}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
              >
                Accéder à la connexion <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8 hover:text-foreground transition-colors w-fit">
                <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
              </Link>

              <h1 className="text-3xl font-extrabold text-foreground mb-1" style={{ letterSpacing: '-0.03em' }}>
                Activer votre compte
              </h1>
              <p className="text-muted-foreground text-sm mb-8">
                Première connexion ? Saisissez vos informations pour définir votre mot de passe.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email professionnel
                  </label>
                  <div className="flex items-center gap-2 px-3 h-11 rounded-xl"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                </div>

                {/* Code d'activation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Code d'activation
                  </label>
                  <div className="flex items-center gap-2 px-3 h-11 rounded-xl"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <input
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      placeholder="Ex : LB-XXXX-XXXX"
                      maxLength={12}
                      required
                      className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono tracking-widest"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Code reçu par email lors de la souscription</p>
                </div>

                {/* Nouveau mot de passe */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Nouveau mot de passe
                  </label>
                  <div className="flex items-center gap-2 px-3 h-11 rounded-xl"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      required
                      className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                  {/* Barre force */}
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all"
                          style={{
                            background: password.length >= i * 3
                              ? i <= 1 ? '#EF4444' : i <= 2 ? '#F59E0B' : i <= 3 ? '#3B82F6' : '#10B981'
                              : 'hsl(var(--muted))'
                          }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirmer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirmer le mot de passe
                  </label>
                  <div className="flex items-center gap-2 px-3 h-11 rounded-xl"
                    style={{
                      background: 'hsl(var(--card))',
                      border: `1px solid ${confirm && confirm !== password ? '#EF4444' : 'hsl(var(--border))'}`,
                    }}>
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Répétez votre mot de passe"
                      required
                      className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    {confirm && confirm === password && (
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#10B981' }} />
                    )}
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-[11px]" style={{ color: '#EF4444' }}>Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!valid || isLoading}
                  className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, hsl(38 90% 56%), hsl(38 90% 46%))', color: '#000' }}
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Activation…</>
                    : <>Activer mon compte <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Pas encore inscrit ?{' '}
                <Link href="/signup" className="font-semibold transition-colors" style={{ color: 'hsl(38 90% 56%)' }}>
                  Créer un compte
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
