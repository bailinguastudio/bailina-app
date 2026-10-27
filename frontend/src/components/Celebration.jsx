import { AnimatePresence, motion } from "framer-motion";
import { Star, RotateCcw, ArrowRight } from "lucide-react";
import { Art } from "@/components/Art";

const DOTS = ["#169CA3", "#F36F5B", "#F6BC35", "#169CA3", "#F36F5B", "#F6BC35", "#169CA3", "#F6BC35"];

export function Celebration({ open, onRetry, onNext, nextLabel = "Weiter", children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#174B50]/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="celebration-overlay"
        >
          {DOTS.map((c, i) => (
            <motion.span
              key={i}
              className="absolute w-4 h-4 rounded-full"
              style={{ background: c, left: `${10 + i * 11}%`, top: "40%" }}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: [-10, -220 - (i % 3) * 60], x: (i % 2 ? 1 : -1) * 30, opacity: [1, 0] }}
              transition={{ duration: 1.4, delay: i * 0.05 }}
            />
          ))}
          <motion.div
            className="card-soft w-full max-w-md p-6 sm:p-8 text-center max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <Art imageKey="capi" icon="Smile" label="Capi" className="w-28 h-28 mx-auto rounded-full border-4 border-[#F6BC35]" />
            <div className="flex justify-center gap-2 my-4">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.25 + i * 0.15, type: "spring" }}>
                  <Star className="w-12 h-12 text-[#F6BC35] fill-[#F6BC35]" />
                </motion.div>
              ))}
            </div>
            <h2 className="font-display font-bold text-4xl text-[#169CA3]" lang="es" data-testid="celebration-title">¡Muy bien!</h2>
            <p className="text-xl text-[#174B50] mb-4">Sehr gut gemacht!</p>
            {children}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
              <button className="btn btn-ghost" onClick={onRetry} data-testid="celebration-retry-btn">
                <RotateCcw className="w-5 h-5" /> Nochmal spielen
              </button>
              <button className="btn btn-coral" onClick={onNext} data-testid="celebration-next-btn">
                {nextLabel} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
