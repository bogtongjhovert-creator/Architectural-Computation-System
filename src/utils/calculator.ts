import {
  BuildingElevation,
  CHBSettings,
  EngineeringSettings,
  Opening,
  ProjectTotals,
  Wall,
  WallCalculationAudit,
} from '../types';

export const DEFAULT_CHB_SETTINGS: CHBSettings = {
  lengthMm: 400,
  heightMm: 200,
  thicknessMm: 150,
  lengthM: 0.4,
  heightM: 0.2,
  areaSqM: 0.08,
  blocksPerSqM: 12.5,
};

export const DEFAULT_ENGINEERING_SETTINGS: EngineeringSettings = {
  plasterScope: 'both',
  rebarSpacing: 'standard',
  rcColumnsCount: 0,
  rcColumnWidthM: 0.2,
};

export const DEFAULT_BUILDING_ELEVATION: BuildingElevation = {
  groundToFloorElevationM: 0.45,
  floorToCeilingHeightM: 3.00,
  foundationDepthM: 0.60,
  includePlinthMasonry: false,
  plinthMasonryHeightM: 0.45,
  gableRoofHeightM: 1.50,
  hasGableWalls: false,
  gableWallsCount: 2,
  parapetHeightM: 0.80,
  hasParapet: false,
  numberOfStories: 1,
};

/**
 * Encodes CHB dimensions and calculates coverage values mathematically.
 * 400 mm = 0.40 m, 200 mm = 0.20 m -> 0.40 * 0.20 = 0.08 m²
 * CHB per m² = 1 / 0.08 = 12.5 pcs
 */
export function buildCHBSettings(
  lengthMm: number,
  heightMm: number,
  thicknessMm: number = 150
): CHBSettings {
  const safeLength = Math.max(10, Number(lengthMm) || 400);
  const safeHeight = Math.max(10, Number(heightMm) || 200);
  const safeThickness = Math.max(10, Number(thicknessMm) || 150);

  const lengthM = safeLength / 1000;
  const heightM = safeHeight / 1000;
  const areaSqM = Number((lengthM * heightM).toFixed(4));
  const blocksPerSqM = Number((1 / areaSqM).toFixed(2));

  return {
    lengthMm: safeLength,
    heightMm: safeHeight,
    thicknessMm: safeThickness,
    lengthM,
    heightM,
    areaSqM,
    blocksPerSqM,
  };
}

/**
 * Calculates opening area for a single opening (width * height * qty)
 */
export function calculateOpeningArea(opening: Partial<Opening>): number {
  const w = Math.max(0, Number(opening.width) || 0);
  const h = Math.max(0, Number(opening.height) || 0);
  const qty = Math.max(1, Math.round(Number(opening.quantity) || 1));
  return Number((w * h * qty).toFixed(3));
}

/**
 * Recalculates gross, opening, net area and base CHB for a wall
 */
export function calculateWallMetrics(
  wall: {
    length: number;
    height: number;
    openings: Opening[];
  },
  chbAreaSqM: number = 0.08
): {
  grossArea: number;
  openingArea: number;
  netArea: number;
  exactCHB: number;
  baseCHB: number;
} {
  const length = Math.max(0, Number(wall.length) || 0);
  const height = Math.max(0, Number(wall.height) || 0);
  const grossArea = Number((length * height).toFixed(3));

  const openingArea = Number(
    (wall.openings || [])
      .reduce((acc, curr) => acc + (curr.area || calculateOpeningArea(curr)), 0)
      .toFixed(3)
  );

  const netArea = Number(Math.max(0, grossArea - openingArea).toFixed(3));
  const safeChbArea = chbAreaSqM > 0 ? chbAreaSqM : 0.08;

  // Exact unrounded decimal
  const exactCHB = Number((netArea / safeChbArea).toFixed(2));
  // Round upward to the next whole block for single wall procurement
  const baseCHB = Math.ceil(exactCHB);

  return {
    grossArea,
    openingArea,
    netArea,
    exactCHB,
    baseCHB,
  };
}

/**
 * Calculates project-wide totals and auxiliary estimates with strict DPWH & ASTM standard precision
 */
export function calculateProjectTotals(
  walls: Wall[],
  chbSettings: CHBSettings,
  wastePercentage: number = 8,
  engineering: EngineeringSettings = DEFAULT_ENGINEERING_SETTINGS,
  elevation: BuildingElevation = DEFAULT_BUILDING_ELEVATION
): ProjectTotals {
  const safeChbArea = chbSettings.areaSqM > 0 ? chbSettings.areaSqM : 0.08;
  const safeWaste = Math.max(0, Number(wastePercentage) || 0);

  let totalLengthM = 0;
  let totalGrossAreaSqM = 0;
  let totalOpeningAreaSqM = 0;

  walls.forEach((wall) => {
    const metrics = calculateWallMetrics(wall, safeChbArea);
    totalLengthM += Number(wall.length) || 0;
    totalGrossAreaSqM += metrics.grossArea;
    totalOpeningAreaSqM += metrics.openingArea;
  });

  // Calculate Additional Gable Wall Masonry if enabled
  let gableAddAreaSqM = 0;
  if (elevation.hasGableWalls && elevation.gableRoofHeightM > 0) {
    // Average exterior wall span (or standard building width ~7m)
    // Triangle area = 0.5 * base * height * count
    const extWalls = walls.filter((w) => w.type === 'Exterior Wall' || w.type === 'Firewall');
    const avgSpan = extWalls.length > 0 ? (extWalls.reduce((a, b) => a + b.length, 0) / extWalls.length) : 7.0;
    const gableCount = Math.max(1, elevation.gableWallsCount || 2);
    gableAddAreaSqM = Number((0.5 * avgSpan * elevation.gableRoofHeightM * gableCount).toFixed(2));
  }

  // Calculate Additional Plinth Stem Wall Masonry if enabled
  let plinthAddAreaSqM = 0;
  if (elevation.includePlinthMasonry && elevation.plinthMasonryHeightM > 0) {
    const perimeterLength = walls
      .filter((w) => w.type === 'Exterior Wall' || w.type === 'Firewall' || w.type === 'Perimeter / Fence')
      .reduce((a, b) => a + b.length, 0);
    const effectiveLen = perimeterLength > 0 ? perimeterLength : totalLengthM;
    plinthAddAreaSqM = Number((effectiveLen * elevation.plinthMasonryHeightM).toFixed(2));
  }

  totalGrossAreaSqM += gableAddAreaSqM + plinthAddAreaSqM;

  totalLengthM = Number(totalLengthM.toFixed(2));
  totalGrossAreaSqM = Number(totalGrossAreaSqM.toFixed(2));
  totalOpeningAreaSqM = Number(totalOpeningAreaSqM.toFixed(2));

  // RC Column or Corner deduction if configured
  const avgHeight = walls.length > 0 ? totalGrossAreaSqM / Math.max(0.1, totalLengthM) : (elevation.floorToCeilingHeightM || 3.0);
  const colCount = Math.max(0, engineering.rcColumnsCount || 0);
  const colWidth = Math.max(0, engineering.rcColumnWidthM || 0.2);
  const columnDeductionAreaSqM = Number((colCount * colWidth * avgHeight).toFixed(2));

  // True Net Masonry Area
  const totalNetAreaSqM = Number(
    Math.max(0, totalGrossAreaSqM - totalOpeningAreaSqM - columnDeductionAreaSqM).toFixed(2)
  );

  // Exact base block count before ceiling
  const exactBaseCHB = Number((totalNetAreaSqM / safeChbArea).toFixed(2));
  const baseCHBQuantity = Math.ceil(exactBaseCHB);

  // Final CHB with non-exaggerated, transparent waste margin
  const wasteMultiplier = 1 + safeWaste / 100;
  const finalCHBQuantity = Math.ceil(baseCHBQuantity * wasteMultiplier);
  const wasteQuantity = finalCHBQuantity - baseCHBQuantity;

  // Elevation Level Metrics
  const stories = Math.max(1, elevation.numberOfStories || 1);
  const fflElevationM = Number((elevation.groundToFloorElevationM || 0.45).toFixed(2));
  const wallClearHeight = Number((elevation.floorToCeilingHeightM || 3.0).toFixed(2));
  const topOfWallElevationM = Number((fflElevationM + (wallClearHeight * stories)).toFixed(2));
  const gableRise = elevation.hasGableWalls ? (elevation.gableRoofHeightM || 1.5) : (elevation.hasParapet ? (elevation.parapetHeightM || 0.8) : 0);
  const totalApexElevationM = Number((topOfWallElevationM + gableRise).toFixed(2));
  const totalBuildingHeightM = Number((totalApexElevationM).toFixed(2)); // NGL to apex
  const totalStructuralHeightM = Number((totalBuildingHeightM + (elevation.foundationDepthM || 0.6)).toFixed(2));

  // =========================================================================
  // AUXILIARY MATERIALS: Strictly Grounded in Philippine DPWH & NSCP Standards
  // =========================================================================
  
  // 1. Mortar & Cell Fill (Class B 1:3 mix, 12mm mortar joint):
  // 100mm (4") CHB: 5.25 bags cement & 0.0435 m³ sand per 100 blocks
  // 150mm (6") CHB: 8.00 bags cement & 0.0670 m³ sand per 100 blocks
  // 200mm (8") CHB: 12.50 bags cement & 0.1040 m³ sand per 100 blocks
  let cementPer100 = 8.0;
  let sandPer100 = 0.067;
  if (chbSettings.thicknessMm <= 100) {
    cementPer100 = 5.25;
    sandPer100 = 0.0435;
  } else if (chbSettings.thicknessMm >= 200) {
    cementPer100 = 12.5;
    sandPer100 = 0.104;
  }

  const mortarCementBags = Math.ceil((finalCHBQuantity / 100) * cementPer100);
  const mortarSandCuM = (finalCHBQuantity / 100) * sandPer100;

  // 2. Plastering (16mm coat, 1:3 mix):
  // 1 side: 0.096 bags cement / m², 0.016 m³ sand / m²
  // 2 sides: 0.192 bags cement / m², 0.032 m³ sand / m²
  // None: 0
  let plasterFactor = 0.192;
  let plasterSandFactor = 0.032;
  if (engineering.plasterScope === 'one') {
    plasterFactor = 0.096;
    plasterSandFactor = 0.016;
  } else if (engineering.plasterScope === 'none') {
    plasterFactor = 0;
    plasterSandFactor = 0;
  }

  const plasterCementBags = Math.ceil(totalNetAreaSqM * plasterFactor);
  const plasterSandCuM = totalNetAreaSqM * plasterSandFactor;

  const totalCementBags = mortarCementBags + plasterCementBags;
  const sandCubicMeters = Number((mortarSandCuM + plasterSandCuM).toFixed(2));

  // 3. 10mm Deformed Reinforcing Steel Bars (RSB, 6.0m length):
  // Standard (600mm vert / 600mm horiz): ~0.31 pcs (6m length) per m²
  // Dense (400mm vert / 400mm horiz): ~0.46 pcs per m²
  // Light (800mm vert / 600mm horiz): ~0.24 pcs per m²
  // None: 0
  let rebarFactor = 0.31;
  if (engineering.rebarSpacing === 'dense') {
    rebarFactor = 0.46;
  } else if (engineering.rebarSpacing === 'light') {
    rebarFactor = 0.24;
  } else if (engineering.rebarSpacing === 'none') {
    rebarFactor = 0;
  }

  const rebarPieces10mm = Math.ceil(totalNetAreaSqM * rebarFactor);

  // 4. #16 G.I. Tie Wire: 0.025 kg per m² of reinforced masonry
  const tieWireKg = Number((totalNetAreaSqM * 0.025).toFixed(1));

  return {
    wallCount: walls.length,
    totalLengthM,
    totalGrossAreaSqM,
    totalOpeningAreaSqM,
    columnDeductionAreaSqM,
    totalNetAreaSqM,
    exactBaseCHB,
    baseCHBQuantity,
    wastePercentage: safeWaste,
    wasteQuantity,
    finalCHBQuantity,
    chbAreaSqM: safeChbArea,
    chbPerSqM: chbSettings.blocksPerSqM,
    fflElevationM,
    topOfWallElevationM,
    totalApexElevationM,
    totalBuildingHeightM,
    totalStructuralHeightM,
    gableAddAreaSqM,
    plinthAddAreaSqM,
    mortarCementBags,
    plasterCementBags,
    totalCementBags,
    sandCubicMeters,
    rebarPieces10mm,
    tieWireKg,
    plasterScope: engineering.plasterScope,
    rebarSpacing: engineering.rebarSpacing,
  };
}

/**
 * Generates transparent calculation audit data for a single wall
 */
export function generateWallAudit(
  wall: Wall,
  chbSettings: CHBSettings,
  wastePercentage: number = 8
): WallCalculationAudit {
  const metrics = calculateWallMetrics(wall, chbSettings.areaSqM);
  const wasteMultiplier = 1 + wastePercentage / 100;
  const finalCHB = Math.ceil(metrics.baseCHB * wasteMultiplier);

  const steps = [
    {
      title: '1. Gross Wall Area',
      formula: 'Gross Area = Wall Length × Wall Height',
      substitution: `${wall.length.toFixed(2)} m × ${wall.height.toFixed(2)} m`,
      result: `${metrics.grossArea.toFixed(2)} m²`,
    },
    {
      title: '2. Total Openings Deduction',
      formula: 'Total Opening Area = Σ (Door Area + Window Area + Custom Openings)',
      substitution:
        wall.openings.length > 0
          ? wall.openings
              .map(
                (o) =>
                  `${o.label || o.type}: (${o.width.toFixed(2)}m × ${o.height.toFixed(2)}m${
                    o.quantity > 1 ? ` × ${o.quantity}` : ''
                  } = ${o.area.toFixed(2)} m²)`
              )
              .join(' + ')
          : 'No door or window openings on this wall (0.00 m²)',
      result: `${metrics.openingArea.toFixed(2)} m²`,
    },
    {
      title: '3. Net Masonry Wall Area',
      formula: 'Net Wall Area = Gross Wall Area − Total Opening Area',
      substitution: `${metrics.grossArea.toFixed(2)} m² − ${metrics.openingArea.toFixed(2)} m²`,
      result: `${metrics.netArea.toFixed(2)} m²`,
    },
    {
      title: '4. Hollow Block Unit Coverage Ratio',
      formula: 'CHB Area = Length (m) × Height (m) | Blocks/m² = 1 ÷ CHB Area',
      substitution: `${(chbSettings.lengthMm / 1000).toFixed(2)} m × ${(
        chbSettings.heightMm / 1000
      ).toFixed(2)} m = ${chbSettings.areaSqM.toFixed(4)} m²`,
      result: `${chbSettings.blocksPerSqM} pcs/m² (Exact: ${(1 / chbSettings.areaSqM).toFixed(4)} pcs/m²)`,
    },
    {
      title: '5. Base Hollow Block Quantity',
      formula: 'Base CHB = Net Wall Area × Blocks/m² (or Net Area ÷ CHB Area)',
      substitution: `${metrics.netArea.toFixed(2)} m² ÷ ${chbSettings.areaSqM.toFixed(4)} m² = ${metrics.exactCHB.toFixed(2)} pcs`,
      result: `${metrics.baseCHB.toLocaleString()} pcs (Ceiling: ⌈${metrics.exactCHB.toFixed(2)}⌉)`,
    },
    {
      title: '6. Waste Allowance & Recommended Wall Order',
      formula: 'Final CHB = ⌈Base CHB × (1 + Waste% / 100)⌉',
      substitution: `${metrics.baseCHB.toLocaleString()} pcs × (1 + ${(wastePercentage / 100).toFixed(
        2
      )}) = ${metrics.baseCHB.toLocaleString()} × ${wasteMultiplier.toFixed(2)} = ${(
        metrics.baseCHB * wasteMultiplier
      ).toFixed(2)} pcs`,
      result: `${finalCHB.toLocaleString()} pcs (+${wastePercentage}% waste allowance)`,
    },
  ];

  return {
    wallId: wall.id,
    wallName: wall.name || `Wall ${wall.id}`,
    steps,
    netWallArea: metrics.netArea,
    exactCHB: metrics.exactCHB,
    baseCHB: metrics.baseCHB,
    wastePercentage,
    finalCHB,
  };
}

/**
 * Generates plain text calculation summary for copying or professional reports
 */
export function formatProjectCalculationText(
  projectTotals: ProjectTotals,
  chbSettings: CHBSettings
): string {
  return `=== ARCHITECTURAL CHB QUANTITY ESTIMATION AUDIT ===
[Standard Metric Engineering Precision - DPWH & ASTM C90 Compliant]

--- 1. CHB UNIT SPECIFICATIONS ---
Dimensions           : ${chbSettings.lengthMm} mm (L) × ${chbSettings.heightMm} mm (H) × ${chbSettings.thicknessMm} mm (T)
Nominal Face Area    : ${(chbSettings.lengthMm / 1000).toFixed(2)} m × ${(chbSettings.heightMm / 1000).toFixed(2)} m = ${chbSettings.areaSqM.toFixed(4)} m²
Standard Unit Factor : 1 ÷ ${chbSettings.areaSqM.toFixed(4)} m² = ${chbSettings.blocksPerSqM} pcs/m²

--- 2. WALL SCHEDULE & AREA DEDUCTIONS ---
Total Wall Count     : ${projectTotals.wallCount} Walls
Total Linear Length  : ${projectTotals.totalLengthM.toFixed(2)} m
Gross Wall Area      : ${projectTotals.totalGrossAreaSqM.toFixed(2)} m²
Total Openings Area  : −${projectTotals.totalOpeningAreaSqM.toFixed(2)} m² (Door & Window Deductions)
${
  projectTotals.columnDeductionAreaSqM > 0
    ? `Column Deductions    : −${projectTotals.columnDeductionAreaSqM.toFixed(2)} m² (RC Structural Columns)\n`
    : ''
}Net Masonry Area     : ${projectTotals.totalNetAreaSqM.toFixed(2)} m²

--- 3. HOLLOW BLOCK QUANTITY ARITHMETIC ---
Exact Block Count    : ${projectTotals.totalNetAreaSqM.toFixed(2)} m² × ${chbSettings.blocksPerSqM} pcs/m² = ${projectTotals.exactBaseCHB.toFixed(2)} pcs
Base Whole Blocks    : ⌈${projectTotals.exactBaseCHB.toFixed(2)}⌉ = ${projectTotals.baseCHBQuantity.toLocaleString()} pcs
Waste Allowance      : ${projectTotals.wastePercentage}% (+${projectTotals.wasteQuantity.toLocaleString()} pcs margin)
==================================================
FINAL RECOMMENDED CHB: ${projectTotals.finalCHBQuantity.toLocaleString()} PCS
==================================================

--- 4. AUXILIARY MATERIALS ESTIMATE (DPWH Masonry Standards) ---
• Mortar / Core Fill Cement : ${projectTotals.mortarCementBags} bags (40kg Portland, Class B 1:3 mix)
• Plastering Cement (${projectTotals.plasterScope === 'both' ? '2-Sides' : projectTotals.plasterScope === 'one' ? '1-Side' : 'None'}) : ${projectTotals.plasterCementBags} bags (40kg Portland, 16mm coat)
• Total Portland Cement     : ${projectTotals.totalCementBags} bags (40kg)
• Washed Screened Sand      : ${projectTotals.sandCubicMeters} m³ (Cu. meters)
• 10mm Deformed RSB (6.0m)  : ${projectTotals.rebarPieces10mm} pcs (${projectTotals.rebarSpacing} structural spacing)
• #16 G.I. Tie Wire         : ${projectTotals.tieWireKg} kg
`;
}
