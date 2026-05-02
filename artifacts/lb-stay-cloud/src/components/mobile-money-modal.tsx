import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { formatXAF } from '@/lib/utils';

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */
type Operator = 'MTN' | 'ORANGE';
type Step = 'select' | 'confirm' | 'pending' | 'success' | 'failed';

interface MobileMoneyModalProps {
  open: boolean;
  amount: number;
  label: string;
  onSuccess: () => void;
  onClose: () => void;
}

/* ──────────────────────────────────────────────
   Config opérateurs
────────────────────────────────────────────── */
const OPS: Record<Operator, {
  name: string;
  color: string;
  bg: string;
  gradient: string;
  prefix: string;
  logo: React.ReactNode;
}> = {
  MTN: {
    name: 'MTN Mobile Money',
    color: '#FFCB05',
    bg: 'rgba(255,203,5,0.10)',
    gradient: 'linear-gradient(135deg,#F59E0B,#FFCB05)',
    prefix: '6',
    logo: (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="12" fill="#FFCB05"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle"
          fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="900"
          fontSize="14" fill="#1A1A2E">MTN</text>
      </svg>
    ),
  },
  ORANGE: {
    name: 'Orange Money',
    color: '#FF6B00',
    bg: 'rgba(255,107,0,0.10)',
    gradient: 'linear-gradient(135deg,#EA580C,#FF6B00)',
    prefix: '6',
    logo: (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="12" fill="#FF6B00"/>
        <circle cx="24" cy="24" r="10" fill="white" fillOpacity="0.9"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle"
          fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="900"
          fontSize="8" fill="#FF6B00">OM</text>
      </svg>
    ),
  },
};

/* ──────────────────────────────────────────────
   Composant principal
────────────────────────────────────────────── */
export function MobileMoneyModal({ open, amount, label, onSuccess, onClose }: MobileMoneyModalProps) {
  const [operator, setOperator] = useState<Operator>('MTN');
  const [phone, setPhone]       = useState('');
  const [step, setStep]         = useState<Step>('select');
  const [countdown, setCountdown] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Reset à chaque ouverture */
  useEffect(() => {
    if (open) {
      setStep('select');
      setPhone('');
      setCountdown(15);
      setOperator('MTN');
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  /* Countdown quand en attente */
  useEffect(() => {
    if (step === 'pending') {
      setCountdown(15);
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            setStep('success');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  function handleConfirm() {
    if (!phone || phone.length < 9) return;
    setStep('pending');
  }

  function handleSuccess() {
    onSuccess();
    onClose();
    setStep('select');
  }

  const op = OPS[operator];

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mm-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget && step !== 'pending') onClose(); }}
        >
          <motion.div
            key="mm-card"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${op.color}20`,
            }}
          >
            {/* Bande colorée en haut */}
            <div className="h-1 w-full" style={{ background: op.gradient }} />

            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">{op.logo}</div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">{op.name}</p>
                <p className="text-[11px] text-muted-foreground">Paiement sécurisé</p>
              </div>
              {step !== 'pending' && (
                <button onClick={onClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                  style={{ background: 'hsl(var(--muted))' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t" style={{ borderColor: 'hsl(var(--border))' }} />

            {/* Montant */}
            <div className="px-5 pt-4 pb-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Montant à payer</p>
              <p className="text-3xl font-extrabold tracking-tight" style={{ color: op.color }}>
                {formatXAF(amount)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
            </div>

            {/* Contenu par étape */}
            <div className="px-5 pb-5 pt-3">
              <AnimatePresence mode="wait">

                {/* ── Étape 1 : Sélection opérateur + téléphone ── */}
                {step === 'select' && (
                  <motion.div key="select"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  >
                    {/* Choix opérateur */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Opérateur
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {(Object.keys(OPS) as Operator[]).map(op2 => (
                        <button
                          key={op2}
                          onClick={() => setOperator(op2)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: operator === op2 ? OPS[op2].bg : 'hsl(var(--muted))',
                            border: operator === op2 ? `1.5px solid ${OPS[op2].color}` : '1.5px solid transparent',
                            color: operator === op2 ? OPS[op2].color : 'hsl(var(--muted-foreground))',
                          }}
                        >
                          <div className="w-5 h-5 rounded overflow-hidden shrink-0">{OPS[op2].logo}</div>
                          {op2 === 'MTN' ? 'MTN MoMo' : 'Orange Money'}
                        </button>
                      ))}
                    </div>

                    {/* Numéro de téléphone */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Numéro de téléphone
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0"
                        style={{ background: op.bg, color: op.color, border: `1px solid ${op.color}40` }}
                      >
                        <Phone className="w-3 h-3" />
                        +237
                      </div>
                      <input
                        type="tel"
                        placeholder="6XX XXX XXX"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
                        className="flex-1 px-3 py-2.5 rounded-xl text-xs font-mono transition-all outline-none"
                        style={{
                          background: 'hsl(var(--muted))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                        onFocus={e => { e.currentTarget.style.border = `1px solid ${op.color}`; }}
                        onBlur={e => { e.currentTarget.style.border = '1px solid hsl(var(--border))'; }}
                      />
                    </div>

                    <button
                      onClick={() => setStep('confirm')}
                      disabled={phone.length < 9}
                      className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: op.gradient, color: '#fff' }}
                    >
                      Continuer
                    </button>
                  </motion.div>
                )}

                {/* ── Étape 2 : Confirmation ── */}
                {step === 'confirm' && (
                  <motion.div key="confirm"
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  >
                    {/* Récapitulatif */}
                    <div
                      className="rounded-xl p-3.5 mb-4 space-y-2"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                    >
                      <Row label="Opérateur" value={op.name} />
                      <Row label="Numéro" value={`+237 ${phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`} />
                      <Row label="Montant" value={formatXAF(amount)} bold color={op.color} />
                    </div>

                    {/* Message USSD simulé */}
                    <div
                      className="rounded-xl p-3.5 mb-4 text-center"
                      style={{ background: op.bg, border: `1px solid ${op.color}30` }}
                    >
                      <p className="text-[11px] font-mono leading-relaxed" style={{ color: op.color }}>
                        Une notification USSD sera envoyée<br />
                        au <strong>+237 {phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}</strong><br />
                        pour confirmer le paiement.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setStep('select')}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="flex-[2] py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{ background: op.gradient, color: '#fff' }}
                      >
                        Confirmer le paiement
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Étape 3 : En attente ── */}
                {step === 'pending' && (
                  <motion.div key="pending"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-4"
                  >
                    {/* Animation pulsante */}
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: op.bg }}
                      >
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: op.color }} />
                      </div>
                      <div
                        className="absolute inset-0 rounded-full animate-ping opacity-20"
                        style={{ background: op.color }}
                      />
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground mb-1">
                        Notification envoyée !
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Vérifiez votre téléphone et confirmez<br />
                        le paiement via le menu USSD.
                      </p>
                    </div>

                    {/* Countdown ring */}
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                        <circle cx="28" cy="28" r="24" fill="none"
                          stroke="hsl(var(--muted))" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" fill="none"
                          stroke={op.color} strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 24}`}
                          strokeDashoffset={`${2 * Math.PI * 24 * (1 - countdown / 15)}`}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold" style={{ color: op.color }}>{countdown}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground">Expiration dans {countdown}s</p>
                  </motion.div>
                )}

                {/* ── Étape 4 : Succès ── */}
                {step === 'success' && (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                    >
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)' }}
                      >
                        <CheckCircle2 className="w-10 h-10" style={{ color: '#10B981' }} />
                      </div>
                    </motion.div>

                    <div className="text-center">
                      <p className="text-base font-extrabold text-foreground mb-1">
                        Paiement confirmé !
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatXAF(amount)} débité avec succès<br />
                        depuis le <strong>+237 {phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}</strong>
                      </p>
                    </div>

                    <div
                      className="w-full rounded-xl p-3 text-center"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      <p className="text-[11px] font-mono text-green-400">
                        Réf. TXN : {Date.now().toString(36).toUpperCase()}
                      </p>
                    </div>

                    <button
                      onClick={handleSuccess}
                      className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                      style={{ background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff' }}
                    >
                      Parfait, continuer
                    </button>
                  </motion.div>
                )}

                {/* ── Étape 5 : Échec ── */}
                {step === 'failed' && (
                  <motion.div key="failed"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-4"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)' }}
                    >
                      <AlertCircle className="w-8 h-8" style={{ color: '#EF4444' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground mb-1">Paiement non confirmé</p>
                      <p className="text-[11px] text-muted-foreground">Le délai a expiré ou la demande a été rejetée.</p>
                    </div>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => { setStep('select'); setPhone(''); }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                        style={{ background: op.gradient, color: '#fff' }}
                      >
                        Réessayer
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────
   Helper Row
────────────────────────────────────────────── */
function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className="text-[11px] font-semibold"
        style={{ fontWeight: bold ? 700 : 600, color: color ?? 'hsl(var(--foreground))' }}
      >
        {value}
      </span>
    </div>
  );
}
