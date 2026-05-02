import { useState, useMemo } from 'react';
import {
  useListRestaurantProducts,
  useCreateRestaurantOrder,
  getListRestaurantProductsQueryKey,
  CreateRestaurantOrderBodyPaymentMethod,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  Smartphone,
  CreditCard,
  Banknote,
  TableProperties,
  User,
  ShoppingCart,
  ChevronRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  emoji?: string | null;
};

type PaymentMethod = (typeof CreateRestaurantOrderBodyPaymentMethod)[keyof typeof CreateRestaurantOrderBodyPaymentMethod];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'CASH', label: 'Espèces', icon: Banknote, color: '#10B981' },
  { value: 'MTN_MOBILE_MONEY', label: 'MTN MoMo', icon: Smartphone, color: '#F59E0B' },
  { value: 'ORANGE_MONEY', label: 'Orange Money', icon: Smartphone, color: '#F97316' },
  { value: 'CARD', label: 'Carte', icon: CreditCard, color: '#3B82F6' },
];

function SuccessOverlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex flex-col items-center gap-4"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'hsl(160 84% 39% / 0.15)' }}
        >
          <CheckCircle2 className="w-10 h-10" style={{ color: '#10B981' }} />
        </div>
        <div className="text-center">
          <p className="text-xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
            Commande envoyée !
          </p>
          <p className="text-sm text-muted-foreground mt-1">La cuisine a reçu la commande</p>
        </div>
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          Nouvelle commande
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function POSPage() {
  const { business } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TOUS');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [showSuccess, setShowSuccess] = useState(false);

  const productsQueryKey = getListRestaurantProductsQueryKey({ businessId: business?.id ?? 0 });
  const { data: products, isLoading } = useListRestaurantProducts(
    { businessId: business?.id ?? 0 },
    { query: { queryKey: productsQueryKey, enabled: !!business?.id } },
  );

  const { mutate: createOrder, isPending } = useCreateRestaurantOrder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: productsQueryKey });
        setShowSuccess(true);
      },
      onError: () => {
        toast({ title: 'Erreur', description: "Impossible d'envoyer la commande", variant: 'destructive' });
      },
    },
  });

  // Categories
  const categories = useMemo(() => {
    if (!products) return ['TOUS'];
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['TOUS', ...cats];
  }, [products]);

  // Filtered products
  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesCat = activeCategory === 'TOUS' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch && p.isAvailable;
    });
  }, [products, activeCategory, search]);

  // Cart helpers
  const addToCart = (product: { id: number; name: string; price: number; emoji?: string | null }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, emoji: product.emoji }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) => setCart((prev) => prev.filter((i) => i.productId !== productId));

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = () => {
    if (!business?.id || cart.length === 0) return;
    createOrder({
      data: {
        businessId: business.id,
        tableNumber: tableNumber || undefined,
        clientName: clientName || undefined,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
      },
    });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setCart([]);
    setTableNumber('');
    setClientName('');
    setPaymentMethod('CASH');
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* LEFT — Product catalog */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div
          className="shrink-0 flex items-center gap-4 px-5 py-3"
          style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
        >
          <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
            <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{filtered.length}</span> articles
          </div>
        </div>

        {/* Category tabs */}
        <div
          className="shrink-0 flex gap-2 px-5 py-3 overflow-x-auto"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                activeCategory === cat
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={
                activeCategory === cat
                  ? { background: 'hsl(38 90% 56%)', color: '#000' }
                  : { background: 'hsl(var(--muted))' }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="text-4xl">🍽️</p>
              <p className="text-sm text-muted-foreground">Aucun article trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((product) => {
                const inCart = cart.find((i) => i.productId === product.id);
                return (
                  <motion.button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    whileTap={{ scale: 0.97 }}
                    className="relative flex flex-col items-start gap-2 p-4 rounded-xl text-left transition-all"
                    style={{
                      background: inCart ? 'hsl(38 90% 56% / 0.1)' : 'hsl(var(--card))',
                      border: `1px solid ${inCart ? 'hsl(38 90% 56% / 0.5)' : 'hsl(var(--border))'}`,
                    }}
                  >
                    {inCart && (
                      <span
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
                      >
                        {inCart.quantity}
                      </span>
                    )}
                    <span className="text-3xl leading-none">{product.emoji || '🍽️'}</span>
                    <div className="w-full">
                      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-xs font-bold mt-1" style={{ color: 'hsl(38 90% 56%)' }}>
                        {formatXAF(product.price)}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Cart panel */}
      <div
        className="relative w-[320px] shrink-0 flex flex-col overflow-hidden"
        style={{ borderLeft: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
      >
        <AnimatePresence>
          {showSuccess && <SuccessOverlay onClose={handleSuccessClose} />}
        </AnimatePresence>

        {/* Cart header */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-foreground" strokeWidth={1.5} />
            <span className="text-sm font-bold text-foreground">Commande en cours</span>
          </div>
          {cartCount > 0 && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
            >
              {cartCount}
            </span>
          )}
        </div>

        {/* Table + Client */}
        <div className="shrink-0 px-5 py-3 space-y-2.5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <TableProperties className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="N° de table (optionnel)"
              className="bg-transparent flex-1 text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client (optionnel)"
              className="bg-transparent flex-1 text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3 space-y-2">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center"
              >
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30" strokeWidth={1} />
                <p className="text-xs text-muted-foreground">Aucun article dans la commande</p>
                <p className="text-[11px] text-muted-foreground/60">Cliquez sur les articles à gauche</p>
              </motion.div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'hsl(var(--muted))' }}
                >
                  <span className="text-xl shrink-0">{item.emoji || '🍽️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatXAF(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQty(item.productId, -1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                      style={{ background: 'hsl(var(--card))' }}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, 1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                      style={{ background: 'hsl(var(--card))' }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-destructive transition-all hover:bg-destructive/10 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Payment + Submit */}
        <div className="shrink-0 px-5 py-4 space-y-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          {/* Payment method */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Mode de paiement
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = paymentMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: isActive ? `${opt.color}18` : 'hsl(var(--muted))',
                      border: `1px solid ${isActive ? opt.color + '60' : 'transparent'}`,
                      color: isActive ? opt.color : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: 'hsl(var(--muted))' }}
          >
            <span className="text-sm text-muted-foreground font-medium">Total</span>
            <span className="text-xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
              {formatXAF(total)}
            </span>
          </div>

          {/* Submit button */}
          <motion.button
            onClick={handleSubmit}
            disabled={cart.length === 0 || isPending}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: cart.length > 0 ? 'hsl(38 90% 56%)' : 'hsl(var(--muted))',
              color: cart.length > 0 ? '#000' : 'hsl(var(--muted-foreground))',
            }}
          >
            {isPending ? (
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer en cuisine
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
