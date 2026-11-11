/**
 * GrowthScene — the GreenToken story in a single, loop-free SVG timeline.
 *
 * The scene plays once on mount (~2.2s) and tells the whole project story:
 *
 *   1. a seed drops into the soil and the stem grows upward
 *   2. the leaves unfurl
 *   3. a hexagonal token outline draws in above the tree
 *   4. the token fills with the accent colour and a check mark is drawn
 *   5. ledger blocks tick into a row underneath, linking tree -> token -> block
 *
 * Every colour comes from a theme custom property, so the scene re-themes
 * itself automatically. Under reduced motion the scene renders its final state
 * statically — no animation at all.
 */
import { motion, useReducedMotion, type BezierDefinition, type Target, type Variants } from 'framer-motion';
import { useId, useMemo } from 'react';

import '../styles/motion.css';

const SCENE_EASE: BezierDefinition = [0.22, 1, 0.36, 1];
const SCENE_EASE_IN: BezierDefinition = [0.55, 0, 1, 0.45];

/* ------------------------------------------------------------------ */
/* geometry helpers                                                     */
/* ------------------------------------------------------------------ */

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A symmetric leaf blade whose stem end sits at (bx, by). */
function leafPath(bx: number, by: number, length: number, angleDeg: number): string {
  const angle = (angleDeg * Math.PI) / 180;
  const spread = (32 * Math.PI) / 180;
  const tipX = bx + Math.cos(angle) * length;
  const tipY = by + Math.sin(angle) * length;
  const c1x = bx + Math.cos(angle - spread) * length * 0.55;
  const c1y = by + Math.sin(angle - spread) * length * 0.55;
  const c2x = bx + Math.cos(angle + spread) * length * 0.55;
  const c2y = by + Math.sin(angle + spread) * length * 0.55;
  return [
    `M ${round(bx)} ${round(by)}`,
    `Q ${round(c1x)} ${round(c1y)} ${round(tipX)} ${round(tipY)}`,
    `Q ${round(c2x)} ${round(c2y)} ${round(bx)} ${round(by)}`,
    'Z',
  ].join(' ');
}

/** Pointy-top regular hexagon centred on (cx, cy). */
function hexagonPath(cx: number, cy: number, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 90);
    points.push(`${round(cx + Math.cos(angle) * radius)} ${round(cy + Math.sin(angle) * radius)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

/* ------------------------------------------------------------------ */
/* variant factories                                                    */
/* ------------------------------------------------------------------ */

function stage(
  from: Target,
  to: Target,
  delay: number,
  duration: number,
  ease: BezierDefinition = SCENE_EASE,
): Variants {
  return {
    hidden: { ...from },
    show: { ...to, transition: { delay, duration, ease } },
  };
}

function fadeIn(delay: number, duration = 0.35): Variants {
  return stage({ opacity: 0 }, { opacity: 1 }, delay, duration);
}

function drawOn(delay: number, duration = 0.45): Variants {
  return stage({ pathLength: 0 }, { pathLength: 1 }, delay, duration);
}

function dropIn(delay: number, duration = 0.42): Variants {
  return stage({ opacity: 0, y: -170 }, { opacity: 1, y: 0 }, delay, duration, SCENE_EASE_IN);
}

function unfurl(delay: number, fromAngle: number, duration = 0.42): Variants {
  return stage(
    { opacity: 0, scale: 0.25, rotate: fromAngle },
    { opacity: 1, scale: 1, rotate: 0 },
    delay,
    duration,
  );
}

function tickIn(delay: number, duration = 0.28): Variants {
  return stage(
    { opacity: 0, y: -10, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1 },
    delay,
    duration,
  );
}

/* ------------------------------------------------------------------ */
/* static scene data                                                    */
/* ------------------------------------------------------------------ */

const SOIL_CURVE = 'M 46 252 Q 160 234 274 252';
const SOIL_FILL = `${SOIL_CURVE} L 274 260 L 46 260 Z`;
const STEM = 'M 160 240 C 155 212 167 172 160 132';
const BRANCH_LEFT = 'M 160 188 C 142 184 128 172 118 152';
const BRANCH_RIGHT = 'M 160 174 C 178 170 192 158 202 138';
const BRANCH_TOP = 'M 160 148 C 150 144 142 134 136 124';
const TOKEN_LINK = 'M 160 100 L 160 128';
const LEDGER_LINK = 'M 160 256 L 160 270';
const LEDGER_CHAIN = 'M 76 270 L 244 270';
const CHECK_MARK = 'M 146 60 L 155 69 L 175 47';

const HEXAGON = hexagonPath(160, 60, 40);

const LEAVES = [
  { d: leafPath(118, 152, 34, 200), delay: 1.0, from: -30 },
  { d: leafPath(140, 180, 26, 188), delay: 1.06, from: 26 },
  { d: leafPath(202, 138, 36, -18), delay: 1.12, from: -28 },
  { d: leafPath(180, 164, 26, -6), delay: 1.18, from: 24 },
  { d: leafPath(136, 124, 24, 214), delay: 1.24, from: -26 },
];

const BLOCKS = [
  { x: 88, delay: 1.88 },
  { x: 126, delay: 1.925 },
  { x: 164, delay: 1.97 },
  { x: 202, delay: 2.015 },
];

export interface GrowthSceneProps {
  className?: string;
  /** Hides the scene from assistive technology (purely decorative use). */
  decorative?: boolean;
  title?: string;
  desc?: string;
}

export function GrowthScene({
  className,
  decorative = false,
  title = 'A tree grows into a verifiable carbon token',
  desc = 'A seed drops into the soil, a stem grows and unfurls leaves, a hexagonal token is drawn above the tree and filled with a check mark, and ledger blocks tick into a row underneath.',
}: GrowthSceneProps) {
  const reduceMotion = useReducedMotion() === true;
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const initial = reduceMotion ? false : 'hidden';

  const rootVariants = useMemo<Variants>(
    () => ({
      hidden: {},
      show: { transition: { staggerChildren: 0.08, delayChildren: 0 } },
    }),
    [],
  );

  return (
    <motion.svg
      className={className ? `growth-scene ${className}` : 'growth-scene'}
      viewBox="0 0 320 300"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : `${titleId} ${descId}`}
      variants={rootVariants}
      initial={initial}
      animate="show"
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{desc}</desc>

      {/* 1 — soil */}
      <motion.path d={SOIL_FILL} fill="var(--accent-tint)" variants={fadeIn(0, 0.35)} />
      <motion.path
        d={SOIL_CURVE}
        fill="none"
        stroke="var(--accent-strong)"
        strokeWidth={2.5}
        strokeLinecap="round"
        variants={fadeIn(0.05, 0.35)}
      />

      {/* 2 — seed dropping, stem growing */}
      <motion.ellipse
        cx={160}
        cy={238}
        rx={6}
        ry={8}
        fill="var(--accent-strong)"
        variants={dropIn(0.12)}
      />
      <motion.path
        d={STEM}
        fill="none"
        stroke="var(--accent-strong)"
        strokeWidth={5}
        strokeLinecap="round"
        variants={drawOn(0.48, 0.5)}
      />
      <motion.path
        d={BRANCH_LEFT}
        fill="none"
        stroke="var(--accent-strong)"
        strokeWidth={3.5}
        strokeLinecap="round"
        variants={drawOn(0.78, 0.32)}
      />
      <motion.path
        d={BRANCH_RIGHT}
        fill="none"
        stroke="var(--accent-strong)"
        strokeWidth={3.5}
        strokeLinecap="round"
        variants={drawOn(0.84, 0.32)}
      />
      <motion.path
        d={BRANCH_TOP}
        fill="none"
        stroke="var(--accent-strong)"
        strokeWidth={3}
        strokeLinecap="round"
        variants={drawOn(0.9, 0.32)}
      />

      {/* 3 — leaves unfurling */}
      {LEAVES.map((leaf) => (
        <motion.path
          key={leaf.d}
          d={leaf.d}
          fill="var(--accent-tint)"
          stroke="var(--accent-strong)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          variants={unfurl(leaf.delay, leaf.from)}
        />
      ))}

      {/* 4 — the token: outline, fill, check mark.
          The fill is painted before the outline so the stroke stays on top. */}
      <motion.path
        d={TOKEN_LINK}
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth={1.5}
        variants={drawOn(1.22, 0.25)}
      />
      <motion.path
        d={HEXAGON}
        fill="var(--accent)"
        stroke="none"
        variants={stage({ fillOpacity: 0 }, { fillOpacity: 1 }, 1.56, 0.3)}
      />
      <motion.path
        d={HEXAGON}
        fill="none"
        stroke="var(--accent-strong)"
        strokeWidth={3}
        strokeLinejoin="round"
        variants={drawOn(1.26, 0.45)}
      />
      <motion.path
        d={CHECK_MARK}
        fill="none"
        stroke="var(--surface)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={drawOn(1.7, 0.28)}
      />

      {/* 5 — the ledger row */}
      <motion.path
        d={LEDGER_LINK}
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth={1.5}
        variants={drawOn(1.84, 0.2)}
      />
      <motion.path
        d={LEDGER_CHAIN}
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth={1.5}
        variants={drawOn(1.76, 0.3)}
      />
      {BLOCKS.map((block) => (
        <motion.rect
          key={block.x}
          x={block.x}
          y={274}
          width={30}
          height={12}
          rx={3}
          fill="var(--surface-2)"
          stroke="var(--line-strong)"
          strokeWidth={1}
          variants={tickIn(block.delay)}
        />
      ))}
    </motion.svg>
  );
}
