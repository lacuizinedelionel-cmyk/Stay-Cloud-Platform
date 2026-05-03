import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useLogin, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { loginSchema, type LoginFormData } from '@/lib/schemas';
import { Zap, ArrowRight, Loader2, ShieldCheck, Smartphone, LockKeyhole, Mail, MessageCircle, Phone } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'credentials' | 'otp' | 'recovery'>('credentials');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPhone, setPendingPhone] = useState('+237 6XX XXX XXX');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState<'Email' | 'SMS' | 'WhatsApp'>('Email');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryTarget, setRecoveryTarget] = useState('');

  useEffect(() => {
    if (user) {
      setLocation(user.role === 'SUPER_ADMIN' ? '/superadmin' : '/dashboard');
    }
  }, [user, setLocation]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useLogin();

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: 'Connexion réussie',
          description: 'Bienvenue sur LB Stay Cloud.',
        });
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Identifiants incorrects',
          description: 'Vérifiez votre email et mot de passe.',
        });
      },
    });
  };

  const handleVerifyOtp = () => {
    setOtpLoading(true);
    setTimeout(() => {
      if (otp === '123456') {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: 'Connexion validée',
          description: 'Double authentification réussie.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Code incorrect',
          description: 'Utilisez le code démo 123456.',
        });
      }
      setOtpLoading(false);
    }, 600);
  };

  const handleRecovery = () => {
    setRecoveryLoading(true);
    setTimeout(() => {
      toast({
        title: 'Succès',
        description: `Un lien/code sécurisé vous a été envoyé via ${recoveryMode}`,
      });
      setRecoveryLoading(false);
      setLocation('/reset-password');
    }, 700);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* Left panel — branding */}
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
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(38 90% 56%), transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              LB Stay Cloud
            </span>
          </div>

          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
            Gérez votre business<br />
            <span className="text-gradient-gold">en toute simplicité.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            La plateforme SaaS multi-secteur conçue pour les entreprises africaines. Restaurant, Hôtel, Beauté, Pharmacie et plus.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Secteurs couverts', value: '8' },
            { label: 'Villes au Cameroun', value: '3+' },
            { label: 'Modules intégrés', value: '25+' },
            { label: 'Disponibilité', value: '99.9%' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
              <p className="text-2xl font-extrabold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right panel — form */}
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
            <span className="font-extrabold text-base text-white" style={{ letterSpacing: '-0.02em' }}>LB Stay Cloud</span>
          </div>

          {step === 'credentials' && (
            <>
              <h1 className="text-3xl font-extrabold text-foreground mb-1" style={{ letterSpacing: '-0.03em' }}>
                Connexion
              </h1>
              <p className="text-muted-foreground text-sm mb-8">Accédez à votre tableau de bord.</p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email professionnel
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin@lbstay.com"
                        {...field}
                        className="h-11 bg-card border-border/70 text-foreground placeholder:text-muted-foreground focus:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Mot de passe
                      </FormLabel>
                      <button
                        type="button"
                        className="text-xs font-medium transition-colors"
                        style={{ color: 'hsl(38 90% 56%)' }}
                        onClick={() => setStep('recovery')}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="h-11 bg-card border-border/70 text-foreground placeholder:text-muted-foreground focus:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 gradient-gold text-white font-semibold text-sm mt-2 hover:opacity-90 transition-opacity"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Connexion en cours…</>
                ) : (
                  <>Se connecter <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>

              {/* Liens inscription / activation */}
              <div className="flex flex-col gap-2 mt-3">
                <Link
                  href="/activate"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'hsl(38 90% 56% / 0.08)',
                    border: '1px solid hsl(38 90% 56% / 0.2)',
                    color: 'hsl(38 90% 56%)',
                  }}
                >
                  🔑 Première connexion ? Activer votre compte
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'transparent',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(38 90% 56%)',
                  }}
                >
                  ✨ Pas encore de compte ? Créer un compte
                </Link>
              </div>
                </form>
              </Form>
            </>
          )}

          {step === 'otp' && (
            <div className="space-y-5 font-sans">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  <LockKeyhole className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="pt-0.5">
                  <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                    Sécurité renforcée
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">Entrez le code reçu par SMS au {pendingPhone}.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card/80 flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{pendingEmail}</p>
                  <p className="text-xs text-muted-foreground">Code démo : 123456</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Code à 6 chiffres
                </label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="h-11 bg-card border-border/70 text-foreground placeholder:text-muted-foreground focus:border-primary tracking-[0.35em] text-center text-lg"
                />
              </div>

              <Button
                type="button"
                className="w-full h-11 gradient-gold text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                disabled={otpLoading || otp.length !== 6}
                onClick={handleVerifyOtp}
              >
                {otpLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Vérification…</> : 'Accéder au Dashboard'}
              </Button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Modifier mes identifiants
              </button>

              <p className="pt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
                LB Stay utilise un cryptage de bout en bout pour protéger vos données bancaires
              </p>
            </div>
          )}

          {step === 'recovery' && (
            <div className="space-y-5 font-sans">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  <LockKeyhole className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="pt-0.5">
                  <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                    Récupération sécurisée
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">Entrez votre email ou numéro de téléphone.</p>
                </div>
              </div>

                <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email ou téléphone
                </label>
                <Input
                  value={recoveryTarget}
                  onChange={e => setRecoveryTarget(e.target.value)}
                  placeholder="admin@lbstay.com ou +237..."
                  className="h-11 bg-card border-border/70 text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mode de réception
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Email', 'SMS', 'WhatsApp'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setRecoveryMode(mode)}
                      className="h-11 rounded-xl text-xs font-semibold transition-all border"
                      style={{
                        background: recoveryMode === mode ? 'hsl(38 90% 56% / 0.12)' : 'hsl(var(--card))',
                        borderColor: recoveryMode === mode ? 'hsl(38 90% 56% / 0.35)' : 'hsl(var(--border))',
                        color: recoveryMode === mode ? 'hsl(38 90% 56%)' : 'hsl(var(--foreground))',
                      }}
                      >
                      <span className="inline-flex items-center gap-1.5">
                        {mode === 'Email' ? <Mail className="w-3.5 h-3.5" /> : mode === 'SMS' ? <Phone className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
                        {mode}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                className="w-full h-11 gradient-gold text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                disabled={recoveryLoading || !recoveryTarget}
                onClick={handleRecovery}
              >
                {recoveryLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Envoi…</> : 'Envoyer le code sécurisé'}
              </Button>

              <button
                type="button"
                onClick={() => setLocation('/reset-password')}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Aller à la réinitialisation
              </button>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                LB Stay ne vous demandera jamais votre mot de passe par message
              </p>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
