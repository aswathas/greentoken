import React, { useMemo, useState } from 'react';
import { useStore } from '../core/store';
import { Button, Card, Field, SectionTitle } from './ui';
import RoleGate from './RoleGate';
import { sha256 } from '../core/crypto';
import { CARBON_PER_SPECIES, CO2_RATES_NOTE } from '../core/chaincode';
import { photoDataUrl } from '../core/seed';
import {
  GeoCaptureError,
  checkGeolocationPermission,
  detectLocation,
  geoFailureFor,
  type GeoFailure,
  type GeoFix,
} from '../core/geo';

const DISTRICTS: Record<string, string[]> = {
  Karnataka: ['Mandya', 'Chamarajanagar', 'Dakshina Kannada', 'Mysuru'],
  Maharashtra: ['Nashik', 'Nagpur', 'Pune', 'Amravati'],
  'Tamil Nadu': ['Coimbatore', 'Dharmapuri', 'Erode', 'Nilgiris'],
  Bihar: ['Patna', 'Nalanda', 'Gaya', 'Muzaffarpur'],
  'Uttar Pradesh': ['Bijnor', 'Gorakhpur', 'Varanasi', 'Bareilly'],
  Kerala: ['Idukki', 'Wayanad', 'Palakkad', 'Thrissur'],
  'West Bengal': ['Howrah', 'Darjeeling', 'Malda', 'Jalpaiguri'],
  Gujarat: ['Anand', 'Surat', 'Junagadh', 'Bhavnagar'],
};

/** How each fix source is worded in the read-out — a reviewer must be able to
 *  tell a real GPS fix from a coarse network guess at a glance. */
const GEO_SOURCE_LABEL: Record<GeoFix['source'], string> = {
  gps: 'GPS',
  network: 'Network estimate',
  cached: 'Cached fix',
};

export default function PlantTree() {
  const { current, plantTree, pushToast } = useStore();
  const isPlanter = current?.org === 'PLANTER';

  const [species, setSpecies] = useState('Mango');
  const [count, setCount] = useState(10);
  const [state, setState] = useState('Karnataka');
  const [district, setDistrict] = useState('Mandya');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [accuracy, setAccuracy] = useState(12);
  const [photo, setPhoto] = useState<{ dataUrl: string; sha256: string; bytes: number; mime: string } | null>(null);
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [geoState, setGeoState] = useState<'idle' | 'capturing' | 'ok' | 'failed'>('idle');
  const [geoFix, setGeoFix] = useState<GeoFix | null>(null);
  const [geoFailure, setGeoFailure] = useState<GeoFailure | null>(null);

  const co2 = useMemo(() => (CARBON_PER_SPECIES[species] ?? 20) * count, [species, count]);

  async function handleFile(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const hash = await sha256(dataUrl);
    setPhoto({ dataUrl, sha256: hash, bytes: file.size, mime: file.type || 'image/jpeg' });
  }

  async function captureLocation() {
    setGeoState('capturing');
    setGeoFailure(null);
    try {
      // 1. If location is already blocked, do not touch the geolocation API —
      //    it would fail instantly and leave the user with no way forward.
      const permission = await checkGeolocationPermission();
      if (permission === 'denied') {
        throw new GeoCaptureError(geoFailureFor('permission-denied'));
      }

      // 2. High-accuracy fix first. It times out often indoors / on a weak
      //    signal, so a timeout is retried once with a low-accuracy fix, which
      //    usually lands within a second or two from the network or cell tower.
      let fix: GeoFix;
      try {
        fix = await detectLocation({ highAccuracy: true, timeoutMs: 10000 });
      } catch (err) {
        if (err instanceof GeoCaptureError && err.failure.kind === 'timeout') {
          fix = await detectLocation({ highAccuracy: false, timeoutMs: 8000 });
        } else {
          throw err;
        }
      }

      setLat(fix.lat.toFixed(6));
      setLng(fix.lng.toFixed(6));
      setAccuracy(Math.round(fix.accuracyM));
      setGeoFix(fix);
      setGeoState('ok');
      pushToast(
        'success',
        `Geo-stamp captured — ${GEO_SOURCE_LABEL[fix.source]} ±${Math.round(fix.accuracyM)} m.`,
      );
    } catch (err) {
      const failure = err instanceof GeoCaptureError ? err.failure : geoFailureFor('unknown');
      setGeoFailure(failure);
      setGeoState('failed');
      pushToast('error', failure.title);
    }
  }

  async function submit() {
    if (!photo) {
      pushToast('error', 'Attach a photo — its SHA-256 hash is the core of the proof.');
      return;
    }
    if (!lat || !lng) {
      pushToast('error', 'Capture or enter the planting coordinates.');
      return;
    }
    setBusy(true);
    await plantTree({
      planterId: current!.id,
      planterName: current!.name,
      planterOrg: current!.orgName,
      district,
      state,
      species,
      count: Number(count),
      geo: {
        lat: Number(lat),
        lng: Number(lng),
        accuracyMeters: Number(accuracy),
        capturedAt: new Date().toISOString(),
      },
      photo: {
        sha256: photo.sha256,
        byteLength: photo.bytes,
        mimeType: photo.mime,
        dataUrl: photo.dataUrl,
      },
      privateContact: contact,
    });
    setBusy(false);
  }

  if (!isPlanter) {
    return (
      <Card className="card--pad">
        <RoleGate
          action="Planting a tree"
          allows={['PLANTER']}
          reason="Only the planters association may submit a planting proof — the chaincode rejects the transaction from any other organisation, so the geo-stamp and the photo hash would never reach the ledger."
        />
      </Card>
    );
  }

  return (
    <div className="grid grid--2">
      <div className="col-span-7">
        <Card>
          <SectionTitle
            title="Submit a planting proof"
            sub="Photo + GPS together form the evidence. Both are hashed onto the ledger; the image stays with the planter."
          />

          <div className="form">
            <div className="form__row">
              <Field label="Species" hint={`${CARBON_PER_SPECIES[species]} kg CO₂ / tree / year`}>
                <select value={species} onChange={(e) => setSpecies(e.target.value)}>
                  {Object.keys(CARBON_PER_SPECIES).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Number of trees">
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="form__row">
              <Field label="State">
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setDistrict(DISTRICTS[e.target.value][0]);
                  }}
                >
                  {Object.keys(DISTRICTS).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="District">
                <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  {DISTRICTS[state].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field
              label="Photo proof"
              hint="The image is hashed with SHA-256 — change one pixel later and the hash will not match."
            >
              <div
                className={`dropzone ${photo ? 'has-file' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handleFile(f);
                }}
                onClick={() => document.getElementById('photo-input')?.click()}
              >
                {photo ? (
                  <>
                    <img src={photo.dataUrl} alt="Planting proof" className="dropzone__img" />
                    <div className="dropzone__meta">
                      <strong>{(photo.bytes / 1024).toFixed(1)} KB · {photo.mime}</strong>
                      <code className="mono-xs">sha256: {photo.sha256.slice(0, 32)}…</code>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dropzone__icon">📷</div>
                    <strong>Drop a planting photo or click to upload</strong>
                    <span>JPG / PNG — this becomes the token's evidence of work</span>
                  </>
                )}
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
              </div>
            </Field>

            <Field
              label="Geo-stamp"
              hint="Captured at planting time. Accuracy is recorded and reviewers can reject poor GPS."
            >
              <div className="geo">
                <Button
                  variant="soft"
                  onClick={() => void captureLocation()}
                  disabled={geoState === 'capturing'}
                >
                  {geoState === 'capturing'
                    ? 'Capturing…'
                    : geoState === 'ok'
                      ? '✓ GPS captured'
                      : '📍 Use my GPS'}
                </Button>
                <input
                  className="geo__input"
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => {
                    setLat(e.target.value);
                    setGeoFix(null);
                    setGeoState((s) => (s === 'ok' ? 'idle' : s));
                  }}
                />
                <input
                  className="geo__input"
                  placeholder="Longitude"
                  value={lng}
                  onChange={(e) => {
                    setLng(e.target.value);
                    setGeoFix(null);
                    setGeoState((s) => (s === 'ok' ? 'idle' : s));
                  }}
                />
                <input
                  className="geo__input geo__input--sm"
                  placeholder="±m"
                  value={accuracy}
                  onChange={(e) => setAccuracy(Number(e.target.value))}
                />
              </div>

              {geoState === 'ok' && geoFix && (
                <div className="geo__readout">
                  <span
                    className={`pill ${geoFix.source === 'gps' ? 'pill--ok' : 'pill--warn'} geo__badge`}
                  >
                    {GEO_SOURCE_LABEL[geoFix.source]} ±{Math.round(geoFix.accuracyM)} m
                  </span>
                  <span className="geo__coords mono-xs">
                    {geoFix.lat.toFixed(6)}, {geoFix.lng.toFixed(6)}
                  </span>
                  <span className="geo__time mono-xs">
                    {new Date(geoFix.capturedAt).toLocaleTimeString()}
                  </span>
                  <button
                    type="button"
                    className="btn btn--soft btn--sm geo__recapture"
                    onClick={() => void captureLocation()}
                  >
                    Re-capture
                  </button>
                </div>
              )}

              {geoFailure && (
                <div className="geo__hint" role="alert">
                  <div className="geo__hint-head">
                    <strong className="geo__hint-title">{geoFailure.title}</strong>
                    <button
                      type="button"
                      className="btn btn--soft btn--sm geo__hint-close"
                      aria-label="Dismiss"
                      onClick={() => setGeoFailure(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <span className="geo__hint-detail">{geoFailure.detail}</span>
                  <div className="geo__hint-actions">
                    {geoFailure.canRetry && (
                      <Button variant="soft" small onClick={() => void captureLocation()}>
                        Try again
                      </Button>
                    )}
                    {geoFailure.canEnterManually && (
                      <span className="geo__hint-note">
                        …or type the coordinates into the fields above.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <span className="field__hint">
                Decimal degrees, e.g. 9.9816, 77.0098 (Idukki, Kerala)
              </span>
            </Field>

            <Field label="Contact (never stored on-chain)" hint="Collected for settlement, then discarded — it is not written to the ledger, not hashed, and not returned by any read function.">
              <input
                placeholder="+91 …"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </Field>

            <div className="form__summary">
              <div>
                <span>Estimated CO₂</span>
                <strong>{co2} kg / year</strong>
              </div>
              <div>
                <span>Token value (once verified)</span>
                <strong>₹{count * 150}</strong>
              </div>
              <div>
                <span>Co2 formula</span>
                <strong className="mono-xs">{CO2_RATES_NOTE}</strong>
              </div>
            </div>

            <Button full onClick={submit} disabled={busy}>
              {busy ? 'Submitting to the ledger…' : '🌱 Submit planting proof'}
            </Button>
          </div>
        </Card>
      </div>

      <div className="col-span-5">
        <Card>
          <SectionTitle title="What happens on submit" sub="The PlantTree chaincode function." />
          <ol className="steps">
            <li>
              <strong>Validate</strong>
              <span>Species must exist in the carbon registry; count ≥ 1; geo-stamp and photo hash are mandatory.</span>
            </li>
            <li>
              <strong>Hash</strong>
              <span>SHA-256 over the photo bytes and over the geo payload are computed and written to world state.</span>
            </li>
            <li>
              <strong>Create</strong>
              <span>A new token <code>GT-xxxxxx</code> is written with status PENDING and indexed by district, species, status and planter.</span>
            </li>
            <li>
              <strong>Emit</strong>
              <span>A <code>PlantTree</code> event is published to the event stream — visible live on the dashboard.</span>
            </li>
            <li>
              <strong>Wait</strong>
              <span>The token needs {2} independent endorsements before it can be funded.</span>
            </li>
          </ol>
        </Card>

        <Card className="mt">
          <SectionTitle title="Try it without a photo" sub="Generates a synthetic proof image so you can demo instantly." />
          <Button
            variant="ghost"
            full
            onClick={async () => {
              const url = photoDataUrl(species, `${species} · ${district}`, Math.floor(Math.random() * 5));
              const hash = await sha256(url);
              setPhoto({ dataUrl: url, sha256: hash, bytes: url.length, mime: 'image/svg+xml' });
              if (!lat) {
                setLat((12.3 + Math.random() * 6).toFixed(6));
                setLng((76.5 + Math.random() * 5).toFixed(6));
              }
              pushToast('success', 'Sample proof generated — adjust the coordinates if you like.');
            }}
          >
            ⚡ Generate sample proof
          </Button>
        </Card>
      </div>
    </div>
  );
}
