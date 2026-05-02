import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRestaurantProducts,
  useCreateRestaurantOrder,
  getListRestaurantOrdersQueryKey,
  getGetRestaurantStatsQueryKey,
  RestaurantProduct,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatXAF } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  CheckCircle,
  Banknote,
  Smartphone,
  CreditCard,
  ChevronRight,
  UtensilsCrossed,
  ReceiptText,
  User,
  Hash,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CartItem = {
  product: RestaurantProduct;
  quantity: number;
};

type PaymentMethod = "CASH" | "MTN_MOBILE_MONEY" | "ORANGE_MONEY" | "CARD";

const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: "ALL", label: "Tout", emoji: "🍽️" },
  { key: "PLATS_PRINCIPAUX", label: "Plats", emoji: "🥘" },
  { key: "GRILLADES", label: "Grillades", emoji: "🔥" },
  { key: "ENTREES", label: "Entrées", emoji: "🥗" },
  { key: "DESSERTS", label: "Desserts", emoji: "🍰" },
  { key: "BOISSONS", label: "Boissons", emoji: "🥤" },
];

const PAYMENT_METHODS: {
  key: PaymentMethod;
  label: string;
  icon: React.FC<any>;
  color: string;
  bg: string;
}[] = [
  {
    key: "CASH",
    label: "Espèces",
    icon: Banknote,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
  {
    key: "MTN_MOBILE_MONEY",
    label: "MTN MoMo",
    icon: Smartphone,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
  },
  {
    key: "ORANGE_MONEY",
    label: "Orange Money",
    icon: Smartphone,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
  },
  {
    key: "CARD",
    label: "Carte Bancaire",
    icon: CreditCard,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30",
  },
];

// ─── Composant principal ───────────────────────────────────────────────────────

export default function RestaurantPOS() {
  const { business } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [clientName, setClientName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("CASH");
  const [cashGiven, setCashGiven] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);

  const { data: products, isLoading } = useListRestaurantProducts(
    { businessId: business?.id, category: selectedCategory === "ALL" ? undefined : selectedCategory },
    { query: { enabled: !!business?.id } }
  );

  const createOrder = useCreateRestaurantOrder();

  // ── Calculs du panier ──────────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery) return products.filter((p) => p.isAvailable);
    return products.filter(
      (p) =>
        p.isAvailable &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, searchQuery]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const monnaie = useMemo(() => {
    const given = parseFloat(cashGiven) || 0;
    return given - cartTotal;
  }, [cashGiven, cartTotal]);

  // ── Actions panier ─────────────────────────────────────────────────────────

  const addToCart = (product: RestaurantProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setClientName("");
    setTableNumber("");
  };

  // ── Valider la commande ────────────────────────────────────────────────────

  const handleValidate = () => {
    if (cart.length === 0) {
      toast({ variant: "destructive", title: "Panier vide", description: "Ajoutez des articles avant de valider." });
      return;
    }
    setShowPayment(true);
  };

  const handleConfirmPayment = () => {
    if (!business?.id) return;

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    createOrder.mutate(
      {
        data: {
          businessId: business.id,
          clientName: clientName || "Client divers",
          tableNumber: tableNumber || undefined,
          items: orderItems,
          paymentMethod: selectedPayment,
        },
      },
      {
        onSuccess: (order) => {
          setLastOrderId(order.id);
          setOrderSuccess(true);
          queryClient.invalidateQueries({ queryKey: getListRestaurantOrdersQueryKey({ businessId: business.id }) });
          queryClient.invalidateQueries({ queryKey: getGetRestaurantStatsQueryKey({ businessId: business.id }) });
          setTimeout(() => {
            setOrderSuccess(false);
            setShowPayment(false);
            clearCart();
            setCashGiven("");
          }, 2200);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Erreur", description: "Impossible de valider la commande." });
        },
      }
    );
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Colonne gauche : catalogue produits ─────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-foreground">Caisse Tactile</h1>
              <p className="text-xs text-muted-foreground">{business?.name}</p>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un plat…"
              className="w-full bg-background/70 border border-border/50 rounded-lg pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 px-6 py-3 border-b border-border/50 overflow-x-auto shrink-0 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                selectedCategory === cat.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                  : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Grille produits */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-[160px] rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <UtensilsCrossed className="w-12 h-12 opacity-20" />
              <p>Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQty={cart.find((i) => i.product.id === product.id)?.quantity ?? 0}
                  onAdd={() => addToCart(product)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Colonne droite : panier ──────────────────────────────────────── */}
      <div className="w-[380px] flex flex-col border-l border-border/50 bg-card shrink-0">
        {/* En-tête panier */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Commande</span>
            {cartCount > 0 && (
              <Badge className="bg-primary text-primary-foreground h-5 px-1.5 text-xs">{cartCount}</Badge>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Vider
            </button>
          )}
        </div>

        {/* Infos client / table */}
        <div className="px-5 py-3 border-b border-border/50 space-y-2">
          <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2 border border-border/40">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client (optionnel)"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2 border border-border/40">
            <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Numéro de table (optionnel)"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Articles du panier */}
        <div className="flex-1 overflow-y-auto px-5 py-3 custom-scrollbar space-y-2">
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16"
              >
                <ShoppingCart className="w-14 h-14 opacity-10" />
                <p className="text-sm">Le panier est vide</p>
                <p className="text-xs opacity-60">Touchez un produit pour l'ajouter</p>
              </motion.div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 bg-background/40 rounded-xl p-3 border border-border/30"
                >
                  <span className="text-2xl shrink-0">{item.product.emoji ?? "🍽️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatXAF(item.product.price)} / unité</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQty(item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product.id, +1)}
                      className="w-7 h-7 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-7 h-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Pied de panier : total + bouton */}
        <div className="border-t border-border/50 p-5 space-y-3 bg-card">
          {/* Sous-total par article */}
          {cart.length > 0 && (
            <div className="space-y-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>{formatXAF(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <span className="text-base font-semibold text-foreground">Total</span>
            <motion.span
              key={cartTotal}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-primary"
            >
              {formatXAF(cartTotal)}
            </motion.span>
          </div>

          <Button
            onClick={handleValidate}
            disabled={cart.length === 0}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-base rounded-xl gap-2 shadow-lg shadow-primary/20 transition-all"
          >
            <ReceiptText className="w-5 h-5" />
            Encaisser
            <ChevronRight className="w-5 h-5 ml-auto" />
          </Button>
        </div>
      </div>

      {/* ── Modal paiement ───────────────────────────────────────────────── */}
      <Dialog open={showPayment} onOpenChange={(v) => { if (!createOrder.isPending) setShowPayment(v); }}>
        <DialogContent className="max-w-md bg-card border-border/50 p-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {orderSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 px-8 gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-bold font-serif text-foreground">Paiement accepté !</h2>
                <p className="text-muted-foreground text-sm text-center">
                  Commande #{lastOrderId} enregistrée avec succès
                </p>
                <p className="text-3xl font-bold text-primary">{formatXAF(cartTotal)}</p>
                {selectedPayment === "CASH" && monnaie > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-6 py-3 text-center">
                    <p className="text-xs text-muted-foreground">Monnaie à rendre</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatXAF(monnaie)}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DialogHeader className="px-6 py-5 border-b border-border/50">
                  <DialogTitle className="font-serif text-xl">Choisir le mode de paiement</DialogTitle>
                  {clientName && (
                    <p className="text-sm text-muted-foreground">Client : <span className="text-foreground font-medium">{clientName}</span></p>
                  )}
                </DialogHeader>

                <div className="p-6 space-y-5">
                  {/* Récap commande */}
                  <div className="bg-background/50 rounded-xl p-4 border border-border/30 space-y-2">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.quantity}× {item.product.name}</span>
                        <span className="text-foreground font-medium">{formatXAF(item.product.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border/30 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary text-lg">{formatXAF(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Modes de paiement */}
                  <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPayment === method.key;
                      return (
                        <button
                          key={method.key}
                          onClick={() => setSelectedPayment(method.key)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                            isSelected
                              ? `${method.bg} border-current ${method.color} shadow-sm`
                              : "bg-background/40 border-border/30 text-muted-foreground hover:border-border"
                          )}
                        >
                          <Icon className={cn("w-6 h-6", isSelected ? method.color : "")} />
                          <span className="text-sm font-medium">{method.label}</span>
                          {isSelected && method.key === "MTN_MOBILE_MONEY" && (
                            <span className="text-xs opacity-70">*126#</span>
                          )}
                          {isSelected && method.key === "ORANGE_MONEY" && (
                            <span className="text-xs opacity-70">#150#</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Montant donné (espèces) */}
                  {selectedPayment === "CASH" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 bg-background/50 rounded-xl border border-border/40 px-4 py-3">
                        <Banknote className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="number"
                          value={cashGiven}
                          onChange={(e) => setCashGiven(e.target.value)}
                          placeholder={`Montant reçu (min. ${formatXAF(cartTotal)})`}
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                      </div>

                      {/* Raccourcis montants */}
                      <div className="flex gap-2 flex-wrap">
                        {[cartTotal, 5000, 10000, 25000, 50000].filter((v, i, a) => a.indexOf(v) === i).map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setCashGiven(amount.toString())}
                            className="px-3 py-1.5 bg-background/60 hover:bg-muted rounded-lg text-xs border border-border/40 transition-colors text-foreground"
                          >
                            {formatXAF(amount)}
                          </button>
                        ))}
                      </div>

                      {cashGiven && monnaie >= 0 && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Monnaie à rendre</span>
                          <span className="font-bold text-emerald-400 text-lg">{formatXAF(monnaie)}</span>
                        </div>
                      )}
                      {cashGiven && monnaie < 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Montant insuffisant</span>
                          <span className="font-bold text-destructive text-lg">{formatXAF(Math.abs(monnaie))} manquants</span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Bouton confirmer */}
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={
                      createOrder.isPending ||
                      (selectedPayment === "CASH" && cashGiven !== "" && monnaie < 0)
                    }
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl gap-2 shadow-lg shadow-primary/20"
                  >
                    {createOrder.isPending ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    Confirmer le paiement · {formatXAF(cartTotal)}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Carte produit ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  cartQty,
  onAdd,
}: {
  product: RestaurantProduct;
  cartQty: number;
  onAdd: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onAdd}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center w-full group",
        "bg-card hover:bg-card/80 border-border/40 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        cartQty > 0 && "border-primary/50 bg-primary/5"
      )}
    >
      {/* Badge quantité */}
      <AnimatePresence>
        {cartQty > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md"
          >
            {cartQty}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji plat */}
      <span className="text-4xl leading-none">{product.emoji ?? "🍽️"}</span>

      {/* Nom */}
      <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
        {product.name}
      </p>

      {/* Prix */}
      <p className="text-primary font-bold text-sm mt-auto">{formatXAF(product.price)}</p>

      {/* Icône + au survol */}
      <div className={cn(
        "absolute bottom-2 right-2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
        cartQty > 0 && "opacity-100 bg-primary/30"
      )}>
        <Plus className="w-3.5 h-3.5 text-primary" />
      </div>
    </motion.button>
  );
}
