import React, { useState } from 'react';
import { Wall, CHBSettings, ProjectTotals } from '../types';
import {
  generateWallAudit,
  formatProjectCalculationText,
} from '../utils/calculator';
import {
  FileText,
  X,
  Copy,
  Check,
  Printer,
  Calculator,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wall: Wall | null; // null means project-wide calculation audit
  allWalls: Wall[];
  chbSettings: CHBSettings;
  wastePercentage: number;
  projectTotals: ProjectTotals;
  projectName: string;
}

export const CalculationDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  wall,
  allWalls,
  chbSettings,
  wastePercentage,
  projectTotals,
  projectName,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const isSingleWall = wall !== null;
  const wallAudit = isSingleWall
    ? generateWallAudit(wall, chbSettings, wastePercentage)
    : null;

  const fullTextAudit = formatProjectCalculationText(projectTotals, chbSettings);

  const handleCopy = () => {
    let textToCopy = '';
    if (isSingleWall && wallAudit) {
      textToCopy =
        `=== CALCULATION AUDIT: WALL ${wallAudit.wallId} (${wallAudit.wallName}) ===\n` +
        wallAudit.steps
          .map((s) => `${s.title}\nFormula: ${s.formula}\nValues: ${s.substitution}\nResult: ${s.result}\n`)
          .join('\n') +
        `\nRECOMMENDED CHB FOR WALL: ${wallAudit.finalCHB.toLocaleString()} PCS (at ${wastePercentage}% waste)\n`;
    } else {
      textToCopy = fullTextAudit;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {isSingleWall
                  ? `Calculation Details: ${wall.name}`
                  : `Project Calculation Audit & Engineering Breakdown`}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold">
                  Exact Math
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Transparent step-by-step arithmetic without black-box estimation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {isSingleWall && wallAudit ? (
            /* Single Wall Audit Steps */
            <div className="space-y-3">
              {wallAudit.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs"
                >
                  <div className="flex items-center justify-between font-sans font-bold text-slate-900 text-xs pb-1 mb-2 border-b border-slate-200">
                    <span>{step.title}</span>
                    <span className="text-blue-600 font-bold font-mono">{step.result}</span>
                  </div>
                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <div>
                      <span className="text-slate-400">Formula: </span>
                      <span className="text-slate-800 font-bold">{step.formula}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Values: </span>
                      <span className="text-slate-700">{step.substitution}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total Summary for Single Wall */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Final Wall Requirement
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {wallAudit.finalCHB.toLocaleString()}{' '}
                    <span className="text-sm font-bold text-blue-400">PCS</span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  <div>Base: {wallAudit.baseCHB} pcs</div>
                  <div>+{wastePercentage}% waste ({wallAudit.finalCHB - wallAudit.baseCHB} pcs)</div>
                </div>
              </div>
            </div>
          ) : (
            /* Project-Wide Detailed Math Steps */
            <div className="space-y-4 font-mono text-xs">
              {/* Formula reference cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="font-sans font-bold text-slate-900 text-xs mb-1">
                    1. Unit Block Coverage Ratio
                  </div>
                  <div className="text-slate-500 text-[11px] mb-2 font-sans">
                    Derived from {chbSettings.lengthMm}mm × {chbSettings.heightMm}mm standard dimension.
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-blue-600 font-bold">
                    Area = {chbSettings.lengthMm / 1000}m × {chbSettings.heightMm / 1000}m = {chbSettings.areaSqM.toFixed(4)} m²
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold mt-1.5 font-sans">
                    Coverage = 1 / {chbSettings.areaSqM.toFixed(4)} = {chbSettings.blocksPerSqM} pcs / m²
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="font-sans font-bold text-slate-900 text-xs mb-1">
                    2. Net Masonry Area Formula
                  </div>
                  <div className="text-slate-500 text-[11px] mb-2 font-sans">
                    Deducting total door and window opening schedule.
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-blue-600 font-bold">
                    Net Area = {projectTotals.totalGrossAreaSqM.toFixed(2)}m² − {projectTotals.totalOpeningAreaSqM.toFixed(2)}m²
                  </div>
                  <div className="text-[11px] text-blue-700 font-bold mt-1.5 font-sans">
                    Total Net Masonry = {projectTotals.totalNetAreaSqM.toFixed(2)} m²
                  </div>
                </div>
              </div>

              {/* Step 3: Base CHB Pieces */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="font-sans font-bold text-slate-900 text-xs mb-1">
                  3. Base Hollow Blocks Required
                </div>
                <div className="text-slate-500 text-[11px] mb-2 font-sans">
                  Total Net Wall Area multiplied by Unit Coverage pieces/m² (rounded up to nearest whole block).
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold">
                  Base CHB = ⌈ {projectTotals.totalNetAreaSqM.toFixed(2)} m² × {chbSettings.blocksPerSqM} pcs/m² ⌉ = {projectTotals.baseCHBQuantity.toLocaleString()} pcs
                </div>
              </div>

              {/* Step 4: Waste Allowance & Final Recommendation */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">
                    Final Recommended Order Quantity
                  </div>
                  <div className="text-3xl font-black font-mono text-white mt-0.5">
                    {projectTotals.finalCHBQuantity.toLocaleString()}{' '}
                    <span className="text-base font-bold text-blue-400">PCS</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-1">
                    Base: {projectTotals.baseCHBQuantity.toLocaleString()} pcs + {projectTotals.wastePercentage}% Waste ({projectTotals.wasteQuantity.toLocaleString()} pcs)
                  </div>
                </div>

                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-right text-xs font-mono text-slate-300">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">
                    Auxiliary Materials
                  </div>
                  <div className="text-blue-300 font-bold">
                    {projectTotals.mortarCementBags + projectTotals.plasterCementBags} Bags Cement
                  </div>
                  <div className="text-amber-300 font-bold">
                    {projectTotals.sandCubicMeters} m³ Sand
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>DPWH &amp; ASTM C90 Compliant Calculation Standards</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
