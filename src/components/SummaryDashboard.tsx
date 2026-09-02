import React from 'react';
import { CHBSettings, ProjectTotals, ScaleCalibration } from '../types';
import {
  FileText,
  Download,
  Share2,
  Percent,
  Layers,
  Building2,
  Calculator,
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
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#3b82f6', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <section id="summary-dashboard" className="space-y-4 font-sans">
      {/* Top Main Recommendation Hero Card */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-blue-400 text-xs font-semibold">
              <PackageCheck className="w-3.5 h-3.5" />
              Audited Material Requirement
            </div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Total Recommended Hollow Blocks
            </h2>
            <div
              id="hero-recommended-chb-text"
              onClick={triggerCelebration}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-mono tracking-tight cursor-pointer hover:scale-[1.01] transition-transform select-none"
              title="Click for celebration effect"
            >
              RECOMMENDED CHB:{' '}
              <span className="text-blue-400 drop-shadow-xs">
                {totals.finalCHBQuantity.toLocaleString()} PCS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Base requirement of{' '}
              <span className="text-slate-200 font-bold font-mono">
                {totals.baseCHBQuantity.toLocaleString()} pcs
              </span>{' '}
              +{' '}
              <span className="text-amber-400 font-bold font-mono">
                {totals.wastePercentage}% waste allowance (+{totals.wasteQuantity.toLocaleString()} pcs)
              </span>
            </p>
          </div>

          {/* Waste Allowance Selector */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
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
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-colors border ${
                    wastePercentage === w
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">
                custom %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Summary Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
        {/* BLUEPRINT CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold text-[11px]">
              <span className="flex items-center gap-1.5 text-blue-600">
                <Building2 className="w-4 h-4" />
                Blueprint
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                Project
              </span>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Project:</span>
                <span className="font-bold text-slate-900 truncate max-w-[150px]" title={projectName}>
                  {projectName || 'Bungalow Residence'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Plan File:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[150px]" title={blueprintName}>
                  {blueprintName || 'Architectural Floor Plan'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Floor Area:</span>
                <span className="text-slate-900 font-bold font-mono">
                  {floorArea > 0 ? `${floorArea.toFixed(1)} m²` : '68.0 m²'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Scale:</span>
                <span className={`font-mono font-bold ${scale.isCalibrated ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {scale.isCalibrated ? 'Calibrated' : 'Standard (70px/m)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WALLS CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold text-[11px]">
              <span className="flex items-center gap-1.5 text-blue-600">
                <Layers className="w-4 h-4" />
                Walls &amp; Openings
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-bold">
                {totals.wallCount} Walls
              </span>
            </div>

            <div className="space-y-2 text-slate-700 font-mono">
              <div className="flex justify-between items-baseline font-sans">
                <span className="text-slate-500">Total Length:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {totals.totalLengthM.toFixed(2)} m
                </span>
              </div>
              <div className="flex justify-between items-baseline font-sans">
                <span className="text-slate-500">Gross Area:</span>
                <span className="text-slate-800 font-mono">
                  {totals.totalGrossAreaSqM.toFixed(2)} m²
                </span>
              </div>
              <div className="flex justify-between items-baseline font-sans">
                <span className="text-slate-500">Openings:</span>
                <span className="text-rose-600 font-bold font-mono">
                  −{totals.totalOpeningAreaSqM.toFixed(2)} m²
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-100 font-sans">
                <span className="text-slate-700 font-bold">Net Wall Area:</span>
                <span className="text-blue-600 font-black text-sm font-mono">
                  {totals.totalNetAreaSqM.toFixed(2)} m²
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CHB METRICS CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold text-[11px]">
              <span className="flex items-center gap-1.5 text-blue-600">
                <Calculator className="w-4 h-4" />
                CHB Specifications
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold">
                {chbSettings.lengthMm}×{chbSettings.heightMm}mm
              </span>
            </div>

            <div className="space-y-2 text-slate-700 font-mono">
              <div className="flex justify-between items-baseline font-sans">
                <span className="text-slate-500">Block Area:</span>
                <span className="text-slate-900 font-mono">
                  {chbSettings.areaSqM.toFixed(4)} m²
                </span>
              </div>
              <div className="flex justify-between items-baseline font-sans">
                <span className="text-slate-500">Piece Ratio:</span>
                <span className="text-emerald-700 font-bold font-mono">
                  {chbSettings.blocksPerSqM} pcs / m²
                </span>
              </div>
              <div className="flex justify-between items-baseline font-sans">
                <span className="text-slate-500">Base Pieces:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {totals.baseCHBQuantity.toLocaleString()} pcs
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-100 font-sans">
                <span className="text-slate-700 font-bold">With {totals.wastePercentage}% Waste:</span>
                <span className="text-amber-700 font-bold font-mono">
                  {totals.finalCHBQuantity.toLocaleString()} pcs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Construction Bill of Materials (BOM) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Auxiliary Materials Estimate for CHB Masonry (BOM)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            For {chbSettings.thicknessMm}mm Grade CHB
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-slate-500 text-[11px] font-medium">Mortar &amp; Core Fill Cement</div>
            <div className="text-blue-600 font-black text-sm font-mono mt-0.5">
              {totals.mortarCementBags} bags
            </div>
            <div className="text-[10px] text-slate-400">40kg Portland</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-slate-500 text-[11px] font-medium">Plastering Cement (2-Sides)</div>
            <div className="text-blue-600 font-black text-sm font-mono mt-0.5">
              {totals.plasterCementBags} bags
            </div>
            <div className="text-[10px] text-slate-400">40kg Portland</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-slate-500 text-[11px] font-medium">Washed Screened Sand</div>
            <div className="text-amber-700 font-black text-sm font-mono mt-0.5">
              {totals.sandCubicMeters} m³
            </div>
            <div className="text-[10px] text-slate-400">Cubic Meters</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-slate-500 text-[11px] font-medium">10mm Deformed Rebar</div>
            <div className="text-emerald-700 font-black text-sm font-mono mt-0.5">
              {totals.rebarPieces10mm} pcs
            </div>
            <div className="text-[10px] text-slate-400">6.0m Commercial Lengths</div>
          </div>
        </div>
      </div>

      {/* Export and Audit Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          id="btn-open-calculation-audit"
          type="button"
          onClick={onOpenCalculationDetails}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
        >
          <FileText className="w-4 h-4" />
          Calculation Audit &amp; Step-by-Step Math
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-export-csv"
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            title="Download CSV Bill of Materials"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Export CSV
          </button>

          <button
            id="btn-export-json"
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            title="Save Project JSON file"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            Export Project JSON
          </button>
        </div>
      </div>
    </section>
  );
};
