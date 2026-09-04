import { motion, AnimatePresence } from 'framer-motion';

interface BrandSplashProps {
  visible: boolean;
  title: string;
  subtitle?: string;
}

/**
 * Pantalla completa con el logo y un mensaje: se usa al entrar (bienvenida) y
 * al salir (despedida), que antes eran dos componentes casi idénticos.
 */
export function BrandSplash({ visible, title, subtitle }: BrandSplashProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-background fixed inset-0 z-60 flex flex-col items-center justify-center gap-7 text-center"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="bg-primary/10 absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
            <div className="bg-success/10 absolute top-1/2 left-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]" />
          </div>

          <motion.div
            className="relative z-10 size-24 rounded-2xl bg-white p-2.5 shadow-2xl shadow-black/40"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
          >
            <img src="/logo.png" alt="FinTrack" className="size-full object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative z-10 space-y-2"
          >
            <p className="text-4xl font-bold tracking-tight">{title}</p>
            {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
          </motion.div>

          <motion.div
            className="relative z-10 flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="bg-success size-2 rounded-full"
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
