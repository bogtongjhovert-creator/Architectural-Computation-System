export interface CHBSettings {
  lengthMm: number; // e.g. 400
  heightMm: number; // e.g. 200
  thicknessMm: number; // e.g. 100, 150, 200 (4", 6", 8")
  lengthM: number; // derived 0.40
  heightM: number; // derived 0.20
  areaSqM: number; // derived 0.08
  blocksPerSqM: number; // derived 12.5
}

export type OpeningType = 'door' | 'window' | 'vent' | 'custom';

export interface Opening {
  id: string;
  type: OpeningType;
  label: string; // e.g., "Main Door (D1)"
  width: number; // in meters e.g. 0.90
  height: number; // in meters e.g. 2.10
  quantity: number; // default 1
  area: number; // width * height * quantity
}

export type WallType =
  | 'Exterior Wall'
  | 'Interior Wall'
  | 'Perimeter / Fence'
  | 'Partition Wall'
  | 'Firewall'
  | 'Retaining / Shear';

export interface WallTracePoint {
  x: number;
  y: number;
}

export interface Wall {
  id: string; // e.g. "W01"
  name: string; // e.g. "Front Exterior Wall"
  type: WallType;
  length: number; // in meters e.g. 6.00
  height: number; // in meters e.g. 3.00
  openings: Opening[];
  grossArea: number; // length * height
  openingArea: number; // sum of openings
  netArea: number; // grossArea - openingArea
  baseCHB: number; // Math.ceil(netArea / chbArea)
  color?: string;
  tracePoints?: [WallTracePoint, WallTracePoint]; // canvas coordinates if drawn on blueprint
  isAutoDetected?: boolean;
}

export interface ScaleCalibration {
  isCalibrated: boolean;
  p1: WallTracePoint | null;
  p2: WallTracePoint | null;
  pixelDistance: number;
  realDistanceMeters: number;
  pixelsPerMeter: number;
}

export interface BlueprintProject {
  id: string;
  projectName: string;
  blueprintName: string;
  blueprintDataUrl: string | null;
  blueprintFileType: 'image' | 'pdf' | 'sample' | 'none';
  floorArea: number; // in m²
  chbSettings: CHBSettings;
  wastePercentage: number; // e.g. 10
  walls: Wall[];
  scale: ScaleCalibration;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface CalculationAuditStep {
  title: string;
  formula: string;
  substitution: string;
  result: string;
}

export interface WallCalculationAudit {
  wallId: string;
  wallName: string;
  steps: CalculationAuditStep[];
  netWallArea: number;
  baseCHB: number;
  wastePercentage: number;
  finalCHB: number;
}

export interface ProjectTotals {
  wallCount: number;
  totalLengthM: number;
  totalGrossAreaSqM: number;
  totalOpeningAreaSqM: number;
  totalNetAreaSqM: number;
  baseCHBQuantity: number;
  wastePercentage: number;
  wasteQuantity: number;
  finalCHBQuantity: number;
  chbAreaSqM: number;
  chbPerSqM: number;
  // Estimated auxiliary materials (BOM)
  mortarCementBags: number;
  plasterCementBags: number;
  totalCementBags: number;
  sandCubicMeters: number;
  rebarPieces10mm: number;
}
