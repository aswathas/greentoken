/**
 * Geolocation capture for the planting geo-stamp.
 *
 * The browser's Geolocation API fails in several distinct ways and every one of
 * them used to be reported to the user as "permission denied", which is both
 * wrong and unactionable. This module wraps the raw API in a typed promise and
 * maps each failure mode onto a `GeoFailure` that says what went wrong and what
 * the user can do about it.
 */

export type GeoErrorKind =
  | 'unsupported-browser' // no navigator.geolocation at all
  | 'insecure-context' // not a secure origin
  | 'permission-denied' // user or policy blocked it
  | 'position-unavailable' // no fix could be obtained
  | 'timeout' // took too long
  | 'unknown';

export type GeoSource = 'gps' | 'network' | 'cached';

export interface GeoFix {
  lat: number;
  lng: number;
  accuracyM: number; // metres
  capturedAt: string; // ISO
  source: GeoSource;
}

export interface GeoFailure {
  kind: GeoErrorKind;
  title: string; // short headline, e.g. "Location permission blocked"
  detail: string; // one or two sentences the user can act on
  canRetry: boolean;
  canEnterManually: boolean;
}

/** Thrown by {@link detectLocation} — carries the actionable copy. */
export class GeoCaptureError extends Error {
  readonly failure: GeoFailure;

  constructor(failure: GeoFailure) {
    super(`${failure.title} — ${failure.detail}`);
    this.name = 'GeoCaptureError';
    this.failure = failure;
  }
}

/* ------------------------------------------------------------------ *
 * Tuning
 * ------------------------------------------------------------------ */

/** A fix cached within the last minute is good enough — forcing a brand new
 *  fix (`maximumAge: 0`) routinely times out on desktops and indoors. */
const MAXIMUM_AGE_MS = 60_000;

/** A fix older than this was served from the cache rather than measured now. */
const CACHED_AFTER_MS = 20_000;

/** Accuracy at or below this is a real GPS-quality fix. */
const GPS_ACCURACY_M = 50;

/** Beyond this the reading is noise, not a position. */
const MAX_PLAUSIBLE_ACCURACY_M = 100_000;

/* ------------------------------------------------------------------ *
 * Failure copy — one place, so the UI never invents its own wording
 * ------------------------------------------------------------------ */

const FAILURE_COPY: Record<GeoErrorKind, Omit<GeoFailure, 'kind'>> = {
  'unsupported-browser': {
    title: 'This browser cannot read your location',
    detail:
      'The Geolocation API is not available here, so the device cannot supply a fix. Use a current Chrome, Edge, Safari or Firefox build, or type the planting coordinates manually.',
    canRetry: false,
    canEnterManually: true,
  },
  'insecure-context': {
    title: 'Location needs a secure (HTTPS) page',
    detail:
      'Browsers only expose the Geolocation API on a secure origin — https:// works, and http://localhost is treated as secure for local testing, but http://192.168.x.x is not. Reload the demo over https:// or type the planting coordinates manually.',
    canRetry: false,
    canEnterManually: true,
  },
  'permission-denied': {
    title: 'Location permission blocked',
    detail:
      'This site is not allowed to use your location. Open the padlock / permissions icon in the address bar → Site settings → Location → Allow, then press “Try again”. You can also type the planting coordinates manually.',
    canRetry: true,
    canEnterManually: true,
  },
  'position-unavailable': {
    title: 'No position fix available',
    detail:
      'The device could not work out where it is — the GPS signal is too weak (indoors, between tall buildings) or the device location service is switched off. Step outside or turn on device location services, then press “Try again”, or type the planting coordinates manually.',
    canRetry: true,
    canEnterManually: true,
  },
  timeout: {
    title: 'Timed out waiting for a location fix',
    detail:
      'The device did not return a position in time — common indoors, on a weak signal, or while the GPS chip warms up. We already retried once with a faster low-accuracy fix. Move to an open area or enable device location services and press “Try again”, or type the planting coordinates manually.',
    canRetry: true,
    canEnterManually: true,
  },
  unknown: {
    title: 'Location capture failed',
    detail:
      'The browser returned an unexpected error while reading the location. Press “Try again”; if it keeps failing, type the planting coordinates manually or open the demo in another browser.',
    canRetry: true,
    canEnterManually: true,
  },
};

/** Build the actionable failure payload for a given error kind. */
export function geoFailureFor(kind: GeoErrorKind): GeoFailure {
  return { kind, ...FAILURE_COPY[kind] };
}

/* ------------------------------------------------------------------ *
 * Permission pre-check
 * ------------------------------------------------------------------ */

/**
 * Ask the browser whether location is already allowed, blocked, or still
 * undecided. Returns `'unsupported'` when the Permissions API cannot answer
 * (older browsers, or Firefox, which does not expose a `geolocation`
 * permission descriptor) — that is not a failure, it just means we have to
 * try the capture and read the real error code.
 */
export async function checkGeolocationPermission(): Promise<PermissionState | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported';
  const permissions = navigator.permissions;
  if (!permissions || typeof permissions.query !== 'function') return 'unsupported';
  try {
    const status = await permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

/* ------------------------------------------------------------------ *
 * Capture
 * ------------------------------------------------------------------ */

/** GeolocationPositionError.code → our error kind. */
function kindFromPositionError(err: unknown): GeoErrorKind {
  const code = (err as GeolocationPositionError | undefined)?.code;
  switch (code) {
    case 1:
      return 'permission-denied';
    case 2:
      return 'position-unavailable';
    case 3:
      return 'timeout';
    default:
      return 'unknown';
  }
}

/**
 * Read one position fix from the device.
 *
 * Rejects with a {@link GeoCaptureError} carrying actionable copy for every
 * failure mode — including a high-accuracy request that times out, a
 * non-secure origin, and a browser with no Geolocation API.
 */
export async function detectLocation(opts: { highAccuracy?: boolean; timeoutMs?: number } = {}): Promise<GeoFix> {
  const highAccuracy = opts.highAccuracy ?? true;
  const timeoutMs = opts.timeoutMs ?? 10_000;

  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new GeoCaptureError(geoFailureFor('insecure-context'));
  }

  if (typeof navigator === 'undefined' || typeof navigator.geolocation?.getCurrentPosition !== 'function') {
    throw new GeoCaptureError(geoFailureFor('unsupported-browser'));
  }

  let position: GeolocationPosition;
  try {
    position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: MAXIMUM_AGE_MS },
      );
    });
  } catch (err) {
    throw new GeoCaptureError(geoFailureFor(kindFromPositionError(err)));
  }

  const coords: GeolocationCoordinates | undefined = position?.coords;
  if (!coords) {
    throw new GeoCaptureError(geoFailureFor('position-unavailable'));
  }

  const { latitude, longitude, accuracy } = coords;
  const badLat = !Number.isFinite(latitude) || latitude < -90 || latitude > 90;
  const badLng = !Number.isFinite(longitude) || longitude < -180 || longitude > 180;
  const badAccuracy =
    !Number.isFinite(accuracy) || accuracy < 0 || accuracy > MAX_PLAUSIBLE_ACCURACY_M;
  if (badLat || badLng || badAccuracy) {
    throw new GeoCaptureError(geoFailureFor('position-unavailable'));
  }

  const timestamp = position.timestamp;
  const measuredAt = Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
  const ageMs = Date.now() - measuredAt;

  let source: GeoSource;
  if (ageMs > CACHED_AFTER_MS) source = 'cached';
  else if (accuracy <= GPS_ACCURACY_M) source = 'gps';
  else source = 'network';

  return {
    lat: latitude,
    lng: longitude,
    accuracyM: accuracy,
    capturedAt: new Date(measuredAt).toISOString(),
    source,
  };
}
