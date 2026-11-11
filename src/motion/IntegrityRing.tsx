/**
 * IntegrityRing — the signature verification mark.
 *
 * A ring that sweeps in with a stroke-dashoffset animation when the chain
 * verifies (accent green), or breaks into a jagged ring in the danger colour
 * when verification fails. The glyph in the middle is a drawn check mark or
 * exclamation mark (no icon font, no emoji).
 *
 * The animation replays whenever `valid` flips.
 */
import { motion, useReducedMotion, type BezierDefinition } from 'framer-motion';
import { useId } from 'react';

import '../styles/motion.css';

const RING_EASE: BezierDefinition = [0.22, 1, 0.36, 1];

const CENTER = 50;
const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A jagged "broken ring" polygon used for the invalid state. */
function jaggedRingPath(cx: number, cy: number, outer: number, inner: number, spikes: number): string {
  const points: string[] = [];
  const steps = spikes * 2;
  for (let i = 0; i < steps; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 180) * (-90 + (360 / steps) * i);
    points.push(`${round(cx + Math.cos(angle) * radius)} ${round(cy + Math.sin(angle) * radius)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

const JAGGED_RING = jaggedRingPath(CENTER, CENTER, 38, 30, 9);

export interface IntegrityRingProps {
  /** True renders the verified (green, sweeping) ring. */
  valid: boolean;
  label?: string;
  sub?: string;
  /** Rendered size of the ring in pixels (the artwork is 100x100). */
  size?: number;
  className?: string;
}

export function IntegrityRing({ valid, label, sub, size = 96, className }: IntegrityRingProps) {
  const reduceMotion = useReducedMotion() === true;
  const uid = useId();
  const titleId = `${uid}-title`;

  const accessibleLabel = label ?? (valid ? 'Chain integrity verified' : 'Chain integrity broken');
  const rootClass = className ? `integrity-ring ${className}` : 'integrity-ring';

  return (
    <div className={rootClass} data-valid={valid}>
      <svg
        className="integrity-ring__art"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>{accessibleLabel}</title>

        {/* Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={valid ? 'var(--line)' : 'var(--danger)'}
          strokeOpacity={valid ? 1 : 0.25}
          strokeWidth={6}
        />

        {valid ? (
          <motion.circle
            key="sweep"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={reduceMotion ? false : { strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.85, ease: RING_EASE }}
          />
        ) : (
          <motion.path
            key="broken"
            d={JAGGED_RING}
            fill="none"
            stroke="var(--danger)"
            strokeWidth={4}
            strokeLinejoin="round"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: RING_EASE }}
          />
        )}

        {/* Centre glyph */}
        <motion.g
          key={valid ? 'glyph-ok' : 'glyph-bad'}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.32, delay: valid ? 0.55 : 0.2, ease: RING_EASE }}
        >
          {valid ? (
            <path
              d="M 34 50 L 44 60 L 66 38"
              fill="none"
              stroke="var(--accent-strong)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <g>
              <path
                d="M 50 32 L 50 54"
                fill="none"
                stroke="var(--danger)"
                strokeWidth={6}
                strokeLinecap="round"
              />
              <circle cx={50} cy={66} r={3.6} fill="var(--danger)" />
            </g>
          )}
        </motion.g>
      </svg>

      {label ? <div className="integrity-ring__label">{label}</div> : null}
      {sub ? <div className="integrity-ring__sub">{sub}</div> : null}
    </div>
  );
}
