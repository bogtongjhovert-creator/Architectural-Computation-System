import React, { useState } from 'react';
import { Wall, CHBSettings, ProjectTotals } from '../types';
import {
  generateWallAudit,
  formatProjectCalculationText,
  calculateWallMetrics,
} from '../utils/calculator';
import {
  FileText,
  X,
  Copy,
  Check,
  Printer,
  Calculator,
  ArrowRight,
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
      textToCopy = `=== CALCULATION AUDIT: WALL ${wallAudit.wallId} (${wallAudit.wallName}) ===\n` +
        wallAudit.steps.map((s) => `${s.title}\nFormula: ${s.formula}\nValues: ${s.substitution}\nResult: ${s.result}\n`).join('\n') +
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
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 shadow-2xl my-8 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                {isSingleWall
                  ? `Calculation Details: Wall ${wall.id} (${wall.name})`
                  : `Project Calculation Audit & Engineering Breakdown`}
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                  Verified Math
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transparent step-by-step arithmetic without black-box estimation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Main Formula Highlight Card (Matching Prompt Requirement #10) */}
          <div className="bg-slate-950 border border-cyan-900/70 rounded-xl p-4 font-mono text-xs text-slate-200">
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Auditable Formula Steps
            </div>

            {isSingleWall && wallAudit ? (
              <div className="space-y-3">
                {wallAudit.steps.map((step, idx) => (
                  <div
                    key={step.title}
                    className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex flex-col gap-1"
                  >
                    <div className="text-cyan-400 font-semibold text-xs">{step.title}</div>
                    <div className="text-slate-400 text-[11px]">
                      Formula: <span className="text-slate-300">{step.formula}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-200 text-xs">
                      <span>{step.substitution}</span>
                      <span className="text-emerald-400 font-bold ml-2 font-mono">
                        = {step.result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Project-wide audit steps matching requirement #10 */
              <div className="space-y-3">
                {/* Step 1: Net Wall Area */}
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <div className="text-cyan-400 font-semibold text-xs mb-1">
                    1. Net Wall Area Calculation
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Net Wall Area = Total Gross Wall Area − Total Opening Area (Doors &amp; Windows)
                  </div>
                  <div className="text-slate-200 mt-1 flex justify-between font-bold">
                    <span>
                      {projectTotals.totalGrossAreaSqM.toFixed(2)} m² −{' '}
                      {projectTotals.totalOpeningAreaSqM.toFixed(2)} m²
                    </span>
                    <span className="text-cyan-300">
                      = {projectTotals.totalNetAreaSqM.toFixed(2)} m²
                    </span>
                  </div>
                </div>

                {/* Step 2: CHB Size & Area */}
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <div className="text-cyan-400 font-semibold text-xs mb-1">
                    2. CHB Block Coverage
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    CHB Size = {chbSettings.lengthMm} × {chbSettings.heightMm} mm
                  </div>
                  <div className="text-slate-200 mt-1">
                    CHB Area = {(chbSettings.lengthMm / 1000).toFixed(2)} m ×{' '}
                    {(chbSettings.heightMm / 1000).toFixed(2)} m ={' '}
                    <span className="text-emerald-400 font-bold">
                      {chbSettings.areaSqM.toFixed(4)} m² ({chbSettings.blocksPerSqM} blocks/m²)
                    </span>
                  </div>
                </div>

                {/* Step 3: Base CHB */}
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <div className="text-cyan-400 font-semibold text-xs mb-1">
                    3. Base Hollow Block Quantity
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Base CHB = ⌈Net Wall Area ÷ CHB Area⌉ (Always rounded upward)
                  </div>
                  <div className="text-slate-200 mt-1 flex justify-between font-bold">
                    <span>
                      {projectTotals.totalNetAreaSqM.toFixed(2)} ÷ {chbSettings.areaSqM.toFixed(4)}
                    </span>
                    <span className="text-emerald-400">
                      = {projectTotals.baseCHBQuantity.toLocaleString()} pcs
                    </span>
                  </div>
                </div>

                {/* Step 4: Waste Allowance & Final */}
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <div className="text-cyan-400 font-semibold text-xs mb-1">
                    4. Waste Allowance &amp; Recommended Total
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Final CHB = ⌈Base CHB × (1 + Waste Percentage)⌉
                  </div>
                  <div className="text-slate-200 mt-1 flex justify-between font-bold">
                    <span>
                      {projectTotals.baseCHBQuantity.toLocaleString()} × (1 +{' '}
                      {(wastePercentage / 100).toFixed(2)})
                    </span>
                    <span className="text-cyan-400">
                      = {projectTotals.finalCHBQuantity.toLocaleString()} pcs
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prominent Recommendation Display */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-cyan-500/60 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest block mb-1">
              Final Quantity Required
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              RECOMMENDED CHB:{' '}
              <span className="text-cyan-300">
                {isSingleWall && wallAudit
                  ? `${wallAudit.finalCHB.toLocaleString()} PCS`
                  : `${projectTotals.finalCHBQuantity.toLocaleString()} PCS`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Includes {wastePercentage}% waste allowance ({chbSettings.lengthMm}×{chbSettings.heightMm}mm block size)
            </p>
          </div>

          {/* Formatted Code Block Display for Copying / Export */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Plain-Text Calculation Log (Auditable)</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Audit Log'}
              </button>
            </div>
            <pre className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
              {isSingleWall && wallAudit
                ? `Net Wall Area = ${wallAudit.netWallArea.toFixed(2)} m²\n\nCHB Size = ${chbSettings.lengthMm} × ${chbSettings.heightMm} mm\n\nCHB Area =\n${(chbSettings.lengthMm / 1000).toFixed(2)} × ${(chbSettings.heightMm / 1000).toFixed(2)}\n= ${chbSettings.areaSqM.toFixed(4)} m²\n\nBase CHB =\n${wallAudit.netWallArea.toFixed(2)} ÷ ${chbSettings.areaSqM.toFixed(4)}\n= ${wallAudit.baseCHB.toLocaleString()} pcs\n\nWaste =\n${wastePercentage}%\n\nFinal Quantity =\n${wallAudit.baseCHB.toLocaleString()} × ${(1 + wastePercentage / 100).toFixed(2)}\n= ${wallAudit.finalCHB.toLocaleString()} pcs`
                : fullTextAudit}
            </pre>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-calc-audit"
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950 border border-cyan-800/80 hover:bg-cyan-900 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
