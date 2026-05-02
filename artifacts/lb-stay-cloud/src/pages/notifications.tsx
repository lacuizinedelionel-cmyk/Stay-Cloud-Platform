import { useAuth } from '@/context/AuthContext';
import { 
  useListNotifications,
  getListNotificationsQueryKey,
  useMarkNotificationRead
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Info, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: notifications, isLoading } = useListNotifications(
    { userId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListNotificationsQueryKey({ userId: user?.id }) } }
  );

  const markAsRead = useMarkNotificationRead();

  const handleMarkAsRead = (id: number) => {
    markAsRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ userId: user?.id }) });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'INFO': return <Info className="w-5 h-5 text-blue-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'ORDER': return <Package className="w-5 h-5 text-primary" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Restez informé de l'activité de votre entreprise</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <Card key={notif.id} className={`border-border/50 transition-colors ${!notif.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
              <CardContent className="p-4 flex gap-4">
                <div className="mt-1 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-2 opacity-60">
                    {new Date(notif.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                {!notif.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)} disabled={markAsRead.isPending}>
                    Marquer comme lu
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <p>Vous n'avez aucune notification</p>
          </div>
        )}
      </div>
    </div>
  );
}
