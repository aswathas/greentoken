/**
 * Seed data — the demo's initial consortium and ledger history.
 *
 * The seeded blocks are NOT hand-written. Every seeded token is produced by
 * actually invoking the chaincode (PlantTree -> VerifyPlanting -> FundTokens
 * -> SettleFunding), so the hashes, endorsements and signatures on screen are
 * genuine and independently verifiable with verifyChain().
 */

import { type Participant, type OrgId } from './types';
import { generateKeyPair, sha256 } from './crypto';
import { GreenTokenLedger } from './ledger';
import { type CallerContext } from './chaincode';

interface PersonSpec {
  id: string;
  name: string;
  org: OrgId;
  role: string;
}

export const SEED_PEOPLE: PersonSpec[] = [
  { id: 'p-lakshmi', name: 'Lakshmi Gowda', org: 'PLANTER', role: 'FPO Coordinator' },
  { id: 'p-ravi', name: 'Ravi Patil', org: 'PLANTER', role: 'Farmer' },
  { id: 'p-sunita', name: 'Sunita Devi', org: 'PLANTER', role: 'Self Help Group Lead' },
  { id: 'p-imran', name: 'Imran Sheikh', org: 'PLANTER', role: 'Farmer' },
  { id: 'p-meena', name: 'Meena Kumari', org: 'PLANTER', role: 'Nursery Owner' },
  { id: 'p-kavita', name: 'Kavita Reddy', org: 'PLANTER', role: 'Farmer' },
  { id: 'p-deepak', name: 'Deepak Joshi', org: 'PLANTER', role: 'Farmer' },
  { id: 'p-arjun', name: 'Arjun Nair', org: 'PLANTER', role: 'Forest Right Holder' },
  { id: 'p-ramesh', name: 'Ramesh Yadav', org: 'PLANTER', role: 'Farmer' },
  { id: 'v-raghavan', name: 'Dr. S. Raghavan', org: 'VERIFIER', role: 'Chief Forest Officer' },
  { id: 'v-desh', name: 'Anjali Deshmukh', org: 'VERIFIER', role: 'District Forest Officer' },
  { id: 'a-kapoor', name: 'Nikhil Kapoor', org: 'AUDITOR', role: 'Independent Carbon Auditor' },
  { id: 'f-tata', name: 'Aarav Menon', org: 'FUNDER', role: 'ESG Head, Tata Consumer' },
  { id: 'f-infy', name: 'Priya Nair', org: 'FUNDER', role: 'CSR Lead, Infosys Foundation' },
];

export const SEED_ORG_NAMES: Record<OrgId, string> = {
  PLANTER: 'Sahyadri Planters Association',
  VERIFIER: 'State Forest Department',
  FUNDER: 'Corporate Green Funders',
  AUDITOR: 'Independent Carbon Auditor',
};

/**
 * Procedurally drawn "photo proof" so every token has a real image + hash.
 *
 * The contract rejects a photo that was already submitted, so every generated
 * image must be byte-unique. `nonce` is mixed into the SVG: the seeded tokens
 * pass a stable nonce (the demo stays reproducible), while the UI's "generate
 * sample proof" button omits it and therefore gets a fresh random one on every
 * click — a newly generated sample is never mistaken for a photo that is
 * already on the ledger.
 */
export function photoDataUrl(
  species: string,
  label: string,
  tone: number,
  nonce?: string,
): string {
  const sky = ['#0b3d2e', '#0d4f3a', '#12603f', '#0a4433', '#146b4a'][tone % 5];
  const leaf = ['#2fbf71', '#37c978', '#27a862', '#3fd18a', '#22b066'][tone % 5];
  const ground = ['#1d3b2a', '#20422f', '#1a3526', '#24492f', '#1f3d2b'][tone % 5];
  const trunk = '#6b4f2a';
  const unique = nonce ?? Math.random().toString(36).slice(2, 12);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" id="gt-${unique}" width="640" height="420" viewBox="0 0 640 420">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky}"/><stop offset="100%" stop-color="${ground}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" fill="url(#s)"/>
  <circle cx="540" cy="80" r="42" fill="#f4f7c8" opacity="0.85"/>
  <path d="M0 330 Q160 292 320 318 T640 306 L640 420 L0 420 Z" fill="${ground}"/>
  <rect x="306" y="196" width="20" height="122" rx="4" fill="${trunk}"/>
  <ellipse cx="316" cy="168" rx="86" ry="72" fill="${leaf}"/>
  <ellipse cx="252" cy="196" rx="54" ry="44" fill="${leaf}" opacity="0.92"/>
  <ellipse cx="382" cy="198" rx="56" ry="46" fill="${leaf}" opacity="0.88"/>
  <ellipse cx="316" cy="118" rx="52" ry="42" fill="${leaf}" opacity="0.95"/>
  <circle cx="278" cy="352" r="9" fill="#2fbf71" opacity="0.5"/>
  <circle cx="356" cy="366" r="7" fill="#2fbf71" opacity="0.45"/>
  <text x="18" y="36" font-family="ui-monospace,Menlo,monospace" font-size="17" fill="#c7ffe0" opacity="0.95">${label}</text>
  <text x="18" y="60" font-family="ui-monospace,Menlo,monospace" font-size="13" fill="#9fe3bd" opacity="0.8">GPS-stamped planting evidence</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface PlantSpec {
  planterId: string;
  district: string;
  state: string;
  species: string;
  count: number;
  lat: number;
  lng: number;
  accuracy: number;
  verify?: { by: string[]; note: string } | 'reject';
  fund?: { by: string; units: number; settle?: boolean };
}

/**
 * Seeded planting proofs.
 *
 * Every token that must reach VERIFIED gets ONE endorsement from the State
 * Forest Department (v-raghavan or v-desh) and ONE from the Independent
 * Carbon Auditor (a-kapoor) — the contract's quorum spans two DISTINCT
 * organisations, so no token may collect two Forest Department reviews.
 */
const PLANTS: PlantSpec[] = [
  {
    planterId: 'p-lakshmi', district: 'Mandya', state: 'Karnataka', species: 'Mango',
    count: 12, lat: 12.5218, lng: 76.8951, accuracy: 8,
    verify: { by: ['v-raghavan', 'a-kapoor'], note: 'Saplings verified in person against the geo-stamp.' },
    fund: { by: 'f-tata', units: 12, settle: true },
  },
  {
    planterId: 'p-ravi', district: 'Nashik', state: 'Maharashtra', species: 'Teak',
    count: 25, lat: 19.9975, lng: 73.7898, accuracy: 11,
    verify: { by: ['v-desh', 'a-kapoor'], note: 'Block plantation rows aligned with the submitted geo-tag.' },
    fund: { by: 'f-tata', units: 25, settle: true },
  },
  {
    planterId: 'p-sunita', district: 'Patna', state: 'Bihar', species: 'Bamboo',
    count: 40, lat: 25.5941, lng: 85.1376, accuracy: 14,
    verify: { by: ['v-raghavan', 'a-kapoor'], note: 'Dense bamboo belt on community land, boundary confirmed.' },
  },
  {
    planterId: 'p-imran', district: 'Bijnor', state: 'Uttar Pradesh', species: 'Eucalyptus',
    count: 30, lat: 29.3724, lng: 78.1359, accuracy: 9,
    verify: { by: ['v-desh', 'a-kapoor'], note: 'Eucalyptus sapling plantation on reclaimed land.' },
  },
  {
    planterId: 'p-meena', district: 'Coimbatore', state: 'Tamil Nadu', species: 'Neem',
    count: 8, lat: 11.0168, lng: 76.9558, accuracy: 6,
    verify: { by: ['v-desh', 'a-kapoor'], note: 'Neem saplings raised in the block nursery, GPS within 6 m.' },
  },
  {
    planterId: 'p-kavita', district: 'Wayanad', state: 'Kerala', species: 'Jamun',
    count: 22, lat: 11.6854, lng: 76.1320, accuracy: 10,
    verify: { by: ['v-desh', 'a-kapoor'], note: 'Jamun saplings planted along the watershed boundary.' },
  },
  {
    planterId: 'p-deepak', district: 'Nashik', state: 'Maharashtra', species: 'Peepal',
    count: 18, lat: 19.2183, lng: 72.9781, accuracy: 12,
    verify: { by: ['v-raghavan', 'a-kapoor'], note: 'Peepal avenue planted along the highway stretch.' },
  },
  {
    planterId: 'p-arjun', district: 'Idukki', state: 'Kerala', species: 'Gulmohar',
    count: 15, lat: 9.9816, lng: 77.0098, accuracy: 21,
  },
  {
    planterId: 'p-ramesh', district: 'Nagpur', state: 'Maharashtra', species: 'Mango',
    count: 20, lat: 21.1458, lng: 79.0882, accuracy: 320,
    verify: 'reject',
  },
];

export async function buildSeededLedger(): Promise<GreenTokenLedger> {
  const ledger = new GreenTokenLedger();
  await ledger.init();

  for (const spec of SEED_PEOPLE) {
    const keys = await generateKeyPair();
    ledger.addParticipant({
      id: spec.id,
      name: spec.name,
      org: spec.org,
      orgName: SEED_ORG_NAMES[spec.org],
      role: spec.role,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
    } as Participant);
  }

  const callerFor = (id: string): CallerContext => {
    const p = SEED_PEOPLE.find((x) => x.id === id)!;
    return { org: p.org, name: p.name, id: p.id, orgName: SEED_ORG_NAMES[p.org] };
  };

  let tone = 0;
  for (const plant of PLANTS) {
    const planter = SEED_PEOPLE.find((x) => x.id === plant.planterId)!;
    const dataUrl = photoDataUrl(
      plant.species,
      `${plant.species} · ${plant.district}`,
      tone++,
      plant.planterId,
    );
    const photoHash = await sha256(dataUrl);

    const res = await ledger.plantTree(callerFor(plant.planterId), {
      planterId: planter.id,
      planterName: planter.name,
      planterOrg: SEED_ORG_NAMES.PLANTER,
      district: plant.district,
      state: plant.state,
      species: plant.species,
      count: plant.count,
      geo: {
        lat: plant.lat,
        lng: plant.lng,
        accuracyMeters: plant.accuracy,
        capturedAt: new Date(Date.now() - Math.floor(Math.random() * 40 + 5) * 86400000).toISOString(),
      },
      photo: { sha256: photoHash, byteLength: dataUrl.length, mimeType: 'image/svg+xml', dataUrl },
      // Accepted by the input, dropped by the contract: the contact never
      // reaches world state, the payload hash or any read view.
      privateContact: `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`,
    });

    if (!res.ok || !res.data) continue;
    const tokenId = (res.data as { tokenId: string }).tokenId;

    if (plant.verify === 'reject') {
      await ledger.verifyPlanting(callerFor('v-raghavan'), {
        tokenId,
        verdict: 'REJECT',
        note: 'Geo-stamp accuracy of 320 m is too coarse to confirm this planting; the photo does not match the parcel.',
      });
      continue;
    }

    if (plant.verify) {
      for (const verifierId of plant.verify.by) {
        await ledger.verifyPlanting(callerFor(verifierId), {
          tokenId,
          verdict: 'APPROVE',
          note: plant.verify.note,
        });
      }
    }

    const fundSpec = plant.fund;
    if (fundSpec) {
      const token = await ledger.getToken(tokenId);
      if (token.ok && token.data && token.data.status === 'VERIFIED') {
        const fund = await ledger.fundTokens(callerFor(fundSpec.by), {
          tokenIds: [tokenId],
          units: fundSpec.units,
          pricePerToken: 150,
          funderId: fundSpec.by,
          funderName: SEED_PEOPLE.find((x) => x.id === fundSpec.by)!.name,
        });
        if (fund.ok && fund.data && fundSpec.settle) {
          await ledger.settleFunding(callerFor(fundSpec.by), (fund.data as { invoiceId: string }).invoiceId);
        }
      }
    }
  }

  // A bulk purchase by the second funder, to show the discount ladder in action
  // (70 units -> 5% bulk discount). These tokens stay VERIFIED until this runs.
  const bulkTargets = (await ledger.getAllTokens()).filter(
    (t) => t.status === 'VERIFIED' && (t.species === 'Bamboo' || t.species === 'Eucalyptus'),
  );
  if (bulkTargets.length) {
    const units = bulkTargets.reduce((s, t) => s + t.count, 0);
    await ledger.fundTokens(callerFor('f-infy'), {
      tokenIds: bulkTargets.map((t) => t.tokenId),
      units,
      pricePerToken: 150,
      funderId: 'f-infy',
      funderName: 'Priya Nair',
    });
  }

  return ledger;
}
