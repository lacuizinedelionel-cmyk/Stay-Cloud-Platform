import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2, MessageSquare, CreditCard, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { business } = useAuth();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gérez la configuration de votre enseigne</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Profil de l'entreprise
          </h3>
          <p className="text-sm text-muted-foreground">Informations générales affichées sur vos reçus et communications.</p>
        </div>
        <Card className="md:col-span-2 border-border/50 bg-card">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'enseigne</Label>
              <Input defaultValue={business?.name || ''} className="bg-background/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input defaultValue={business?.city || ''} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input defaultValue={business?.phone || ''} className="bg-background/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse complète</Label>
              <Input defaultValue={business?.address || ''} className="bg-background/50" />
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Sauvegarder</Button>
          </CardContent>
        </Card>

        <div className="md:col-span-1 space-y-2 mt-4">
          <h3 className="font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-500" /> WhatsApp Business
          </h3>
          <p className="text-sm text-muted-foreground">Configurez l'envoi de reçus et notifications par WhatsApp.</p>
        </div>
        <Card className="md:col-span-2 border-border/50 bg-card mt-4">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Activer l'intégration WhatsApp</Label>
                <p className="text-sm text-muted-foreground">Permet d'envoyer des messages automatiques aux clients.</p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label>Numéro WhatsApp Business</Label>
              <Input placeholder="+237 6XX XXX XXX" className="bg-background/50" disabled />
            </div>
            <Button variant="outline">Connecter le compte</Button>
          </CardContent>
        </Card>

        <div className="md:col-span-1 space-y-2 mt-4">
          <h3 className="font-medium flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#F5A623]" /> Mobile Money
          </h3>
          <p className="text-sm text-muted-foreground">Configuration des paiements MTN et Orange.</p>
        </div>
        <Card className="md:col-span-2 border-border/50 bg-card mt-4">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#FFCC00] flex items-center justify-center font-bold text-black text-xs">MTN</div>
                <div>
                  <Label className="font-medium">MTN Mobile Money</Label>
                  <p className="text-sm text-muted-foreground">Non configuré</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Configurer</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#FF6600] flex items-center justify-center font-bold text-white text-xs">OM</div>
                <div>
                  <Label className="font-medium">Orange Money</Label>
                  <p className="text-sm text-muted-foreground">Non configuré</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Configurer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
