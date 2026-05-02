import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Zap, ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'hsl(222 44% 5%)' }}
    >
      {/* Blobs décoratifs animés */}
      <div
        className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(38 90% 56%), transparent 70%)', animation: 'float 8s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(217 91% 60%), transparent 70%)', animation: 'float 10s ease-in-out infinite reverse' }}
      />
      <div
        className="absolute top-[40%] right-[15%] w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #A78BFA, transparent 70%)', animation: 'float 12s ease-in-out infinite 3s' }}
      />

      {/* Grille de points */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(210 40% 96%) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Contenu central */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="flex items-center gap-2.5 mb-10"
        >
          <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-lg"
            style={{ boxShadow: '0 0 32px hsl(38 90% 56% / 0.4)' }}>
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-extrabold tracking-tight" style={{ color: 'hsl(210 40% 96%)' }}>
            LB Stay Cloud
          </span>
        </motion.div>

        {/* 404 */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}
          className="relative mb-6"
        >
          <span
            className="text-[10rem] font-black leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, hsl(38 90% 62%), hsl(38 90% 48%), hsl(30 90% 42%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              letterSpacing: '-0.06em',
            }}
          >
            404
          </span>
          {/* Glow derrière le 404 */}
          <div
            className="absolute inset-0 blur-3xl opacity-20 pointer-events-none"
            style={{ background: 'hsl(38 90% 56%)' }}
          />
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mb-8"
        >
          <h1
            className="text-2xl font-extrabold mb-3"
            style={{ color: 'hsl(210 40% 96%)', letterSpacing: '-0.02em' }}
          >
            Page introuvable
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'hsl(215 20% 55%)' }}>
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
            Retournez à votre tableau de bord pour continuer.
          </p>
        </motion.div>

        {/* Boutons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
        >
          <Link href="/dashboard" className="flex-1">
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, hsl(38 90% 56%), hsl(30 90% 48%))', color: '#fff' }}
            >
              <Home className="w-4 h-4" />
              Tableau de bord
            </button>
          </Link>
          <Link href="/login">
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: 'hsl(222 30% 13%)',
                border: '1px solid hsl(222 30% 20%)',
                color: 'hsl(215 20% 65%)',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Connexion
            </button>
          </Link>
        </motion.div>

        {/* Aide rapide */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 flex items-center gap-2 text-xs"
          style={{ color: 'hsl(215 20% 40%)' }}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Erreur 404 · LB Stay Cloud Platform SaaS</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
