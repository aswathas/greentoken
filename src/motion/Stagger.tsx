/**
 * Stagger — staggered entrance for grids and lists.
 *
 * <Stagger> is the container, <StaggerItem> the children. The container
 * declares framer-motion's `staggerChildren` / `delayChildren` orchestration
 * and every item additionally receives an explicit, *clamped* delay derived
 * from the index that the container hands down through context.
 *
 * Why the explicit delay?
 *  - The total stagger is capped so a 12+ item grid still finishes inside
 *    ~400ms: the step is clamped to 0.04s and the delay index is clamped to
 *    item 10 (item 11 and beyond share item 10's slot).
 *  - An explicit delay is immune to the automatic stagger index, which
 *    framer-motion derives from the DOM order of every motion descendant and
 *    would therefore drift as soon as a nested motion component is used.
 *
 * Usage:
 *   <Stagger stagger={0.05} delayChildren={0.05}>
 *     {items.map((i) => (
 *       <StaggerItem key={i.id}>
 *         <Card />
 *       </StaggerItem>
 *     ))}
 *   </Stagger>
 */
import { motion, useReducedMotion, type BezierDefinition, type Variants } from 'framer-motion';
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import '../styles/motion.css';

const STAGGER_EASE: BezierDefinition = [0.22, 1, 0.36, 1];

/** Largest delay step a single item may contribute (seconds). */
export const MAX_STAGGER_STEP = 0.04;

/** Items beyond this index share the last slot, keeping the total under ~400ms. */
export const MAX_STAGGER_INDEX = 10;

interface StaggerTiming {
  /** Delay step between two consecutive items (seconds). */
  stagger: number;
  /** Delay before the first item starts (seconds). */
  delayChildren: number;
}

const StaggerTimingContext = createContext<StaggerTiming>({
  stagger: MAX_STAGGER_STEP,
  delayChildren: 0,
});

/** Index of the item inside its <Stagger> container. */
const StaggerIndexContext = createContext<number>(0);

export interface StaggerProps {
  children: ReactNode;
  /** Delay step between items in seconds — clamped to MAX_STAGGER_STEP. */
  stagger?: number;
  /** Delay before the first item starts, in seconds. */
  delayChildren?: number;
  className?: string;
}

export interface StaggerItemProps {
  children: ReactNode;
  /** Distance in pixels the item travels up while fading in. */
  y?: number;
  /** Duration of a single item's entrance in seconds. */
  duration?: number;
  className?: string;
}

/**
 * Wraps every child in an index provider. Fragments are flattened so that
 * `<Stagger><><Item/><Item/></></Stagger>` still staggers correctly.
 */
function withIndices(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  let index = 0;

  const walk = (nodes: ReactNode): void => {
    Children.forEach(nodes, (child) => {
      if (child === null || child === undefined || typeof child === 'boolean') {
        // Empty nodes must not consume an index.
        return;
      }
      if (isValidElement(child) && child.type === Fragment) {
        walk((child.props as { children?: ReactNode }).children);
        return;
      }
      const current = index;
      index += 1;
      out.push(
        <StaggerIndexContext.Provider value={current} key={`stagger-${current}`}>
          {child}
        </StaggerIndexContext.Provider>,
      );
    });
  };

  walk(children);
  return out;
}

export function Stagger({ children, stagger = 0.05, delayChildren = 0, className }: StaggerProps) {
  const reduceMotion = useReducedMotion() === true;
  const step = Math.min(stagger, MAX_STAGGER_STEP);

  const timing = useMemo<StaggerTiming>(
    () => ({ stagger: step, delayChildren }),
    [step, delayChildren],
  );

  const variants = useMemo<Variants>(
    () => ({
      hidden: {},
      show: {
        transition: { staggerChildren: step, delayChildren },
      },
    }),
    [step, delayChildren],
  );

  return (
    <StaggerTimingContext.Provider value={timing}>
      <motion.div
        className={className}
        variants={variants}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        {withIndices(children)}
      </motion.div>
    </StaggerTimingContext.Provider>
  );
}

export function StaggerItem({ children, y = 12, duration = 0.4, className }: StaggerItemProps) {
  const reduceMotion = useReducedMotion() === true;
  const timing = useContext(StaggerTimingContext);
  const index = useContext(StaggerIndexContext);

  // The clamped index keeps the whole grid inside a predictable time budget.
  const delay = timing.delayChildren + Math.min(index, MAX_STAGGER_INDEX) * timing.stagger;

  const variants = useMemo<Variants>(
    () => ({
      hidden: { opacity: 0, y },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration, delay, ease: STAGGER_EASE },
      },
    }),
    [y, duration, delay],
  );

  return (
    <motion.div className={className} variants={variants} initial={reduceMotion ? false : undefined}>
      {children}
    </motion.div>
  );
}
