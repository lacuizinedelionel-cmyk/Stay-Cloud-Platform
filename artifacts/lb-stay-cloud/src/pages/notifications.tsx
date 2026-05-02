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
  const { business } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: notifications, isLoading } = useListNotifications(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getListNotificationsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const markAsRead = useMarkNotificationRead();

  const handleMarkAsRead = (id: number) => {
    markAsRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ businessId: business?.id ?? 0 }) });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'INFO': return <Info className="w-5 h-5 text-blue-400" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'ORDER': return <Package className="w-5 h-5 text-primary" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground mt-1">Vos alertes et messages importants</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <Card key={notif.id} className={`border-border/50 bg-card transition-all ${!notif.isRead ? 'border-primary/30 bg-primary/5' : ''}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.isRead ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleDateString('fr-FR', { 
                      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {!notif.isRead && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs flex-shrink-0"
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    Marquer lu
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Aucune notification</p>
          </div>
        )}
      </div>
    </div>
  );
}
