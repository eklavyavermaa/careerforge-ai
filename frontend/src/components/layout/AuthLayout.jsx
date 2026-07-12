import { Outlet, Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-10 relative overflow-hidden">
      {/* Ambient forge glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[36rem] rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, var(--ember), transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ember/15 text-ember">
            <Flame className="h-5 w-5" />
          </div>
          <span className="font-display font-semibold text-xl tracking-tight">CareerForge</span>
        </Link>

        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8 shadow-sm">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
