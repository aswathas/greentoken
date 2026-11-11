/**
 * Ambient — decorative background layer of slowly drifting leaves.
 *
 * The layer is purely decorative: it is absolutely positioned over its host,
 * never intercepts pointer events and is hidden from assistive technology.
 * The drift itself is a CSS animation (see src/styles/motion.css) so the
 * browser can run it off the main thread.
 *
 * The layer pauses whenever the tab is hidden, and renders nothing at all when
 * the user prefers reduced motion.
 */
import { useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import '../styles/motion.css';

export interface AmbientProps {
  /** Number of drifting particles (default 7). */
  leaves?: number;
  className?: string;
}

/** Inline custom properties need a widened style type. */
type LeafStyle = CSSProperties & {
  [key: `--${string}`]: string | number;
};

interface Leaf {
  id: string;
  shape: 'leaf' | 'round';
  style: LeafStyle;
}

const DEFAULT_LEAVES = 7;
const MAX_LEAVES = 24;

/**
 * Small deterministic PRNG (mulberry32) so the particle layout is identical on
 * every render and on the server.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLeaves(count: number): Leaf[] {
  const total = Math.max(0, Math.min(Math.round(count), MAX_LEAVES));
  const random = mulberry32(0x67f1a2b3);
  const leaves: Leaf[] = [];

  for (let i = 0; i < total; i += 1) {
    const size = 60 + random() * 120; // 60–180px
    const duration = 20 + random() * 40; // 20–60s per cycle
    const delay = -(random() * duration); // negative → particles start mid-flight
    const left = random() * 100;
    const top = random() * 100;
    const alpha = 0.04 + random() * 0.08; // 4–12%
    const drift = 18 + random() * 46;
    const rotation = random() * 360;

    leaves.push({
      id: `ambient-leaf-${i}`,
      shape: random() > 0.35 ? 'leaf' : 'round',
      style: {
        '--x': `${left.toFixed(2)}%`,
        '--y': `${top.toFixed(2)}%`,
        '--size': `${size.toFixed(1)}px`,
        '--dur': `${duration.toFixed(1)}s`,
        '--delay': `${delay.toFixed(1)}s`,
        '--alpha': alpha.toFixed(3),
        '--drift': `${drift.toFixed(1)}px`,
        '--rot': `${rotation.toFixed(1)}deg`,
      },
    });
  }

  return leaves;
}

export function Ambient({ leaves = DEFAULT_LEAVES, className }: AmbientProps) {
  const reduceMotion = useReducedMotion() === true;
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVisibilityChange = () => {
      setPaused(document.visibilityState === 'hidden');
    };
    onVisibilityChange();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const particles = useMemo(() => buildLeaves(leaves), [leaves]);

  if (reduceMotion) {
    return null;
  }

  const rootClass = ['ambient'];
  if (paused) rootClass.push('ambient--paused');
  if (className) rootClass.push(className);

  return (
    <div className={rootClass.join(' ')} aria-hidden="true">
      {particles.map((leaf) => (
        <span
          key={leaf.id}
          className={`ambient__leaf ambient__leaf--${leaf.shape}`}
          style={leaf.style}
        />
      ))}
    </div>
  );
}
