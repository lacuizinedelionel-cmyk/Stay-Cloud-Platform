import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogin, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { loginSchema, type LoginFormData } from '@/lib/schemas';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        setLocation('/superadmin');
      } else if (user.businessId) {
        // We'd ideally route to specific business type based on context, 
        // for now just go to general dashboard which will redirect
        setLocation('/dashboard');
      }
    }
  }, [user, setLocation]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useLogin();

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: 'Connexion réussie',
          description: 'Bienvenue sur LB Stay Cloud',
        });
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Email ou mot de passe incorrect',
        });
      }
    });
  };

  const fillDemo = (email: string) => {
    form.setValue('email', email);
    form.setValue('password', 'password');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2 tracking-tight flex items-center justify-center gap-2">
            LB Stay Cloud
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground">Premium Management Platform</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>Accédez à votre tableau de bord</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email professionnel</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@lbstay.com" {...field} className="bg-background/50" />
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
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </Form>

            <div className="mt-8 pt-6 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4 text-center font-medium">Comptes de démonstration</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button variant="outline" size="sm" onClick={() => fillDemo('superadmin@lbstay.com')} className="justify-start">
                  Super Admin
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillDemo('restaurant@lbstay.com')} className="justify-start">
                  Restaurant
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillDemo('hotel@lbstay.com')} className="justify-start">
                  Hôtel
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillDemo('beauty@lbstay.com')} className="justify-start">
                  Salon de Beauté
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
