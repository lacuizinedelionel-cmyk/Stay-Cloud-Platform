import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  useListRestaurantOrders,
  useUpdateRestaurantOrderStatus,
  getListRestaurantOrdersQueryKey,
} from '@workspace/api-client-react';
import {
  RestaurantOrder,
  RestaurantOrderStatus,
  UpdateOrderStatusBodyStatus,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  ChefHat,
  Bell,
  CheckCircle2,
  XCircle,
  User,
  TableProperties,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const DEMO_RESTAURANT_ORDERS = [
  {
    id: 7001,
    status: RestaurantOrderStatus.PENDING,
    clientName: 'M. Eto\'o',
    tableNumber: 12,
    createdAt: new Date().toISOString(),
    total: 18500,
    items: [
      { quantity: 2, productName: 'Poulet DG', subtotal: 12000 },
      { quantity: 1, productName: 'Jus gingembre', subtotal: 3500 },
      { quantity: 1, productName: 'Plantain', subtotal: 3000 },
    ],
  },
  {
    id: 7002,
    status: RestaurantOrderStatus.PREPARING,
    clientName: 'Mme Bella',
    tableNumber: 5,
    createdAt: new Date().toISOString(),
    total: 22500,
    items: [
      { quantity: 1, productName: 'Poisson braisé', subtotal: 15000 },
      { quantity: 2, productName: 'Bâton de manioc', subtotal: 7500 },
    ],
  },
  {
    id: 7003,
    status: RestaurantOrderStatus.READY,
    clientName: 'M. Abena',
    tableNumber: 9,
    createdAt: new Date().toISOString(),
    total: 14500,
    items: [
      { quantity: 1, productName: 'Ndolé', subtotal: 9000 },
      { quantity: 1, productName: 'Eau minérale', subtotal: 1500 },
      { quantity: 1, productName: 'Riz sauté', subtotal: 4000 },
    ],
  },
  {
    id: 7004,
    status: RestaurantOrderStatus.DELIVERED,
    clientName: 'Mme Bella',
    tableNumber: 2,
    createdAt: new Date().toISOString(),
    total: 9800,
    items: [
      { quantity: 1, productName: 'Omelette complète', subtotal: 6000 },
      { quantity: 1, productName: 'Café', subtotal: 1800 },
      { quantity: 1, productName: 'Pain beurre', subtotal: 2000 },
    ],
  },
  ...Array.from({ length: 21 }, (_, i) => {
    const idx = i + 5;
    const dishes = ['Ndolé', 'Poulet DG', 'Soya'] as const;
    const dish = dishes[i % dishes.length];
    const total = 5000 + ((i * 2200) % 45000);
    const statuses = [RestaurantOrderStatus.PENDING, RestaurantOrderStatus.PREPARING, RestaurantOrderStatus.READY, RestaurantOrderStatus.DELIVERED] as const;
    const status = statuses[i % statuses.length];
    return {
      id: 7000 + idx,
      status,
      clientName: idx % 2 === 0 ? 'M. Eto\'o' : idx % 3 === 0 ? 'Mme Bella' : 'M. Abena',
      tableNumber: (idx % 14) + 1,
      createdAt: new Date(Date.now() - idx * 900000).toISOString(),
      total,
      items: [
        { quantity: 1, productName: dish, subtotal: Math.round(total * 0.7) },
        { quantity: 1, productName: dish === 'Soya' ? 'Bâton de manioc' : 'Boisson', subtotal: total - Math.round(total * 0.7) },
      ],
    };
  }),
];

const COLUMNS: {
  status: RestaurantOrderStatus;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  next?: UpdateOrderStatusBodyStatus;
  nextLabel?: string;
}[] = [
  {
    status: RestaurantOrderStatus.PENDING,
    label: 'En attente',
    icon: Clock,
    color: '#F59E0B',
    bg: 'hsl(38 90% 56% / 0.08)',
    next: UpdateOrderStatusBodyStatus.PREPARING,
    nextLabel: 'Préparer',
  },
  {
    status: RestaurantOrderStatus.PREPARING,
    label: 'En préparation',
    icon: ChefHat,
    color: '#3B82F6',
    bg: 'hsl(217 91% 60% / 0.08)',
    next: UpdateOrderStatusBodyStatus.READY,
    nextLabel: 'Prêt',
  },
  {
    status: RestaurantOrderStatus.READY,
    label: 'Prêt à servir',
    icon: Bell,
    color: '#10B981',
    bg: 'hsl(160 84% 39% / 0.08)',
    next: UpdateOrderStatusBodyStatus.DELIVERED,
    nextLabel: 'Livré',
  },
  {
    status: RestaurantOrderStatus.DELIVERED,
    label: 'Livré',
    icon: CheckCircle2,
    color: '#6B7280',
    bg: 'hsl(220 9% 46% / 0.08)',
  },
];

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

function OrderCard({
  order,
  isDragging,
  onAdvance,
  onCancel,
  columnColor,
  isUpdating,
}: {
  order: RestaurantOrder;
  isDragging?: boolean;
  onAdvance?: () => void;
  onCancel?: () => void;
  columnColor: string;
  isUpdating: boolean;
}) {
  const col = COLUMNS.find((c) => c.status === order.status);

  return (
    <div
      className={cn(
        'rounded-xl p-4 space-y-3 select-none transition-all duration-200',
        isDragging ? 'opacity-0' : 'opacity-100',
      )}
      style={{
        background: 'hsl(var(--card))',
        border: `1px solid hsl(var(--border))`,
        boxShadow: '0 2px 8px hsl(0 0% 0% / 0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ background: `${columnColor}18`, color: columnColor }}
          >
            #{order.id}
          </span>
          {order.tableNumber && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <TableProperties className="w-3 h-3" />
              Table {order.tableNumber}
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {timeAgo(order.createdAt)}
        </span>
      </div>

      {/* Client */}
      {order.clientName && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="w-3 h-3 shrink-0" />
          <span className="truncate">{order.clientName}</span>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {order.items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-foreground/80 truncate flex-1">
              <span className="font-semibold text-foreground">{item.quantity}×</span>{' '}
              {item.productName}
            </span>
            <span className="text-muted-foreground ml-2 shrink-0">
              {formatXAF(item.subtotal)}
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-[11px] text-muted-foreground">
            +{order.items.length - 3} article(s) de plus
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-2"
        style={{ borderTop: '1px solid hsl(var(--border))' }}
      >
        <span className="text-sm font-bold text-foreground">{formatXAF(order.total)}</span>
        <div className="flex gap-1.5">
          {order.status !== RestaurantOrderStatus.DELIVERED &&
            order.status !== RestaurantOrderStatus.CANCELLED && (
              <>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    disabled={isUpdating}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Annuler"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
                {onAdvance && col?.next && (
                  <button
                    onClick={onAdvance}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                    style={{ background: `${columnColor}18`, color: columnColor }}
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      col.nextLabel
                    )}
                  </button>
                )}
              </>
            )}
          {order.status === RestaurantOrderStatus.DELIVERED && (
            <span className="flex items-center gap-1 text-[11px] text-success font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Livré
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DraggableOrderCard({
  order,
  onAdvance,
  onCancel,
  columnColor,
  isUpdating,
}: {
  order: RestaurantOrder;
  onAdvance?: () => void;
  onCancel?: () => void;
  columnColor: string;
  isUpdating: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `order-${order.id}`,
    data: { order },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 999, position: 'relative' as const }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <OrderCard
        order={order}
        isDragging={isDragging}
        onAdvance={onAdvance}
        onCancel={onCancel}
        columnColor={columnColor}
        isUpdating={isUpdating}
      />
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  icon: Icon,
  color,
  bg,
  orders,
  next,
  nextLabel,
  onAdvance,
  onCancel,
  updatingId,
}: {
  status: RestaurantOrderStatus;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  orders: RestaurantOrder[];
  next?: UpdateOrderStatusBodyStatus;
  nextLabel?: string;
  onAdvance: (id: number, status: UpdateOrderStatusBodyStatus) => void;
  onCancel: (id: number) => void;
  updatingId: number | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-xl overflow-hidden transition-all duration-200 min-w-[260px]"
      style={{
        background: isOver ? bg : 'hsl(var(--card))',
        border: `1px solid ${isOver ? color + '60' : 'hsl(var(--border))'}`,
        minHeight: 'calc(100vh - 200px)',
        maxHeight: 'calc(100vh - 160px)',
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: `2px solid ${color}`, background: bg }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} strokeWidth={2} />
          <span className="text-sm font-bold text-foreground">{label}</span>
        </div>
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={{ background: `${color}25`, color }}
        >
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18 }}
            >
              <DraggableOrderCard
                order={order}
                columnColor={color}
                onAdvance={next ? () => onAdvance(order.id, next) : undefined}
                onCancel={() => onCancel(order.id)}
                isUpdating={updatingId === order.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon className="w-8 h-8 mb-3 opacity-20" style={{ color }} strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">Aucune commande</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RestaurantOrdersPage() {
  const { business } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [activeOrder, setActiveOrder] = useState<RestaurantOrder | null>(null);

  const ordersQueryKey = getListRestaurantOrdersQueryKey({ businessId: business?.id ?? 0 });
  const { data: orders, isLoading, refetch } = useListRestaurantOrders(
    { businessId: business?.id ?? 0 },
    { query: { queryKey: ordersQueryKey, enabled: !!business?.id, refetchInterval: 15000 } },
  );
  const displayOrders = orders && orders.length > 0 ? orders : DEMO_RESTAURANT_ORDERS;

  const { mutate: updateStatus } = useUpdateRestaurantOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListRestaurantOrdersQueryKey({ businessId: business?.id ?? 0 }),
        });
        setUpdatingId(null);
      },
      onError: () => {
        setUpdatingId(null);
        toast({ title: 'Erreur', description: 'Mise à jour impossible', variant: 'destructive' });
      },
    },
  });

  const handleAdvance = useCallback(
    (id: number, status: UpdateOrderStatusBodyStatus) => {
      setUpdatingId(id);
      updateStatus({ id, data: { status } });
    },
    [updateStatus],
  );

  const handleCancel = useCallback(
    (id: number) => {
      setUpdatingId(id);
      updateStatus({ id, data: { status: UpdateOrderStatusBodyStatus.CANCELLED } });
    },
    [updateStatus],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const getColumnOrders = (status: RestaurantOrderStatus) =>
    (displayOrders ?? []).filter((o) => o.status === status);

  function handleDragStart(event: DragStartEvent) {
    const order = event.active.data.current?.order as RestaurantOrder;
    if (order) setActiveOrder(order);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    setActiveOrder(null);
    if (!over) return;

    const order = active.data.current?.order as RestaurantOrder;
    const newStatus = over.id as RestaurantOrderStatus;

    if (!order || order.status === newStatus) return;

    const currentIndex = COLUMNS.findIndex((c) => c.status === order.status);
    const targetIndex = COLUMNS.findIndex((c) => c.status === newStatus);

    if (targetIndex <= currentIndex || newStatus === RestaurantOrderStatus.CANCELLED) return;

    handleAdvance(order.id, newStatus as unknown as UpdateOrderStatusBodyStatus);
  }

  const activeCol = COLUMNS.find((c) => c.status === activeOrder?.status);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
      >
        <div>
          <h1 className="text-lg font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
            Gestion des commandes
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mise à jour automatique toutes les 15 secondes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {displayOrders?.filter((o) => o.status === RestaurantOrderStatus.PENDING).length ?? 0} en
            attente
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-5 h-full" style={{ minWidth: 'max-content' }}>
          {isLoading ? (
            Array(4)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="w-[260px] h-full rounded-xl" />)
          ) : (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.status}
                  {...col}
                  orders={getColumnOrders(col.status)}
                  onAdvance={handleAdvance}
                  onCancel={handleCancel}
                  updatingId={updatingId}
                />
              ))}

              <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {activeOrder && activeCol ? (
                  <div style={{ width: 260 }} className="rotate-2">
                    <OrderCard
                      order={activeOrder}
                      columnColor={activeCol.color}
                      isUpdating={false}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
