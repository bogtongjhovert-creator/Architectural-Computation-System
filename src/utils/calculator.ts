import {
  CHBSettings,
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
  baseCHB: number;
} {
  const length = Math.max(0, Number(wall.length) || 0);
  const height = Math.max(0, Number(wall.height) || 0);
  const grossArea = Number((length * height).toFixed(3));

  const openingArea = Number(
    (wall.openings || []).reduce((acc, curr) => acc + (curr.area || calculateOpeningArea(curr)), 0).toFixed(3)
  );

  const netArea = Number(Math.max(0, grossArea - openingArea).toFixed(3));
  const safeChbArea = chbAreaSqM > 0 ? chbAreaSqM : 0.08;
  
  // Always round upward to the next whole block as per requirement #7
  const baseCHB = Math.ceil(netArea / safeChbArea);

  return {
    grossArea,
    openingArea,
    netArea,
    baseCHB,
  };
}

/**
 * Calculates project-wide totals and auxiliary estimates (Mortar, Plaster, Rebar)
 */
export function calculateProjectTotals(
  walls: Wall[],
  chbSettings: CHBSettings,
  wastePercentage: number = 10
): ProjectTotals {
  const safeChbArea = chbSettings.areaSqM > 0 ? chbSettings.areaSqM : 0.08;
  const safeWaste = Math.max(0, Number(wastePercentage) || 0);

  let totalLengthM = 0;
  let totalGrossAreaSqM = 0;
  let totalOpeningAreaSqM = 0;
  let totalNetAreaSqM = 0;

  walls.forEach((wall) => {
    const metrics = calculateWallMetrics(wall, safeChbArea);
    totalLengthM += Number(wall.length) || 0;
    totalGrossAreaSqM += metrics.grossArea;
    totalOpeningAreaSqM += metrics.openingArea;
    totalNetAreaSqM += metrics.netArea;
  });

  totalLengthM = Number(totalLengthM.toFixed(2));
  totalGrossAreaSqM = Number(totalGrossAreaSqM.toFixed(2));
  totalOpeningAreaSqM = Number(totalOpeningAreaSqM.toFixed(2));
  totalNetAreaSqM = Number(totalNetAreaSqM.toFixed(2));

  // Base CHB: Net Area ÷ CHB Area (rounded upward)
  const baseCHBQuantity = Math.ceil(totalNetAreaSqM / safeChbArea);

  // Final CHB: Base CHB × (1 + Waste Percentage)
  const wasteMultiplier = 1 + safeWaste / 100;
  const finalCHBQuantity = Math.ceil(baseCHBQuantity * wasteMultiplier);
  const wasteQuantity = finalCHBQuantity - baseCHBQuantity;

  // Auxiliary Engineering Estimates (Philippine / International Construction Standard for CHB):
  // For 150mm (6") CHB: ~12 bags cement per 100 blocks mortar/core fill + 0.9 cu.m sand
  // For 100mm (4") CHB: ~9 bags cement per 100 blocks + 0.6 cu.m sand
  // Plastering both sides: ~0.25 bags cement per m² of wall area
  const is100mm = chbSettings.thicknessMm <= 100;
  const cementPer100Blocks = is100mm ? 9.5 : 12.0;
  const sandPer100Blocks = is100mm ? 0.65 : 0.95;

  const mortarCementBags = Math.ceil((finalCHBQuantity / 100) * cementPer100Blocks);
  const plasterCementBags = Math.ceil(totalNetAreaSqM * 2 * 0.13); // 2 sides, ~0.13 bags/m²
  const totalCementBags = mortarCementBags + plasterCementBags;
  const sandCubicMeters = Number(((finalCHBQuantity / 100) * sandPer100Blocks + (totalNetAreaSqM * 2 * 0.015)).toFixed(2));
  // 10mm rebars spaced 600mm horizontal & 800mm vertical: approx 0.85 pcs (6m length) per m²
  const rebarPieces10mm = Math.ceil(totalNetAreaSqM * 0.85);

  return {
    wallCount: walls.length,
    totalLengthM,
    totalGrossAreaSqM,
    totalOpeningAreaSqM,
    totalNetAreaSqM,
    baseCHBQuantity,
    wastePercentage: safeWaste,
    wasteQuantity,
    finalCHBQuantity,
    chbAreaSqM: safeChbArea,
    chbPerSqM: chbSettings.blocksPerSqM,
    mortarCementBags,
    plasterCementBags,
    totalCementBags,
    sandCubicMeters,
    rebarPieces10mm,
  };
}

/**
 * Generates transparent calculation audit data for a single wall
 */
export function generateWallAudit(
  wall: Wall,
  chbSettings: CHBSettings,
  wastePercentage: number = 10
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
      formula: 'Total Opening Area = Σ (Door Area + Window Area)',
      substitution:
        wall.openings.length > 0
          ? wall.openings
              .map(
                (o) =>
                  `${o.label || o.type}: (${o.width.toFixed(2)} × ${o.height.toFixed(2)}${
                    o.quantity > 1 ? ` × ${o.quantity}` : ''
                  } = ${o.area.toFixed(2)} m²)`
              )
              .join(' + ')
          : 'No door or window openings attached to this wall (0.00 m²)',
      result: `${metrics.openingArea.toFixed(2)} m²`,
    },
    {
      title: '3. Net Wall Area',
      formula: 'Net Wall Area = Gross Wall Area − Total Opening Area',
      substitution: `${metrics.grossArea.toFixed(2)} m² − ${metrics.openingArea.toFixed(2)} m²`,
      result: `${metrics.netArea.toFixed(2)} m²`,
    },
    {
      title: '4. Hollow Block Unit Coverage',
      formula: 'CHB Area = Length (m) × Height (m)',
      substitution: `${(chbSettings.lengthMm / 1000).toFixed(2)} m × ${(
        chbSettings.heightMm / 1000
      ).toFixed(2)} m (${chbSettings.lengthMm} × ${chbSettings.heightMm} mm)`,
      result: `${chbSettings.areaSqM.toFixed(4)} m² (${chbSettings.blocksPerSqM} pcs/m²)`,
    },
    {
      title: '5. Base Hollow Block Quantity',
      formula: 'Base CHB = ⌈Net Wall Area ÷ CHB Area⌉ (Round upward)',
      substitution: `${metrics.netArea.toFixed(2)} ÷ ${chbSettings.areaSqM.toFixed(4)} = ${(
        metrics.netArea / chbSettings.areaSqM
      ).toFixed(2)}`,
      result: `${metrics.baseCHB.toLocaleString()} pcs`,
    },
    {
      title: '6. Waste Allowance & Final Wall Quantity',
      formula: 'Final CHB = ⌈Base CHB × (1 + Waste Percentage)⌉',
      substitution: `${metrics.baseCHB.toLocaleString()} × (1 + ${(wastePercentage / 100).toFixed(
        2
      )}) = ${metrics.baseCHB.toLocaleString()} × ${wasteMultiplier.toFixed(2)}`,
      result: `${finalCHB.toLocaleString()} pcs (at ${wastePercentage}% waste)`,
    },
  ];

  return {
    wallId: wall.id,
    wallName: wall.name || `Wall ${wall.id}`,
    steps,
    netWallArea: metrics.netArea,
    baseCHB: metrics.baseCHB,
    wastePercentage,
    finalCHB,
  };
}

/**
 * Generates plain text calculation summary for copying or reports
 */
export function formatProjectCalculationText(
  projectTotals: ProjectTotals,
  chbSettings: CHBSettings
): string {
  return `=== BLUEPRINT CHB QUANTITY CALCULATION AUDIT ===
CHB Unit Dimensions : ${chbSettings.lengthMm} mm × ${chbSettings.heightMm} mm × ${chbSettings.thicknessMm} mm
CHB Unit Area       : ${(chbSettings.lengthMm / 1000).toFixed(2)} m × ${(chbSettings.heightMm / 1000).toFixed(2)} m = ${chbSettings.areaSqM.toFixed(4)} m²
CHB per Square Meter: 1 ÷ ${chbSettings.areaSqM.toFixed(4)} = ${chbSettings.blocksPerSqM} pcs/m²

--- WALL DIMENSIONS ---
Total Wall Length   : ${projectTotals.totalLengthM.toFixed(2)} m
Gross Wall Area     : ${projectTotals.totalGrossAreaSqM.toFixed(2)} m²
Total Opening Area  : ${projectTotals.totalOpeningAreaSqM.toFixed(2)} m² (Deducted Doors & Windows)
Net Wall Area       : ${projectTotals.totalNetAreaSqM.toFixed(2)} m²

--- CALCULATION SUMMARY ---
Base CHB Quantity   : ${projectTotals.totalNetAreaSqM.toFixed(2)} ÷ ${chbSettings.areaSqM.toFixed(4)} = ${projectTotals.baseCHBQuantity.toLocaleString()} pcs
Waste Allowance     : ${projectTotals.wastePercentage}%
Waste Margin        : +${projectTotals.wasteQuantity.toLocaleString()} pcs
--------------------------------------------------
RECOMMENDED CHB     : ${projectTotals.finalCHBQuantity.toLocaleString()} PCS
--------------------------------------------------

--- ESTIMATED AUXILIARY MATERIALS ---
Mortar / Fill Cement: ${projectTotals.mortarCementBags} bags (40kg)
Plastering Cement   : ${projectTotals.plasterCementBags} bags (40kg)
Total Portland Cement: ${projectTotals.totalCementBags} bags
Washed Sand (Screened): ${projectTotals.sandCubicMeters} m³
10mm Steel Rebars (6m): ${projectTotals.rebarPieces10mm} pcs
`;
}
