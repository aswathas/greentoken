/**
 * Reveal — one-shot entrance animation for arbitrary content.
 *
 * Fades its children in while lifting them 12px into place. The animation is
 * fire-and-forget: it plays once when the component mounts and never repeats.
 *
 * Usage:
 *   <Reveal delay={0.1}>
 *     <Card />
 *   </Reveal>
 */
import { motion, useReducedMotion, type BezierDefinition } from 'framer-motion';
import type { ReactNode } from 'react';

import '../styles/motion.css';

const REVEAL_EASE: BezierDefinition = [0.22, 1, 0.36, 1];

export interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before the entrance starts. */
  delay?: number;
  /** Distance in pixels the content travels up while fading in. */
  y?: number;
  /** Duration of the entrance in seconds. */
  duration?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 12, duration = 0.45, className }: RevealProps) {
  const reduceMotion = useReducedMotion() === true;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
  );
}
