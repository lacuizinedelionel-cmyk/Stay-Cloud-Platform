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
import { Zap, ArrowRight, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@lbstay.com', color: 'text-primary' },
  { label: 'Restaurant', email: 'restaurant@lbstay.com', color: 'text-blue-400' },
  { label: 'Hôtel', email: 'hotel@lbstay.com', color: 'text-blue-400' },
  { label: 'Beauté', email: 'beauty@lbstay.com', color: 'text-blue-400' },
  { label: 'Épicerie', email: 'grocery@lbstay.com', color: 'text-blue-400' },
  { label: 'Pharmacie', email: 'pharmacy@lbstay.com', color: 'text-blue-400' },
  { label: 'Fitness', email: 'fitness@lbstay.com', color: 'text-blue-400' },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const fillDemo = (email: string) => {
    form.setValue('email', email);
    form.setValue('password', 'password');
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
                      <Link
                        href="/activate"
                        className="text-xs font-medium transition-colors"
                        style={{ color: 'hsl(38 90% 56%)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                      >
                        Mot de passe oublié ?
                      </Link>
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

          {/* Demo accounts */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Comptes de démonstration
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc.email)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--accent))')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                >
                  {acc.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Mot de passe universel : <code className="text-primary font-mono">password</code>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
