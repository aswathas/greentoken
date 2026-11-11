/**
 * PageTransition — cross-fades between routed views.
 *
 * The animation only ever touches `opacity` and `y`, both of which are
 * composited transforms, so the transition itself can never shift the layout
 * of the surrounding page. The wrapper is `position: relative` so callers can
 * position overlays against it, and the outgoing page stays in the flow while
 * it fades (which keeps the container at the outgoing page's height for the
 * whole exit phase).
 *
 * Enter and exit carry their own transitions: entering lifts the page 12px
 * over 0.32s, exiting lifts it out by 8px over 0.18s.
 */
import { AnimatePresence, motion, type BezierDefinition, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

import '../styles/motion.css';

/** Shared entrance/exit curve for the whole motion layer. */
export const PAGE_EASE: BezierDefinition = [0.2, 0, 0, 1];

const pageVariants: Variants = {
  enter: {
    opacity: 0,
    y: 12,
    transition: { duration: 0.32, ease: PAGE_EASE },
  },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: PAGE_EASE },
  },
  leave: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: PAGE_EASE },
  },
};

export interface PageTransitionProps {
  /** Change this value to trigger the transition (usually the route id). */
  pageKey: string;
  children: ReactNode;
  className?: string;
}

export function PageTransition({ pageKey, children, className }: PageTransitionProps) {
  const rootClass = className ? `page-transition ${className}` : 'page-transition';

  return (
    <div className={rootClass}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pageKey}
          className="page-transition__page"
          variants={pageVariants}
          initial="enter"
          animate="show"
          exit="leave"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
