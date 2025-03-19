
import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

type TransitionEffectProps = {
  children: ReactNode;
  className?: string;
};

export const FadeIn = ({ children, className = "" }: TransitionEffectProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideUp = ({ children, className = "" }: TransitionEffectProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideDown = ({ children, className = "" }: TransitionEffectProps) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideFromRight = ({ children, className = "" }: TransitionEffectProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideFromLeft = ({ children, className = "" }: TransitionEffectProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export const ScaleIn = ({ children, className = "" }: TransitionEffectProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// Staggered children effect - wrap children in motion.div
export const StaggerContainer = ({ children, className = "" }: TransitionEffectProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={{
      visible: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Item for staggered animation
export const StaggerItem = ({ children, className = "" }: TransitionEffectProps) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// Page transition component
const PageTransition = ({ children }: TransitionEffectProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="w-full"
  >
    {children}
  </motion.div>
);

export default PageTransition;
