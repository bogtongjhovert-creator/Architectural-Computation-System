import { Wall } from '../types';

export interface SampleBlueprint {
  id: string;
  name: string;
  category: string;
  description: string;
  floorArea: number;
  dataUrl: string;
  initialScaleMeters: number; // e.g. 6.0m known span on blueprint
  scaleReferencePoints: [{ x: number; y: number }, { x: number; y: number }];
  detectedWalls: Wall[];
}

// Generate high quality architectural blueprint SVG data URL
function createBungalowBlueprintSvg(): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
    <defs>
      <!-- Blueprint Grid Background -->
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a8a" stroke-width="0.5" stroke-opacity="0.3"/>
      </pattern>
      <pattern id="grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="url(#grid)" />
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#2563eb" stroke-width="1" stroke-opacity="0.5"/>
      </pattern>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/>
      </marker>
    </defs>

    <!-- Background Blueprint Dark Blue -->
    <rect width="1000" height="700" fill="#0b1e3b" />
    <rect width="1000" height="700" fill="url(#grid-major)" />

    <!-- Title Block Header -->
    <rect x="50" y="30" width="900" height="45" fill="#0f2b5c" stroke="#38bdf8" stroke-width="1.5" />
    <text x="70" y="58" font-family="'Fira Code', monospace" font-size="16" font-weight="bold" fill="#38bdf8" letter-spacing="1.5">PROJECT: 2-BEDROOM RESIDENTIAL BUNGALOW</text>
    <text x="650" y="58" font-family="'Fira Code', monospace" font-size="14" fill="#93c5fd">SCALE 1:50 | FLR AREA: 68.0 m²</text>

    <!-- Outer Dimension Lines -->
    <!-- Top Horizontal Dimension: 10.00 m (x: 150 to 850 -> 700px = 10m -> 70px/m) -->
    <line x1="150" y1="110" x2="850" y2="110" stroke="#38bdf8" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="150" y1="95" x2="150" y2="140" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="850" y1="95" x2="850" y2="140" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3,3" />
    <rect x="450" y="98" width="100" height="24" fill="#0f2b5c" rx="4" />
    <text x="500" y="115" font-family="'Fira Code', monospace" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">10.00 m</text>

    <!-- Left Vertical Dimension: 7.00 m (y: 150 to 570 -> 420px = 7m -> 60px/m approx) -->
    <line x1="100" y1="150" x2="100" y2="570" stroke="#38bdf8" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="85" y1="150" x2="135" y2="150" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="85" y1="570" x2="135" y2="570" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3,3" />
    <rect x="60" y="348" width="80" height="24" fill="#0f2b5c" rx="4" />
    <text x="100" y="365" font-family="'Fira Code', monospace" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">7.00 m</text>

    <!-- Wall Shadows / Outer Foundations -->
    <rect x="150" y="150" width="700" height="420" fill="none" stroke="#1d4ed8" stroke-width="18" stroke-opacity="0.3"/>

    <!-- EXTERIOR WALLS (Thick Hollow Block Lines) -->
    <!-- North Wall: W01 (10.00 m) -->
    <rect x="150" y="150" width="700" height="14" fill="#60a5fa" stroke="#93c5fd" stroke-width="1.5" />
    <text x="500" y="142" font-family="'Fira Code', monospace" font-size="12" font-weight="bold" fill="#93c5fd" text-anchor="middle">W01 [10.00m × 3.00m]</text>

    <!-- South Wall: W02 (10.00 m) -->
    <rect x="150" y="556" width="700" height="14" fill="#60a5fa" stroke="#93c5fd" stroke-width="1.5" />
    <text x="500" y="590" font-family="'Fira Code', monospace" font-size="12" font-weight="bold" fill="#93c5fd" text-anchor="middle">W02 [10.00m × 3.00m]</text>

    <!-- West Wall: W03 (7.00 m) -->
    <rect x="150" y="150" width="14" height="420" fill="#60a5fa" stroke="#93c5fd" stroke-width="1.5" />
    <text x="135" y="300" font-family="'Fira Code', monospace" font-size="12" font-weight="bold" fill="#93c5fd" text-anchor="end" transform="rotate(-90 135 300)">W03 [7.00m × 3.00m]</text>

    <!-- East Wall: W04 (7.00 m) -->
    <rect x="836" y="150" width="14" height="420" fill="#60a5fa" stroke="#93c5fd" stroke-width="1.5" />
    <text x="870" y="300" font-family="'Fira Code', monospace" font-size="12" font-weight="bold" fill="#93c5fd" text-anchor="start" transform="rotate(90 870 300)">W04 [7.00m × 3.00m]</text>

    <!-- INTERIOR PARTITIONS -->
    <!-- Bedroom Divider Wall: W05 (5.00 m) -->
    <rect x="500" y="150" width="10" height="230" fill="#38bdf8" stroke="#7dd3fc" stroke-width="1" />
    <text x="490" y="270" font-family="'Fira Code', monospace" font-size="11" fill="#7dd3fc" text-anchor="end" transform="rotate(-90 490 270)">W05 [4.00m × 2.80m]</text>

    <!-- Hallway / Living Divider Wall: W06 (4.50 m) -->
    <rect x="500" y="370" width="220" height="10" fill="#38bdf8" stroke="#7dd3fc" stroke-width="1" />
    <text x="610" y="365" font-family="'Fira Code', monospace" font-size="11" fill="#7dd3fc" text-anchor="middle">W06 [3.50m × 2.80m]</text>

    <!-- T&B Partition Wall: W07 (3.00 m) -->
    <rect x="710" y="370" width="10" height="200" fill="#38bdf8" stroke="#7dd3fc" stroke-width="1" />
    <text x="735" y="470" font-family="'Fira Code', monospace" font-size="11" fill="#7dd3fc" text-anchor="start" transform="rotate(90 735 470)">W07 [3.00m × 2.80m]</text>

    <!-- OPENINGS: DOORS & WINDOWS -->
    <!-- Main Entrance Door (D1 on South Wall) -->
    <rect x="300" y="552" width="60" height="22" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5" />
    <path d="M 300 552 A 60 60 0 0 1 360 492" fill="none" stroke="#ef4444" stroke-dasharray="3,3" stroke-width="1.5"/>
    <text x="330" y="540" font-family="'Fira Code', monospace" font-size="10" font-weight="bold" fill="#fca5a5" text-anchor="middle">D1 (0.9×2.1m)</text>

    <!-- Bedroom 1 Door (D2) -->
    <rect x="500" y="310" width="10" height="50" fill="#ef4444" />
    <text x="475" y="335" font-family="'Fira Code', monospace" font-size="9" fill="#fca5a5">D2</text>

    <!-- T&B Door (D3) -->
    <rect x="710" y="390" width="10" height="45" fill="#ef4444" />
    <text x="690" y="415" font-family="'Fira Code', monospace" font-size="9" fill="#fca5a5">D3</text>

    <!-- Windows (W-1, W-2, W-3) -->
    <!-- Window W1 on North Wall -->
    <rect x="280" y="146" width="90" height="22" fill="#eab308" stroke="#fef08a" stroke-width="1.5" />
    <text x="325" y="140" font-family="'Fira Code', monospace" font-size="10" font-weight="bold" fill="#fef08a" text-anchor="middle">W1 (1.5×1.2m)</text>

    <!-- Window W2 on North Wall Bedroom 2 -->
    <rect x="630" y="146" width="80" height="22" fill="#eab308" stroke="#fef08a" stroke-width="1.5" />
    <text x="670" y="140" font-family="'Fira Code', monospace" font-size="10" font-weight="bold" fill="#fef08a" text-anchor="middle">W2 (1.2×1.2m)</text>

    <!-- Window W3 on West Wall Living Area -->
    <rect x="146" y="240" width="22" height="90" fill="#eab308" stroke="#fef08a" stroke-width="1.5" />
    <text x="180" y="285" font-family="'Fira Code', monospace" font-size="10" font-weight="bold" fill="#fef08a" text-anchor="start">W3 (1.5×1.2m)</text>

    <!-- Window W4 on East Wall Bedroom -->
    <rect x="832" y="240" width="22" height="80" fill="#eab308" stroke="#fef08a" stroke-width="1.5" />
    <text x="820" y="285" font-family="'Fira Code', monospace" font-size="10" font-weight="bold" fill="#fef08a" text-anchor="end">W4 (1.2×1.2m)</text>

    <!-- ROOM LABELS -->
    <g font-family="'Fira Code', monospace" text-anchor="middle">
      <!-- Living / Dining -->
      <text x="320" y="380" font-size="16" font-weight="bold" fill="#e2e8f0">LIVING &amp; DINING</text>
      <text x="320" y="405" font-size="12" fill="#94a3b8">28.50 m²</text>

      <!-- Bedroom 1 -->
      <text x="670" y="260" font-size="15" font-weight="bold" fill="#e2e8f0">MASTER BEDROOM</text>
      <text x="670" y="282" font-size="12" fill="#94a3b8">17.50 m²</text>

      <!-- Kitchen -->
      <text x="320" y="240" font-size="14" font-weight="bold" fill="#e2e8f0">KITCHEN</text>
      <text x="320" y="260" font-size="11" fill="#94a3b8">12.00 m²</text>

      <!-- T&B -->
      <text x="770" y="470" font-size="14" font-weight="bold" fill="#e2e8f0">T &amp; B</text>
      <text x="770" y="490" font-size="11" fill="#94a3b8">6.00 m²</text>
    </g>

    <!-- Legend Box -->
    <rect x="740" y="605" width="210" height="75" fill="#0f2b5c" stroke="#38bdf8" stroke-width="1" rx="4" />
    <text x="750" y="622" font-family="'Fira Code', monospace" font-size="10" font-weight="bold" fill="#38bdf8">LEGEND:</text>
    <rect x="750" y="630" width="12" height="10" fill="#60a5fa" />
    <text x="770" y="639" font-family="'Fira Code', monospace" font-size="10" fill="#cbd5e1">Exterior CHB (150mm)</text>
    <rect x="750" y="646" width="12" height="10" fill="#38bdf8" />
    <text x="770" y="655" font-family="'Fira Code', monospace" font-size="10" fill="#cbd5e1">Interior CHB (100mm)</text>
    <rect x="750" y="662" width="12" height="8" fill="#ef4444" />
    <text x="770" y="670" font-family="'Fira Code', monospace" font-size="10" fill="#cbd5e1">Door Openings (Deduct)</text>
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

function createCommercialPerimeterSvg(): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
    <rect width="1000" height="700" fill="#0b1e3b" />
    <defs>
      <pattern id="grid-c" width="25" height="25" patternUnits="userSpaceOnUse">
        <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e3a8a" stroke-width="0.5" stroke-opacity="0.3"/>
      </pattern>
    </defs>
    <rect width="1000" height="700" fill="url(#grid-c)" />

    <rect x="50" y="30" width="900" height="45" fill="#0f2b5c" stroke="#38bdf8" stroke-width="1.5" />
    <text x="70" y="58" font-family="'Fira Code', monospace" font-size="16" font-weight="bold" fill="#38bdf8">PROJECT: COMMERCIAL WAREHOUSE &amp; PERIMETER FENCE</text>
    <text x="720" y="58" font-family="'Fira Code', monospace" font-size="14" fill="#93c5fd">LOT AREA: 180 m²</text>

    <!-- Perimeter Fence Walls -->
    <rect x="120" y="120" width="760" height="480" fill="none" stroke="#38bdf8" stroke-width="20" stroke-opacity="0.2"/>
    <rect x="120" y="120" width="760" height="12" fill="#38bdf8" />
    <rect x="120" y="588" width="760" height="12" fill="#38bdf8" />
    <rect x="120" y="120" width="12" height="480" fill="#38bdf8" />
    <rect x="868" y="120" width="12" height="480" fill="#38bdf8" />

    <!-- Main Warehouse Structure inside -->
    <rect x="250" y="200" width="500" height="300" fill="#1e293b" stroke="#60a5fa" stroke-width="8" />
    <text x="500" y="340" font-family="'Fira Code', monospace" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">MAIN STORAGE BAY (12.0m × 8.0m)</text>
    <text x="500" y="370" font-family="'Fira Code', monospace" font-size="13" fill="#94a3b8" text-anchor="middle">Height: 3.50m | 150mm CHB Structural Wall</text>

    <!-- Big Rolling Door Opening -->
    <rect x="420" y="492" width="160" height="16" fill="#ef4444" />
    <text x="500" y="530" font-family="'Fira Code', monospace" font-size="12" font-weight="bold" fill="#fca5a5" text-anchor="middle">OVERHEAD ROLLUP DOOR (3.00m × 2.80m)</text>

    <!-- Dimension Label -->
    <text x="500" y="105" font-family="'Fira Code', monospace" font-size="14" font-weight="bold" fill="#38bdf8" text-anchor="middle">18.00 METERS PERIMETER SPAN</text>
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const SAMPLE_BLUEPRINTS: SampleBlueprint[] = [
  {
    id: 'sample-bungalow',
    name: '2-Bedroom Residential Bungalow Plan',
    category: 'Residential',
    description: 'Detailed architectural floor plan featuring 10m x 7m perimeter walls, interior partitions, door openings (D1, D2, D3), and standard windows (W1-W4).',
    floorArea: 68.0,
    dataUrl: createBungalowBlueprintSvg(),
    initialScaleMeters: 10.0,
    scaleReferencePoints: [
      { x: 150, y: 150 },
      { x: 850, y: 150 },
    ],
    detectedWalls: [
      {
        id: 'W01',
        name: 'North Exterior Wall',
        type: 'Exterior Wall',
        length: 10.0,
        height: 3.0,
        openings: [
          {
            id: 'W01-O1',
            type: 'window',
            label: 'Window W1 (1.50 × 1.20m)',
            width: 1.5,
            height: 1.2,
            quantity: 1,
            area: 1.8,
          },
          {
            id: 'W01-O2',
            type: 'window',
            label: 'Window W2 (1.20 × 1.20m)',
            width: 1.2,
            height: 1.2,
            quantity: 1,
            area: 1.44,
          },
        ],
        grossArea: 30.0,
        openingArea: 3.24,
        netArea: 26.76,
        baseCHB: 335,
        color: '#60a5fa',
        isAutoDetected: true,
      },
      {
        id: 'W02',
        name: 'South Exterior Wall (Front Entrance)',
        type: 'Exterior Wall',
        length: 10.0,
        height: 3.0,
        openings: [
          {
            id: 'W02-O1',
            type: 'door',
            label: 'Main Entrance Door D1 (0.90 × 2.10m)',
            width: 0.9,
            height: 2.1,
            quantity: 1,
            area: 1.89,
          },
        ],
        grossArea: 30.0,
        openingArea: 1.89,
        netArea: 28.11,
        baseCHB: 352,
        color: '#60a5fa',
        isAutoDetected: true,
      },
      {
        id: 'W03',
        name: 'West Exterior Wall (Living Side)',
        type: 'Exterior Wall',
        length: 7.0,
        height: 3.0,
        openings: [
          {
            id: 'W03-O1',
            type: 'window',
            label: 'Living Room Window W3 (1.50 × 1.20m)',
            width: 1.5,
            height: 1.2,
            quantity: 1,
            area: 1.8,
          },
        ],
        grossArea: 21.0,
        openingArea: 1.8,
        netArea: 19.2,
        baseCHB: 240,
        color: '#60a5fa',
        isAutoDetected: true,
      },
      {
        id: 'W04',
        name: 'East Exterior Wall (Bedroom Side)',
        type: 'Exterior Wall',
        length: 7.0,
        height: 3.0,
        openings: [
          {
            id: 'W04-O1',
            type: 'window',
            label: 'Bedroom Window W4 (1.20 × 1.20m)',
            width: 1.2,
            height: 1.2,
            quantity: 1,
            area: 1.44,
          },
        ],
        grossArea: 21.0,
        openingArea: 1.44,
        netArea: 19.56,
        baseCHB: 245,
        color: '#60a5fa',
        isAutoDetected: true,
      },
      {
        id: 'W05',
        name: 'Bedroom Partition Wall',
        type: 'Interior Wall',
        length: 4.0,
        height: 2.8,
        openings: [
          {
            id: 'W05-O1',
            type: 'door',
            label: 'Bedroom 1 Door D2 (0.80 × 2.10m)',
            width: 0.8,
            height: 2.1,
            quantity: 1,
            area: 1.68,
          },
        ],
        grossArea: 11.2,
        openingArea: 1.68,
        netArea: 9.52,
        baseCHB: 119,
        color: '#38bdf8',
        isAutoDetected: true,
      },
      {
        id: 'W06',
        name: 'Living/Kitchen Divider Wall',
        type: 'Partition Wall',
        length: 3.5,
        height: 2.8,
        openings: [],
        grossArea: 9.8,
        openingArea: 0,
        netArea: 9.8,
        baseCHB: 123,
        color: '#38bdf8',
        isAutoDetected: true,
      },
      {
        id: 'W07',
        name: 'Toilet & Bath (T&B) Enclosure Wall',
        type: 'Interior Wall',
        length: 3.0,
        height: 2.8,
        openings: [
          {
            id: 'W07-O1',
            type: 'door',
            label: 'T&B Door D3 (0.70 × 2.10m)',
            width: 0.7,
            height: 2.1,
            quantity: 1,
            area: 1.47,
          },
        ],
        grossArea: 8.4,
        openingArea: 1.47,
        netArea: 6.93,
        baseCHB: 87,
        color: '#38bdf8',
        isAutoDetected: true,
      },
    ],
  },
  {
    id: 'sample-commercial',
    name: 'Commercial Warehouse & Storage Facility',
    category: 'Commercial',
    description: 'High-ceiling commercial layout with 12m x 8m main warehouse structure and 3.5m wall height.',
    floorArea: 120.0,
    dataUrl: createCommercialPerimeterSvg(),
    initialScaleMeters: 18.0,
    scaleReferencePoints: [
      { x: 120, y: 120 },
      { x: 880, y: 120 },
    ],
    detectedWalls: [
      {
        id: 'CW-01',
        name: 'Warehouse North Main Wall',
        type: 'Exterior Wall',
        length: 12.0,
        height: 3.5,
        openings: [],
        grossArea: 42.0,
        openingArea: 0,
        netArea: 42.0,
        baseCHB: 525,
        color: '#60a5fa',
        isAutoDetected: true,
      },
      {
        id: 'CW-02',
        name: 'Warehouse South Entrance Wall (Rollup)',
        type: 'Exterior Wall',
        length: 12.0,
        height: 3.5,
        openings: [
          {
            id: 'CW02-O1',
            type: 'door',
            label: 'Industrial Overhead Rollup Door (3.00 × 2.80m)',
            width: 3.0,
            height: 2.8,
            quantity: 1,
            area: 8.4,
          },
        ],
        grossArea: 42.0,
        openingArea: 8.4,
        netArea: 33.6,
        baseCHB: 420,
        color: '#60a5fa',
        isAutoDetected: true,
      },
      {
        id: 'CW-03',
        name: 'Warehouse West Wall',
        type: 'Exterior Wall',
        length: 8.0,
        height: 3.5,
        openings: [
          {
            id: 'CW03-O1',
            type: 'window',
            label: 'High Clerestory Window (2.00 × 0.80m)',
            width: 2.0,
            height: 0.8,
            quantity: 2,
            area: 3.2,
          },
        ],
        grossArea: 28.0,
        openingArea: 3.2,
        netArea: 24.8,
        baseCHB: 310,
        color: '#60a5fa',
        isAutoDetected: true,
      },
      {
        id: 'CW-04',
        name: 'Warehouse East Wall',
        type: 'Exterior Wall',
        length: 8.0,
        height: 3.5,
        openings: [],
        grossArea: 28.0,
        openingArea: 0,
        netArea: 28.0,
        baseCHB: 350,
        color: '#60a5fa',
        isAutoDetected: true,
      },
    ],
  },
];
