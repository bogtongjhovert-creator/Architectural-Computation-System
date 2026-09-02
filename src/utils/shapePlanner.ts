import { Wall, WallType, DesignerRoomShape, DesignerRoomLabel, DesignerDoor, DesignerWindow, DesignerDimension, Opening } from '../types';

export const SCALE_PPM = 40; // 40 pixels per meter

export interface RoomShapeTemplate {
  id: string;
  name: string;
  category: 'Living & Social' | 'Bedrooms' | 'Kitchen & Dining' | 'Sanitary' | 'Outdoor & Utility';
  icon: string;
  widthM: number;
  heightM: number;
  wallHeightM: number;
  wallType: WallType;
  kind: 'rectangle' | 'l_shape' | 't_shape' | 'porch';
  description: string;
  defaultDoors?: { side: 'north' | 'south' | 'east' | 'west'; width: number; label: string }[];
  defaultWindows?: { side: 'north' | 'south' | 'east' | 'west'; width: number; label: string }[];
}

export const ARCHITECTURAL_ROOM_TEMPLATES: RoomShapeTemplate[] = [
  // Living & Social
  {
    id: 'living-std',
    name: 'Living Area',
    category: 'Living & Social',
    icon: '🛋️',
    widthM: 5.0,
    heightM: 4.0,
    wallHeightM: 3.0,
    wallType: 'Exterior Wall',
    kind: 'rectangle',
    description: 'Spacious 5.0m × 4.0m family living room with main entrance access',
  },
  {
    id: 'great-room-l',
    name: 'Living & Dining L-Suite',
    category: 'Living & Social',
    icon: '📐',
    widthM: 6.5,
    heightM: 5.0,
    wallHeightM: 3.0,
    wallType: 'Exterior Wall',
    kind: 'l_shape',
    description: 'Open-concept L-shaped great room combining living and dining zones',
  },
  {
    id: 'dining-std',
    name: 'Dining Room',
    category: 'Living & Social',
    icon: '🍽️',
    widthM: 4.0,
    heightM: 3.2,
    wallHeightM: 3.0,
    wallType: 'Interior Wall',
    kind: 'rectangle',
    description: '6-8 seater formal or casual dining area',
  },

  // Kitchen & Dining
  {
    id: 'kitchen-std',
    name: 'Kitchen',
    category: 'Kitchen & Dining',
    icon: '🍳',
    widthM: 3.2,
    heightM: 3.0,
    wallHeightM: 3.0,
    wallType: 'Interior Wall',
    kind: 'rectangle',
    description: 'Modular kitchen with counter preparation and stove space',
  },
  {
    id: 'kitchen-island',
    name: 'Chef Kitchen & Pantry',
    category: 'Kitchen & Dining',
    icon: '🥘',
    widthM: 4.2,
    heightM: 3.5,
    wallHeightM: 3.0,
    wallType: 'Interior Wall',
    kind: 'rectangle',
    description: 'Generous kitchen with central island allowance and walk-in pantry',
  },

  // Bedrooms
  {
    id: 'master-bed',
    name: 'Master Bedroom',
    category: 'Bedrooms',
    icon: '👑',
    widthM: 4.5,
    heightM: 4.0,
    wallHeightM: 3.0,
    wallType: 'Exterior Wall',
    kind: 'rectangle',
    description: 'Primary bedroom suite with wardrobe and en-suite allowance',
  },
  {
    id: 'bedroom-2',
    name: 'Bedroom 2',
    category: 'Bedrooms',
    icon: '🛏️',
    widthM: 3.5,
    heightM: 3.2,
    wallHeightM: 3.0,
    wallType: 'Exterior Wall',
    kind: 'rectangle',
    description: 'Secondary standard bedroom with built-in closet wall',
  },
  {
    id: 'bedroom-3',
    name: 'Bedroom 3 / Nursery',
    category: 'Bedrooms',
    icon: '🧸',
    widthM: 3.0,
    heightM: 3.0,
    wallHeightM: 3.0,
    wallType: 'Exterior Wall',
    kind: 'rectangle',
    description: 'Compact bedroom, kids nursery, or guest bedroom',
  },
  {
    id: 'office-den',
    name: 'Home Office / Study',
    category: 'Bedrooms',
    icon: '💻',
    widthM: 3.2,
    heightM: 2.8,
    wallHeightM: 3.0,
    wallType: 'Interior Wall',
    kind: 'rectangle',
    description: 'Quiet study, library, or remote work office space',
  },

  // Sanitary
  {
    id: 'master-bath',
    name: 'Master En-Suite T&B',
    category: 'Sanitary',
    icon: '🛁',
    widthM: 2.4,
    heightM: 2.0,
    wallHeightM: 2.8,
    wallType: 'Partition Wall',
    kind: 'rectangle',
    description: 'Full bath with shower enclosure, vanity, and toilet fixture',
  },
  {
    id: 'common-tb',
    name: 'Common Toilet & Bath',
    category: 'Sanitary',
    icon: '🚿',
    widthM: 2.0,
    heightM: 1.8,
    wallHeightM: 2.8,
    wallType: 'Partition Wall',
    kind: 'rectangle',
    description: 'Standard 2.0m × 1.8m residential bathroom',
  },
  {
    id: 'powder-room',
    name: 'Powder Room',
    category: 'Sanitary',
    icon: '🧴',
    widthM: 1.6,
    heightM: 1.4,
    wallHeightM: 2.8,
    wallType: 'Partition Wall',
    kind: 'rectangle',
    description: 'Half-bath guest powder room with vanity sink and toilet',
  },

  // Outdoor & Utility
  {
    id: 'carport',
    name: 'Carport / Garage',
    category: 'Outdoor & Utility',
    icon: '🚗',
    widthM: 5.5,
    heightM: 3.2,
    wallHeightM: 3.0,
    wallType: 'Exterior Wall',
    kind: 'rectangle',
    description: '1-Vehicle covered parking bay / garage',
  },
  {
    id: 'front-porch',
    name: 'Front Porch / Veranda',
    category: 'Outdoor & Utility',
    icon: '🌿',
    widthM: 3.5,
    heightM: 1.8,
    wallHeightM: 1.2,
    wallType: 'Exterior Wall',
    kind: 'porch',
    description: 'Welcoming front entry deck with low parapet/rail wall',
  },
  {
    id: 'service-laundry',
    name: 'Service / Laundry Area',
    category: 'Outdoor & Utility',
    icon: '🧺',
    widthM: 2.8,
    heightM: 2.0,
    wallHeightM: 2.8,
    wallType: 'Partition Wall',
    kind: 'rectangle',
    description: 'Wet kitchen, utility sinks, washing machine, and drying line',
  },
  {
    id: 'balcony',
    name: 'Balcony / Lanai',
    category: 'Outdoor & Utility',
    icon: '🌅',
    widthM: 3.5,
    heightM: 2.0,
    wallHeightM: 1.1,
    wallType: 'Exterior Wall',
    kind: 'porch',
    description: 'Outdoor relaxation terrace with balustrade safety perimeter',
  },
];

/**
 * Generate Walls and Room Label for a rectangle room shape
 */
export function buildRoomShapeWalls(
  shape: DesignerRoomShape,
  chbAreaSqM: number = 0.08,
  startWallIndex: number = 1
): { walls: Wall[]; room: DesignerRoomLabel } {
  const wPx = shape.widthM * SCALE_PPM;
  const hPx = shape.heightM * SCALE_PPM;
  const x1 = Math.round(shape.x - wPx / 2);
  const x2 = Math.round(shape.x + wPx / 2);
  const y1 = Math.round(shape.y - hPx / 2);
  const y2 = Math.round(shape.y + hPx / 2);

  const wHeight = shape.wallHeightM || 3.0;
  const wType = shape.wallType || 'Exterior Wall';

  const w1Gross = Number((shape.widthM * wHeight).toFixed(2));
  const w2Gross = Number((shape.heightM * wHeight).toFixed(2));
  const w3Gross = Number((shape.widthM * wHeight).toFixed(2));
  const w4Gross = Number((shape.heightM * wHeight).toFixed(2));

  const id1 = `W${String(startWallIndex).padStart(2, '0')}`;
  const id2 = `W${String(startWallIndex + 1).padStart(2, '0')}`;
  const id3 = `W${String(startWallIndex + 2).padStart(2, '0')}`;
  const id4 = `W${String(startWallIndex + 3).padStart(2, '0')}`;

  const generatedWalls: Wall[] = [
    {
      id: id1,
      name: `${shape.name} (North Wall)`,
      type: wType,
      length: shape.widthM,
      height: wHeight,
      grossArea: w1Gross,
      openingArea: 0,
      netArea: w1Gross,
      baseCHB: Math.ceil(w1Gross / chbAreaSqM),
      color: wType === 'Exterior Wall' ? '#38bdf8' : '#818cf8',
      tracePoints: [{ x: x1, y: y1 }, { x: x2, y: y1 }],
      openings: [],
    },
    {
      id: id2,
      name: `${shape.name} (East Wall)`,
      type: wType,
      length: shape.heightM,
      height: wHeight,
      grossArea: w2Gross,
      openingArea: 0,
      netArea: w2Gross,
      baseCHB: Math.ceil(w2Gross / chbAreaSqM),
      color: wType === 'Exterior Wall' ? '#38bdf8' : '#818cf8',
      tracePoints: [{ x: x2, y: y1 }, { x: x2, y: y2 }],
      openings: [],
    },
    {
      id: id3,
      name: `${shape.name} (South Wall)`,
      type: wType,
      length: shape.widthM,
      height: wHeight,
      grossArea: w3Gross,
      openingArea: 0,
      netArea: w3Gross,
      baseCHB: Math.ceil(w3Gross / chbAreaSqM),
      color: wType === 'Exterior Wall' ? '#38bdf8' : '#818cf8',
      tracePoints: [{ x: x1, y: y2 }, { x: x2, y: y2 }],
      openings: [],
    },
    {
      id: id4,
      name: `${shape.name} (West Wall)`,
      type: wType,
      length: shape.heightM,
      height: wHeight,
      grossArea: w4Gross,
      openingArea: 0,
      netArea: w4Gross,
      baseCHB: Math.ceil(w4Gross / chbAreaSqM),
      color: wType === 'Exterior Wall' ? '#38bdf8' : '#818cf8',
      tracePoints: [{ x: x1, y: y1 }, { x: x1, y: y2 }],
      openings: [],
    },
  ];

  const roomArea = Number((shape.widthM * shape.heightM).toFixed(2));
  const roomLabel: DesignerRoomLabel = {
    id: `room-${shape.id}`,
    shapeId: shape.id,
    name: shape.name.toUpperCase(),
    x: shape.x,
    y: shape.y,
    widthM: shape.widthM,
    heightM: shape.heightM,
    customArea: roomArea,
  };

  return { walls: generatedWalls, room: roomLabel };
}

/**
 * Helper to compute distance from point to line segment
 */
export function distToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}
