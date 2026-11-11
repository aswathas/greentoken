/**
 * GreenToken — motion layer barrel.
 *
 * Import everything from here:
 *   import { MotionProvider, PageTransition, CountUp } from './motion';
 *
 * The stylesheet is imported by the components themselves, so the motion
 * styles travel with the code no matter how it is imported. It is imported
 * here as well so that using the barrel alone is enough.
 */
import '../styles/motion.css';

export { MotionProvider, type MotionProviderProps } from './MotionProvider';
export { PageTransition, PAGE_EASE, type PageTransitionProps } from './PageTransition';
export { Reveal, type RevealProps } from './Reveal';
export {
  Stagger,
  StaggerItem,
  MAX_STAGGER_INDEX,
  MAX_STAGGER_STEP,
  type StaggerItemProps,
  type StaggerProps,
} from './Stagger';
export { CountUp, type CountUpProps } from './CountUp';
export { Ambient, type AmbientProps } from './Ambient';
export { GrowthScene, type GrowthSceneProps } from './GrowthScene';
export { IntegrityRing, type IntegrityRingProps } from './IntegrityRing';
