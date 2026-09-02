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
  exactCHB?: number; // unrounded exact decimal (e.g. 334.5 pcs)
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

export type PlasteringScope = 'both' | 'one' | 'none';
export type RebarSpacing = 'standard' | 'dense' | 'light' | 'none';

export interface EngineeringSettings {
  plasterScope: PlasteringScope; // both sides (0.192 bags/m²), one side (0.096 bags/m²), none (0)
  rebarSpacing: RebarSpacing; // standard (600mm vert/horiz ~0.31 pcs/m²), dense (400mm ~0.48 pcs/m²), light (800mm ~0.24 pcs/m²), none
  rcColumnsCount: number; // number of 0.20m RC columns embedded in masonry (each deducts column area)
  rcColumnWidthM: number; // default 0.20m
}

export interface BuildingElevation {
  groundToFloorElevationM: number; // Finished Floor Line (FFL) above Natural Ground Level (NGL), e.g. 0.45m
  floorToCeilingHeightM: number; // Clear floor-to-ceiling / wall height, e.g. 3.00m
  foundationDepthM: number; // Footing / plinth stem wall below ground, e.g. 0.60m
  includePlinthMasonry: boolean; // Whether stem wall CHB below FFL is included in masonry
  plinthMasonryHeightM: number; // Stem wall height if included, e.g. 0.45m
  gableRoofHeightM: number; // Triangular gable roof / apex rise height, e.g. 1.50m
  hasGableWalls: boolean; // Whether gable apex masonry is included
  gableWallsCount: number; // Number of gable ends, e.g. 2
  parapetHeightM: number; // Parapet / firewall extension above ceiling beam, e.g. 0.80m
  hasParapet: boolean; // Whether parapet extension is included
  numberOfStories: number; // 1 = 1-Storey Bungalow, 2 = 2-Storey, etc.
}

export interface BlueprintProject {
  id: string;
  projectName: string;
  blueprintName: string;
  blueprintDataUrl: string | null;
  blueprintFileType: 'image' | 'pdf' | 'sample' | 'none';
  floorArea: number; // in m²
  chbSettings: CHBSettings;
  wastePercentage: number; // e.g. 5, 8, 10
  engineeringSettings?: EngineeringSettings;
  elevation?: BuildingElevation;
  walls: Wall[];
  scale: ScaleCalibration;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface DesignerDoor {
  id: string;
  wallId?: string;
  x: number; // in meters relative to canvas origin
  y: number;
  rotation?: number; // degrees
  widthM: number; // e.g. 0.90
  heightM?: number; // e.g. 2.10
  label: string;
  swingDirection?: 'left-in' | 'left-out' | 'right-in' | 'right-out' | 'sliding' | 'double';
}

export interface DesignerWindow {
  id: string;
  wallId?: string;
  x: number; // in meters
  y: number;
  rotation?: number;
  widthM: number; // e.g. 1.20
  heightM: number; // e.g. 1.20
  label: string;
}

export interface DesignerRoomLabel {
  id: string;
  name: string;
  x: number;
  y: number;
  widthM?: number;
  heightM?: number;
  customArea?: number;
}

export interface DesignerDimension {
  id: string;
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  label: string;
  offset: number;
}

export interface DesignerColumn {
  id: string;
  x: number;
  y: number;
  sizeM: number; // e.g. 0.20
}

export interface DesignerPlanState {
  walls: Wall[];
  doors: DesignerDoor[];
  windows: DesignerWindow[];
  rooms: DesignerRoomLabel[];
  dimensions: DesignerDimension[];
  columns: DesignerColumn[];
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
  exactCHB: number;
  baseCHB: number;
  wastePercentage: number;
  finalCHB: number;
}

export interface ProjectTotals {
  wallCount: number;
  totalLengthM: number;
  totalGrossAreaSqM: number;
  totalOpeningAreaSqM: number;
  columnDeductionAreaSqM: number;
  totalNetAreaSqM: number;
  exactBaseCHB: number; // Unrounded decimal base (e.g. 1419.62)
  baseCHBQuantity: number; // Math.ceil(exactBaseCHB)
  wastePercentage: number;
  wasteQuantity: number;
  finalCHBQuantity: number;
  chbAreaSqM: number;
  chbPerSqM: number;
  // Elevation Level Metrics
  fflElevationM: number; // Finished Floor Level (+0.45m)
  topOfWallElevationM: number; // Beam/Top of wall level (+3.45m)
  totalApexElevationM: number; // Ridge / roof apex level (+4.95m)
  totalBuildingHeightM: number; // Total height from NGL to apex
  totalStructuralHeightM: number; // From footing to apex
  gableAddAreaSqM: number; // Additional area if gable triangle masonry is enabled
  plinthAddAreaSqM: number; // Additional area if plinth stem wall is enabled
  // Accurate auxiliary construction materials (DPWH / NSCP Standards)
  mortarCementBags: number;
  plasterCementBags: number;
  totalCementBags: number;
  sandCubicMeters: number;
  rebarPieces10mm: number;
  tieWireKg: number;
  plasterScope: PlasteringScope;
  rebarSpacing: RebarSpacing;
}

