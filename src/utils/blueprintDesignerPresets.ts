import { DesignerPlanState, Wall, Opening } from '../types';

export type ThemeMode = 'blueprint' | 'darkcad' | 'monochrome';

export interface PlanPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  floorArea: number; // m²
  state: DesignerPlanState;
}

// Coordinate space: 1 meter = 40 canvas units (or custom scaling)
// Origin at center (x: 10m, y: 8m on a 20m x 16m canvas)

export const DESIGNER_PRESETS: PlanPreset[] = [
  {
    id: 'preset-bungalow-2br',
    name: '2-Bedroom Modern Bungalow',
    category: 'Residential',
    description: '8.0m × 9.0m floor plan with Living, Dining, Kitchen, Master Bedroom, Bedroom 2, and T&B',
    floorArea: 72.0,
    state: {
      walls: [
        {
          id: 'W01',
          name: 'Front Wall (North)',
          type: 'Exterior Wall',
          length: 8.0,
          height: 3.0,
          grossArea: 24.0,
          openingArea: 3.69,
          netArea: 20.31,
          baseCHB: 254,
          color: '#38bdf8',
          tracePoints: [{ x: 200, y: 150 }, { x: 600, y: 150 }],
          openings: [
            { id: 'op1', type: 'door', label: 'Main Entrance Door (D1)', width: 0.9, height: 2.1, quantity: 1, area: 1.89 },
            { id: 'op2', type: 'window', label: 'Living Room Window (W1)', width: 1.5, height: 1.2, quantity: 1, area: 1.8 },
          ],
        },
        {
          id: 'W02',
          name: 'Rear Wall (South)',
          type: 'Exterior Wall',
          length: 8.0,
          height: 3.0,
          grossArea: 24.0,
          openingArea: 3.09,
          netArea: 20.91,
          baseCHB: 262,
          color: '#38bdf8',
          tracePoints: [{ x: 200, y: 550 }, { x: 600, y: 550 }],
          openings: [
            { id: 'op3', type: 'door', label: 'Service / Kitchen Door (D2)', width: 0.8, height: 2.1, quantity: 1, area: 1.68 },
            { id: 'op4', type: 'window', label: 'Bedroom 2 Window (W2)', width: 1.2, height: 1.2, quantity: 1, area: 1.44 },
          ],
        },
        {
          id: 'W03',
          name: 'Left Wall (West)',
          type: 'Exterior Wall',
          length: 9.0,
          height: 3.0,
          grossArea: 27.0,
          openingArea: 2.88,
          netArea: 24.12,
          baseCHB: 302,
          color: '#38bdf8',
          tracePoints: [{ x: 200, y: 150 }, { x: 200, y: 550 }],
          openings: [
            { id: 'op5', type: 'window', label: 'Master Bedroom Window (W3)', width: 1.2, height: 1.2, quantity: 2, area: 2.88 },
          ],
        },
        {
          id: 'W04',
          name: 'Right Wall (East)',
          type: 'Exterior Wall',
          length: 9.0,
          height: 3.0,
          grossArea: 27.0,
          openingArea: 2.25,
          netArea: 24.75,
          baseCHB: 310,
          color: '#38bdf8',
          tracePoints: [{ x: 600, y: 150 }, { x: 600, y: 550 }],
          openings: [
            { id: 'op6', type: 'window', label: 'Kitchen Window (W4)', width: 1.0, height: 0.9, quantity: 1, area: 0.9 },
            { id: 'op7', type: 'window', label: 'Dining Window (W5)', width: 1.5, height: 0.9, quantity: 1, area: 1.35 },
          ],
        },
        {
          id: 'W05',
          name: 'Central Partition Wall',
          type: 'Interior Wall',
          length: 9.0,
          height: 3.0,
          grossArea: 27.0,
          openingArea: 3.36,
          netArea: 23.64,
          baseCHB: 296,
          color: '#818cf8',
          tracePoints: [{ x: 400, y: 150 }, { x: 400, y: 550 }],
          openings: [
            { id: 'op8', type: 'door', label: 'Bedroom 1 Door (D3)', width: 0.8, height: 2.1, quantity: 1, area: 1.68 },
            { id: 'op9', type: 'door', label: 'Bedroom 2 Door (D4)', width: 0.8, height: 2.1, quantity: 1, area: 1.68 },
          ],
        },
        {
          id: 'W06',
          name: 'Master BR Divider Wall',
          type: 'Interior Wall',
          length: 4.0,
          height: 3.0,
          grossArea: 12.0,
          openingArea: 1.47,
          netArea: 10.53,
          baseCHB: 132,
          color: '#818cf8',
          tracePoints: [{ x: 200, y: 350 }, { x: 400, y: 350 }],
          openings: [
            { id: 'op10', type: 'door', label: 'T&B Door (D5)', width: 0.7, height: 2.1, quantity: 1, area: 1.47 },
          ],
        },
        {
          id: 'W07',
          name: 'Kitchen / Living Divider',
          type: 'Partition Wall',
          length: 4.0,
          height: 3.0,
          grossArea: 12.0,
          openingArea: 0,
          netArea: 12.0,
          baseCHB: 150,
          color: '#818cf8',
          tracePoints: [{ x: 400, y: 370 }, { x: 600, y: 370 }],
          openings: [],
        },
      ],
      doors: [
        { id: 'd1', x: 260, y: 150, widthM: 0.9, heightM: 2.1, label: 'D-1 (Main 0.9x2.1m)', swingDirection: 'left-in' },
        { id: 'd2', x: 520, y: 550, widthM: 0.8, heightM: 2.1, label: 'D-2 (Kitchen 0.8x2.1m)', swingDirection: 'right-out' },
        { id: 'd3', x: 400, y: 240, widthM: 0.8, heightM: 2.1, label: 'D-3 (Bed 1 0.8x2.1m)', swingDirection: 'left-in' },
        { id: 'd4', x: 400, y: 440, widthM: 0.8, heightM: 2.1, label: 'D-4 (Bed 2 0.8x2.1m)', swingDirection: 'left-in' },
        { id: 'd5', x: 300, y: 350, widthM: 0.7, heightM: 2.1, label: 'D-5 (T&B 0.7x2.1m)', swingDirection: 'right-in' },
      ],
      windows: [
        { id: 'wn1', x: 480, y: 150, widthM: 1.5, heightM: 1.2, label: 'W-1 (1.5x1.2m)' },
        { id: 'wn2', x: 200, y: 250, widthM: 1.2, heightM: 1.2, label: 'W-2 (1.2x1.2m)' },
        { id: 'wn3', x: 200, y: 450, widthM: 1.2, heightM: 1.2, label: 'W-3 (1.2x1.2m)' },
        { id: 'wn4', x: 600, y: 250, widthM: 1.5, heightM: 0.9, label: 'W-4 (1.5x0.9m)' },
        { id: 'wn5', x: 600, y: 450, widthM: 1.0, heightM: 0.9, label: 'W-5 (1.0x0.9m)' },
        { id: 'wn6', x: 300, y: 550, widthM: 1.2, heightM: 1.2, label: 'W-6 (1.2x1.2m)' },
      ],
      rooms: [
        { id: 'r1', name: 'LIVING AREA', x: 500, y: 250, widthM: 4.0, heightM: 4.5, customArea: 18.0 },
        { id: 'r2', name: 'MASTER BEDROOM', x: 300, y: 250, widthM: 4.0, heightM: 4.5, customArea: 18.0 },
        { id: 'r3', name: 'BEDROOM 2', x: 300, y: 450, widthM: 4.0, heightM: 4.5, customArea: 18.0 },
        { id: 'r4', name: 'KITCHEN & DINING', x: 500, y: 450, widthM: 4.0, heightM: 4.5, customArea: 18.0 },
        { id: 'r5', name: 'T & B', x: 300, y: 350, widthM: 2.0, heightM: 2.0, customArea: 4.0 },
      ],
      dimensions: [
        { id: 'dim1', p1: { x: 200, y: 110 }, p2: { x: 600, y: 110 }, label: '8.00 m', offset: -40 },
        { id: 'dim2', p1: { x: 150, y: 150 }, p2: { x: 150, y: 550 }, label: '9.00 m', offset: -50 },
      ],
      columns: [
        { id: 'col1', x: 200, y: 150, sizeM: 0.2 },
        { id: 'col2', x: 400, y: 150, sizeM: 0.2 },
        { id: 'col3', x: 600, y: 150, sizeM: 0.2 },
        { id: 'col4', x: 200, y: 350, sizeM: 0.2 },
        { id: 'col5', x: 400, y: 350, sizeM: 0.2 },
        { id: 'col6', x: 600, y: 370, sizeM: 0.2 },
        { id: 'col7', x: 200, y: 550, sizeM: 0.2 },
        { id: 'col8', x: 400, y: 550, sizeM: 0.2 },
        { id: 'col9', x: 600, y: 550, sizeM: 0.2 },
      ],
    },
  },
  {
    id: 'preset-studio',
    name: 'Cozy Studio / Tiny Home',
    category: 'Compact',
    description: '6.0m × 6.0m open-concept studio with sleeping area, kitchenette, and private bathroom',
    floorArea: 36.0,
    state: {
      walls: [
        {
          id: 'W01',
          name: 'Front Wall (North)',
          type: 'Exterior Wall',
          length: 6.0,
          height: 2.8,
          grossArea: 16.8,
          openingArea: 3.33,
          netArea: 13.47,
          baseCHB: 169,
          color: '#38bdf8',
          tracePoints: [{ x: 250, y: 200 }, { x: 550, y: 200 }],
          openings: [
            { id: 'op1', type: 'door', label: 'Main Door (D1)', width: 0.9, height: 2.1, quantity: 1, area: 1.89 },
            { id: 'op2', type: 'window', label: 'Front Window (W1)', width: 1.2, height: 1.2, quantity: 1, area: 1.44 },
          ],
        },
        {
          id: 'W02',
          name: 'Rear Wall (South)',
          type: 'Exterior Wall',
          length: 6.0,
          height: 2.8,
          grossArea: 16.8,
          openingArea: 1.8,
          netArea: 15.0,
          baseCHB: 188,
          color: '#38bdf8',
          tracePoints: [{ x: 250, y: 500 }, { x: 550, y: 500 }],
          openings: [
            { id: 'op3', type: 'window', label: 'Rear Window (W2)', width: 1.5, height: 1.2, quantity: 1, area: 1.8 },
          ],
        },
        {
          id: 'W03',
          name: 'Left Wall (West)',
          type: 'Exterior Wall',
          length: 6.0,
          height: 2.8,
          grossArea: 16.8,
          openingArea: 1.44,
          netArea: 15.36,
          baseCHB: 192,
          color: '#38bdf8',
          tracePoints: [{ x: 250, y: 200 }, { x: 250, y: 500 }],
          openings: [
            { id: 'op4', type: 'window', label: 'Side Window (W3)', width: 1.2, height: 1.2, quantity: 1, area: 1.44 },
          ],
        },
        {
          id: 'W04',
          name: 'Right Wall (East)',
          type: 'Exterior Wall',
          length: 6.0,
          height: 2.8,
          grossArea: 16.8,
          openingArea: 0.36,
          netArea: 16.44,
          baseCHB: 206,
          color: '#38bdf8',
          tracePoints: [{ x: 550, y: 200 }, { x: 550, y: 500 }],
          openings: [
            { id: 'op5', type: 'window', label: 'Bathroom Awning (W4)', width: 0.6, height: 0.6, quantity: 1, area: 0.36 },
          ],
        },
        {
          id: 'W05',
          name: 'T&B Enclosure Wall 1',
          type: 'Partition Wall',
          length: 2.2,
          height: 2.8,
          grossArea: 6.16,
          openingArea: 1.47,
          netArea: 4.69,
          baseCHB: 59,
          color: '#818cf8',
          tracePoints: [{ x: 440, y: 390 }, { x: 550, y: 390 }],
          openings: [
            { id: 'op6', type: 'door', label: 'T&B Door (D2)', width: 0.7, height: 2.1, quantity: 1, area: 1.47 },
          ],
        },
        {
          id: 'W06',
          name: 'T&B Enclosure Wall 2',
          type: 'Partition Wall',
          length: 2.2,
          height: 2.8,
          grossArea: 6.16,
          openingArea: 0,
          netArea: 6.16,
          baseCHB: 77,
          color: '#818cf8',
          tracePoints: [{ x: 440, y: 390 }, { x: 440, y: 500 }],
          openings: [],
        },
      ],
      doors: [
        { id: 'd1', x: 320, y: 200, widthM: 0.9, heightM: 2.1, label: 'D-1 (Main 0.9x2.1m)', swingDirection: 'left-in' },
        { id: 'd2', x: 480, y: 390, widthM: 0.7, heightM: 2.1, label: 'D-2 (T&B 0.7x2.1m)', swingDirection: 'right-in' },
      ],
      windows: [
        { id: 'wn1', x: 480, y: 200, widthM: 1.2, heightM: 1.2, label: 'W-1' },
        { id: 'wn2', x: 250, y: 350, widthM: 1.2, heightM: 1.2, label: 'W-2' },
        { id: 'wn3', x: 350, y: 500, widthM: 1.5, heightM: 1.2, label: 'W-3' },
        { id: 'wn4', x: 550, y: 440, widthM: 0.6, heightM: 0.6, label: 'W-4' },
      ],
      rooms: [
        { id: 'r1', name: 'STUDIO LIVING / SLEEPING', x: 350, y: 330, widthM: 6.0, heightM: 4.0, customArea: 28.0 },
        { id: 'r2', name: 'KITCHENETTE', x: 330, y: 450, widthM: 2.5, heightM: 2.0, customArea: 5.0 },
        { id: 'r3', name: 'BATHROOM', x: 495, y: 445, widthM: 2.2, heightM: 2.2, customArea: 4.84 },
      ],
      dimensions: [
        { id: 'dim1', p1: { x: 250, y: 160 }, p2: { x: 550, y: 160 }, label: '6.00 m', offset: -40 },
        { id: 'dim2', p1: { x: 200, y: 200 }, p2: { x: 200, y: 500 }, label: '6.00 m', offset: -50 },
      ],
      columns: [
        { id: 'col1', x: 250, y: 200, sizeM: 0.2 },
        { id: 'col2', x: 550, y: 200, sizeM: 0.2 },
        { id: 'col3', x: 250, y: 500, sizeM: 0.2 },
        { id: 'col4', x: 550, y: 500, sizeM: 0.2 },
      ],
    },
  },
  {
    id: 'preset-perimeter-fence',
    name: 'Perimeter Lot Fence & Gate',
    category: 'Perimeter',
    description: '12.0m × 15.0m residential lot perimeter masonry boundary fence with gate opening',
    floorArea: 180.0,
    state: {
      walls: [
        {
          id: 'W01',
          name: 'Front Boundary Fence',
          type: 'Perimeter / Fence',
          length: 12.0,
          height: 2.0,
          grossArea: 24.0,
          openingArea: 6.0,
          netArea: 18.0,
          baseCHB: 225,
          color: '#fbbf24',
          tracePoints: [{ x: 150, y: 150 }, { x: 650, y: 150 }],
          openings: [
            { id: 'op1', type: 'door', label: 'Main Vehicular Gate', width: 3.0, height: 2.0, quantity: 1, area: 6.0 },
          ],
        },
        {
          id: 'W02',
          name: 'Rear Boundary Fence',
          type: 'Perimeter / Fence',
          length: 12.0,
          height: 2.0,
          grossArea: 24.0,
          openingArea: 0,
          netArea: 24.0,
          baseCHB: 300,
          color: '#fbbf24',
          tracePoints: [{ x: 150, y: 580 }, { x: 650, y: 580 }],
          openings: [],
        },
        {
          id: 'W03',
          name: 'Left Boundary Fence',
          type: 'Perimeter / Fence',
          length: 15.0,
          height: 2.0,
          grossArea: 30.0,
          openingArea: 0,
          netArea: 30.0,
          baseCHB: 375,
          color: '#fbbf24',
          tracePoints: [{ x: 150, y: 150 }, { x: 150, y: 580 }],
          openings: [],
        },
        {
          id: 'W04',
          name: 'Right Boundary Fence',
          type: 'Perimeter / Fence',
          length: 15.0,
          height: 2.0,
          grossArea: 30.0,
          openingArea: 0,
          netArea: 30.0,
          baseCHB: 375,
          color: '#fbbf24',
          tracePoints: [{ x: 650, y: 150 }, { x: 650, y: 580 }],
          openings: [],
        },
      ],
      doors: [
        { id: 'd1', x: 400, y: 150, widthM: 3.0, heightM: 2.0, label: 'Vehicular Gate (3.0m)', swingDirection: 'double' },
      ],
      windows: [],
      rooms: [
        { id: 'r1', name: 'RESIDENTIAL LOT (180 m²)', x: 400, y: 365, widthM: 12.0, heightM: 15.0, customArea: 180.0 },
      ],
      dimensions: [
        { id: 'dim1', p1: { x: 150, y: 100 }, p2: { x: 650, y: 100 }, label: '12.00 m', offset: -50 },
        { id: 'dim2', p1: { x: 90, y: 150 }, p2: { x: 90, y: 580 }, label: '15.00 m', offset: -60 },
      ],
      columns: [
        { id: 'col1', x: 150, y: 150, sizeM: 0.25 },
        { id: 'col2', x: 400, y: 150, sizeM: 0.25 },
        { id: 'col3', x: 650, y: 150, sizeM: 0.25 },
        { id: 'col4', x: 150, y: 365, sizeM: 0.25 },
        { id: 'col5', x: 650, y: 365, sizeM: 0.25 },
        { id: 'col6', x: 150, y: 580, sizeM: 0.25 },
        { id: 'col7', x: 400, y: 580, sizeM: 0.25 },
        { id: 'col8', x: 650, y: 580, sizeM: 0.25 },
      ],
    },
  },
];

/**
 * Render the Designer Plan to a high-resolution 1200x840 Architectural Blueprint Image
 */
export function generateBlueprintDataUrl(
  plan: DesignerPlanState,
  projectName: string,
  theme: 'blueprint' | 'monochrome' | 'darkcad' = 'blueprint',
  chbAreaSqM: number = 0.08
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Theme color palette
  const isBp = theme === 'blueprint';
  const isDark = theme === 'darkcad';
  const bgColor = isBp ? '#0c2340' : isDark ? '#0f172a' : '#ffffff';
  const gridColorMajor = isBp ? 'rgba(56, 189, 248, 0.22)' : isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(203, 213, 225, 0.6)';
  const gridColorMinor = isBp ? 'rgba(56, 189, 248, 0.08)' : isDark ? 'rgba(71, 85, 105, 0.15)' : 'rgba(241, 245, 249, 0.8)';
  const wallExteriorStroke = isBp ? '#38bdf8' : isDark ? '#60a5fa' : '#0f172a';
  const wallInteriorStroke = isBp ? '#93c5fd' : isDark ? '#a5b4fc' : '#334155';
  const textPrimary = isBp ? '#e0f2fe' : isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isBp ? '#7dd3fc' : isDark ? '#94a3b8' : '#64748b';
  const dimColor = isBp ? '#facc15' : isDark ? '#fbbf24' : '#b45309';

  // 1. Fill Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw Architectural Grid
  const gridMinor = 20;
  const gridMajor = 100;

  ctx.lineWidth = 0.5;
  ctx.strokeStyle = gridColorMinor;
  for (let x = 0; x < canvas.width; x += gridMinor) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridMinor) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColorMajor;
  for (let x = 0; x < canvas.width; x += gridMajor) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridMajor) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 3. Draw Room Zones & Labels
  plan.rooms.forEach((r) => {
    ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.04)' : isDark ? 'rgba(96, 165, 250, 0.05)' : 'rgba(248, 250, 252, 0.8)';
    if (r.widthM && r.heightM) {
      const rx = r.x * 1.2 - (r.widthM * 40 * 1.2) / 2;
      const ry = r.y * 1.2 - (r.heightM * 40 * 1.2) / 2;
      ctx.fillRect(rx, ry, r.widthM * 40 * 1.2, r.heightM * 40 * 1.2);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px "Courier New", monospace, sans-serif';
    ctx.fillStyle = textPrimary;
    ctx.fillText(r.name, r.x * 1.2, r.y * 1.2 - 8);

    if (r.customArea) {
      ctx.font = '11px monospace, sans-serif';
      ctx.fillStyle = textSecondary;
      ctx.fillText(`AREA: ${r.customArea.toFixed(1)} m²`, r.x * 1.2, r.y * 1.2 + 10);
    }
  });

  // 4. Draw Columns (RC Posts)
  plan.columns.forEach((c) => {
    const cx = c.x * 1.2;
    const cy = c.y * 1.2;
    const size = Math.max(12, c.sizeM * 40 * 1.2);
    ctx.fillStyle = isBp ? '#0284c7' : isDark ? '#3b82f6' : '#1e293b';
    ctx.strokeStyle = textPrimary;
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);

    // Cross hatch inside column
    ctx.beginPath();
    ctx.moveTo(cx - size / 2, cy - size / 2);
    ctx.lineTo(cx + size / 2, cy + size / 2);
    ctx.moveTo(cx + size / 2, cy - size / 2);
    ctx.lineTo(cx - size / 2, cy + size / 2);
    ctx.stroke();
  });

  // 5. Draw Walls
  plan.walls.forEach((w) => {
    if (!w.tracePoints || w.tracePoints.length < 2) return;
    const p1 = { x: w.tracePoints[0].x * 1.2, y: w.tracePoints[0].y * 1.2 };
    const p2 = { x: w.tracePoints[1].x * 1.2, y: w.tracePoints[1].y * 1.2 };

    const isExt = w.type === 'Exterior Wall' || w.type === 'Firewall' || w.type === 'Perimeter / Fence';
    const wallWidth = isExt ? 10 : 6;

    // Double line wall representation
    ctx.strokeStyle = isExt ? wallExteriorStroke : wallInteriorStroke;
    ctx.lineWidth = wallWidth;
    ctx.lineCap = 'square';

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Wall dimension tag at midpoint
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    ctx.fillStyle = isBp ? '#0369a1' : isDark ? '#1e293b' : '#f1f5f9';
    ctx.strokeStyle = isExt ? wallExteriorStroke : wallInteriorStroke;
    ctx.lineWidth = 1;
    ctx.fillRect(midX - 24, midY - 10, 48, 20);
    ctx.strokeRect(midX - 24, midY - 10, 48, 20);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = textPrimary;
    ctx.fillText(`${w.id} ${w.length.toFixed(1)}m`, midX, midY);
  });

  // 6. Draw Windows
  plan.windows.forEach((win) => {
    const wx = win.x * 1.2;
    const wy = win.y * 1.2;
    const width = win.widthM * 40 * 1.2;

    ctx.fillStyle = bgColor;
    ctx.fillRect(wx - width / 2, wy - 4, width, 8);

    ctx.strokeStyle = isBp ? '#38bdf8' : isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wx - width / 2, wy - 4, width, 8);

    // Glass center line
    ctx.beginPath();
    ctx.moveTo(wx - width / 2, wy);
    ctx.lineTo(wx + width / 2, wy);
    ctx.stroke();

    ctx.font = '9px monospace';
    ctx.fillStyle = textSecondary;
    ctx.textAlign = 'center';
    ctx.fillText(win.label || 'WIN', wx, wy - 8);
  });

  // 7. Draw Doors (with architectural swing arc)
  plan.doors.forEach((door) => {
    const dx = door.x * 1.2;
    const dy = door.y * 1.2;
    const width = door.widthM * 40 * 1.2;

    // Cutout opening in wall
    ctx.fillStyle = bgColor;
    ctx.fillRect(dx - width / 2, dy - 6, width, 12);

    // Door leaf line
    ctx.strokeStyle = isBp ? '#f59e0b' : isDark ? '#f59e0b' : '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dx - width / 2, dy);
    ctx.lineTo(dx - width / 2, dy - width);
    ctx.stroke();

    // Swing 90-degree arc
    ctx.strokeStyle = isBp ? 'rgba(245, 158, 11, 0.6)' : 'rgba(217, 119, 6, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(dx - width / 2, dy, width, -Math.PI / 2, 0, false);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '9px monospace';
    ctx.fillStyle = textSecondary;
    ctx.textAlign = 'center';
    ctx.fillText(door.label || 'DOOR', dx, dy + 16);
  });

  // 8. Draw Dimension Strings
  plan.dimensions.forEach((dim) => {
    const p1 = { x: dim.p1.x * 1.2, y: dim.p1.y * 1.2 };
    const p2 = { x: dim.p2.x * 1.2, y: dim.p2.y * 1.2 };

    ctx.strokeStyle = dimColor;
    ctx.lineWidth = 1.5;

    // Dimension line
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Architectural Ticks (45 degree slashes)
    const tickLen = 6;
    ctx.beginPath();
    ctx.moveTo(p1.x - tickLen, p1.y + tickLen);
    ctx.lineTo(p1.x + tickLen, p1.y - tickLen);
    ctx.moveTo(p2.x - tickLen, p2.y + tickLen);
    ctx.lineTo(p2.x + tickLen, p2.y - tickLen);
    ctx.stroke();

    // Text label
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = dimColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(dim.label, midX, midY - 3);
  });

  // 9. Architectural Title Block & Border
  ctx.strokeStyle = isBp ? '#0284c7' : isDark ? '#334155' : '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);

  // Title Box (Bottom-Right)
  const tbW = 340;
  const tbH = 90;
  const tbX = canvas.width - tbW - 24;
  const tbY = canvas.height - tbH - 24;

  ctx.fillStyle = isBp ? 'rgba(12, 35, 64, 0.95)' : isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(tbX, tbY, tbW, tbH);
  ctx.strokeStyle = isBp ? '#0284c7' : isDark ? '#334155' : '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(tbX, tbY, tbW, tbH);

  // Title text inside title block
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillStyle = textPrimary;
  ctx.fillText(`PROJECT: ${projectName || 'ARCHITECTURAL FLOOR PLAN'}`, tbX + 12, tbY + 10);

  ctx.font = '10px monospace';
  ctx.fillStyle = textSecondary;
  ctx.fillText(`SHEET: ARCHITECTURAL FLOOR PLAN & MASONRY`, tbX + 12, tbY + 28);
  ctx.fillText(`SCALE: 1:100 (METRIC 1M = 48PX)`, tbX + 12, tbY + 44);
  ctx.fillText(`DATE: ${new Date().toLocaleDateString()} | WALLS: ${plan.walls.length} UNITS`, tbX + 12, tbY + 60);

  // North Arrow Symbol (Top Right)
  const naX = canvas.width - 60;
  const naY = 60;
  ctx.strokeStyle = isBp ? '#38bdf8' : '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(naX, naY, 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isBp ? '#38bdf8' : '#0f172a';
  ctx.beginPath();
  ctx.moveTo(naX, naY - 18);
  ctx.lineTo(naX + 6, naY + 4);
  ctx.lineTo(naX, naY);
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', naX, naY - 24);

  return canvas.toDataURL('image/png');
}
