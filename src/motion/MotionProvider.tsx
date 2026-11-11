/**
 * MotionProvider — app-wide motion configuration.
 *
 * Wraps the tree in framer-motion's <MotionConfig reducedMotion="user"> so that
 * every animation below this point automatically honours the operating system's
 * "reduce motion" accessibility setting. Components in this folder additionally
 * poll `useReducedMotion()` themselves when they need a *different* reduced
 * behaviour (for example rendering a final static frame).
 *
 * Usage:
 *   <MotionProvider>
 *     <App />
 *   </MotionProvider>
 */
import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

import '../styles/motion.css';

export interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
