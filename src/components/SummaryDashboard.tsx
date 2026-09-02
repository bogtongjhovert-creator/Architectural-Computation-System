import React from 'react';
import { CHBSettings, ProjectTotals, ScaleCalibration } from '../types';
import {
  FileText,
  Download,
  Share2,
  Percent,
  Layers,
  Building2,
  DoorClosed,
  Calculator,
  HardHat,
  PackageCheck,
  Hammer,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  projectName: string;
  blueprintName: string;
  floorArea: number;
  scale: ScaleCalibration;
  chbSettings: CHBSettings;
  wastePercentage: number;
  onWasteChange: (waste: number) => void;
  totals: ProjectTotals;
  onOpenCalculationDetails: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}

const WASTE_PRESETS = [0, 5, 10, 15];

export const SummaryDashboard: React.FC<Props> = ({
  projectName,
  blueprintName,
  floorArea,
  scale,
  chbSettings,
  wastePercentage,
  onWasteChange,
  totals,
  onOpenCalculationDetails,
  onExportCsv,
  onExportJson,
}) => {
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <section id="summary-dashboard" className="space-y-4">
      {/* Top Main Recommendation Hero Card (Requirement #8 & #11) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-cyan-500/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
        {/* Glow & Backdrop lines */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              <PackageCheck className="w-3.5 h-3.5 text-cyan-400" />
              Final Material Estimate (Audited)
            </div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Total Recommended Hollow Blocks
            </h2>
            <div
              id="hero-recommended-chb-text"
              onClick={triggerCelebration}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-mono tracking-tight cursor-pointer hover:scale-[1.01] transition-transform select-none"
              title="Click for celebration effect"
            >
              RECOMMENDED CHB:{' '}
              <span className="text-cyan-400 drop-shadow-md">
                {totals.finalCHBQuantity.toLocaleString()} PCS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Base requirement of{' '}
              <span className="text-slate-200 font-semibold">
                {totals.baseCHBQuantity.toLocaleString()} pcs
              </span>{' '}
              +{' '}
              <span className="text-amber-400 font-semibold">
                {totals.wastePercentage}% waste allowance (+{totals.wasteQuantity.toLocaleString()} pcs)
              </span>
            </p>
          </div>

          {/* Waste Allowance Selector (Requirement #8) */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                Waste Allowance
              </span>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {wastePercentage}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {WASTE_PRESETS.map((w) => (
                <button
                  key={w}
                  id={`btn-waste-${w}`}
                  type="button"
                  onClick={() => onWasteChange(w)}
                  className={`py-1.5 rounded text-xs font-mono font-medium transition-colors border ${
                    wastePercentage === w
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {w}%
                </button>
              ))}
            </div>

            <div className="relative mt-1">
              <input
                id="input-custom-waste"
                type="number"
                min="0"
                max="50"
                step="1"
                placeholder="Custom %"
                value={wastePercentage}
                onChange={(e) => onWasteChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-500 font-mono">
                custom %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Summary Cards (Blueprint, Walls, CHB Specs) (Requirement #11) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* BLUEPRINT CARD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-sans font-semibold text-[11px]">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Building2 className="w-4 h-4" />
                Blueprint
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Project
              </span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Project Name:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[150px]" title={projectName}>
                  {projectName || 'Bungalow Residence'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Blueprint Plan:</span>
                <span className="font-medium text-slate-200 truncate max-w-[150px]" title={blueprintName}>
                  {blueprintName || 'Architectural Floor Plan'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Floor Area:</span>
                <span className="text-cyan-300 font-bold">
                  {floorArea > 0 ? `${floorArea.toFixed(1)} m²` : '68.0 m²'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Scale Status:</span>
                <span className={scale.isCalibrated ? 'text-emerald-400' : 'text-amber-400'}>
                  {scale.isCalibrated ? 'Calibrated (Exact)' : 'Standard (70px/m)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WALLS CARD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-sans font-semibold text-[11px]">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Layers className="w-4 h-4" />
                Walls &amp; Openings
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {totals.wallCount} Walls
              </span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Total Wall Length:</span>
                <span className="font-semibold text-slate-200">
                  {totals.totalLengthM.toFixed(2)} m
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Gross Wall Area:</span>
                <span className="text-slate-200">
                  {totals.totalGrossAreaSqM.toFixed(2)} m²
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Total Opening Area:</span>
                <span className="text-amber-400 font-semibold">
                  −{totals.totalOpeningAreaSqM.toFixed(2)} m² (Deducted)
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 font-semibold">Net Wall Area:</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {totals.totalNetAreaSqM.toFixed(2)} m²
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CHB METRICS CARD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-sans font-semibold text-[11px]">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Calculator className="w-4 h-4" />
                CHB Specifications
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                {chbSettings.lengthMm}×{chbSettings.heightMm}mm
              </span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">CHB Unit Size:</span>
                <span className="font-semibold text-slate-200">
                  {chbSettings.lengthMm} × {chbSettings.heightMm} mm
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Block Coverage:</span>
                <span className="text-slate-200">
                  {chbSettings.areaSqM.toFixed(4)} m²/block
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Requirement Ratio:</span>
                <span className="text-emerald-400 font-semibold">
                  {chbSettings.blocksPerSqM} blocks / m²
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Base Quantity:</span>
                <span className="font-bold text-slate-200">
                  {totals.baseCHBQuantity.toLocaleString()} pcs
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 font-semibold">Waste Allowance:</span>
                <span className="text-amber-400 font-bold">
                  {totals.wastePercentage}% (+{totals.wasteQuantity.toLocaleString()} pcs)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Construction Bill of Materials (BOM) */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-400" />
            <span className="font-sans font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Estimated Auxiliary Materials for CHB Masonry (BOM)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            For {chbSettings.thicknessMm}mm CHB Grade
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Mortar &amp; Core Fill Cement</div>
            <div className="text-cyan-300 font-bold text-sm mt-0.5">
              {totals.mortarCementBags} bags
            </div>
            <div className="text-[10px] text-slate-500">40kg Portland</div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Plastering Cement (2-Sides)</div>
            <div className="text-cyan-300 font-bold text-sm mt-0.5">
              {totals.plasterCementBags} bags
            </div>
            <div className="text-[10px] text-slate-500">40kg Portland</div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Washed Screened Sand</div>
            <div className="text-amber-300 font-bold text-sm mt-0.5">
              {totals.sandCubicMeters} m³
            </div>
            <div className="text-[10px] text-slate-500">Cubic Meters</div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">10mm Deformed Rebar</div>
            <div className="text-emerald-300 font-bold text-sm mt-0.5">
              {totals.rebarPieces10mm} pcs
            </div>
            <div className="text-[10px] text-slate-500">6.0m Lengths</div>
          </div>
        </div>
      </div>

      {/* Export and Audit Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            id="btn-open-calculation-audit"
            type="button"
            onClick={onOpenCalculationDetails}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Calculation Details &amp; Math Audit
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-export-csv"
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
            title="Download CSV Bill of Materials table"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV (BOM)
          </button>

          <button
            id="btn-export-json"
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
            title="Save Project JSON file"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            Save Project JSON
          </button>
        </div>
      </div>
    </section>
  );
};
