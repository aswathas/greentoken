/**
 * CountUp — animated number readout.
 *
 * Counts from 0 to `value` when it mounts. Numbers are grouped with
 * `Intl.NumberFormat('en-IN')` so 15525 renders as "15,525" (Indian digit
 * grouping).
 *
 * Pass `format` for non-numeric read-outs such as "4.7 t" or "9 / 2"; it
 * receives the animated value and fully replaces the numeric formatting.
 * `prefix` / `suffix` are applied around whichever formatter is used.
 *
 * With reduced motion the final value is shown instantly.
 */
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type BezierDefinition,
} from 'framer-motion';
import { useCallback, useEffect, useMemo } from 'react';

import '../styles/motion.css';

const COUNT_EASE: BezierDefinition = [0.16, 1, 0.3, 1];

export interface CountUpProps {
  /** The number to count up to. */
  value: number;
  /** Number of decimal places (default 0). */
  decimals?: number;
  /** Duration of the count in seconds. */
  duration?: number;
  prefix?: string;
  suffix?: string;
  /** Overrides the built-in numeric formatting. */
  format?: (n: number) => string;
  className?: string;
}

export function CountUp({
  value,
  decimals = 0,
  duration = 1.2,
  prefix = '',
  suffix = '',
  format,
  className,
}: CountUpProps) {
  const reduceMotion = useReducedMotion() === true;
  const counter = useMotionValue(0);

  // The formatter is built once per configuration, never once per frame.
  const numberFormat = useMemo<((n: number) => string) | null>(() => {
    if (format) return format;
    const nf = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return (n: number) => nf.format(n);
  }, [format, decimals]);

  const render = useCallback(
    (n: number) => `${prefix}${numberFormat ? numberFormat(n) : ''}${suffix}`,
    [numberFormat, prefix, suffix],
  );

  const display = useTransform(counter, render);

  useEffect(() => {
    if (reduceMotion) {
      counter.set(value);
      return;
    }
    const controls = animate(counter, value, { duration, ease: COUNT_EASE });
    return () => controls.stop();
  }, [counter, value, duration, reduceMotion]);

  return <motion.span className={className}>{display}</motion.span>;
}
