import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../utils/blueprintAnalyzer';
import { CHBSettings } from '../types';
import {
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  Ruler,
  DoorClosed,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Building,
  Maximize,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  isScanning: boolean;
  result: AnalysisResult | null;
  chbSettings: CHBSettings;
  wastePercentage: number;
  onApplyResults: (result: AnalysisResult) => void;
  onClose: () => void;
}

export const AnalysisResultsModal: React.FC<Props> = ({
  isOpen,
  isScanning,
  result,
  chbSettings,
  wastePercentage,
  onApplyResults,
  onClose,
}) => {
  const [scanStep, setScanStep] = useState<number>(0);

  useEffect(() => {
    if (isScanning) {
      setScanStep(0);
      const timer1 = setTimeout(() => setScanStep(1), 400);
      const timer2 = setTimeout(() => setScanStep(2), 900);
      const timer3 = setTimeout(() => setScanStep(3), 1400);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isScanning]);

  if (!isOpen) return null;

  const finalCHB = result
    ? Math.ceil(result.totalBaseCHB * (1 + wastePercentage / 100))
    : 0;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl my-8 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Blueprint Architectural Analysis
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {result?.blueprintName || 'Drawing & Plan Inspection'}
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

        {/* Scanning In Progress State */}
        {isScanning ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-60" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-blue-600 border-b-transparent border-l-transparent animate-spin" />
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Building className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Scanning Blueprint Geometry &amp; Openings
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Evaluating coordinate axes, wall boundaries, perimeter dimensions, and door/window gaps...
              </p>
            </div>

            <div className="w-full max-w-md bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2.5 text-xs font-medium">
              <div className="flex items-center gap-2.5 text-slate-700">
                {scanStep >= 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
                <span>1. Loading plan canvas and extracting line vectors</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                {scanStep >= 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
                <span>2. Detecting exterior perimeter &amp; interior partitions</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                {scanStep >= 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
                <span>3. Deducting door swings &amp; window opening areas</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                {scanStep >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
                <span>4. Computing exact hollow block quantities &amp; waste ratio</span>
              </div>
            </div>
          </div>
        ) : result ? (
          /* Analysis Results View */
          <div className="mt-5 space-y-5">
            {/* Top Notification Banner */}
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-blue-900">
                  {result.summaryText}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold">
                {result.confidenceScore}% Confidence
              </span>
            </div>

            {/* Bento Grid Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              {/* Highlight Hero Card */}
              <div className="col-span-2 sm:col-span-2 bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Total Recommended CHB ({wastePercentage}% Waste)
                  </span>
                  <div className="text-3xl font-black font-mono text-white tracking-tight">
                    {finalCHB.toLocaleString()}{' '}
                    <span className="text-sm font-semibold text-blue-400">PCS</span>
                  </div>
                </div>
                <div className="relative z-10 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-baseline">
                  <span>Base: {result.totalBaseCHB.toLocaleString()} pcs</span>
                  <span className="text-blue-300 font-bold">
                    {chbSettings.lengthMm}×{chbSettings.heightMm}mm Standard
                  </span>
                </div>
              </div>

              {/* Net Wall Area */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Net Wall Area
                </span>
                <div className="text-xl font-black font-mono text-slate-900">
                  {result.totalNetArea.toFixed(2)} m²
                </div>
                <span className="text-[10px] text-slate-500">
                  Gross: {result.totalGrossArea.toFixed(2)} m²
                </span>
              </div>

              {/* Opening Deductions */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Deductions
                </span>
                <div className="text-xl font-black font-mono text-rose-600">
                  −{result.totalOpeningArea.toFixed(2)} m²
                </div>
                <span className="text-[10px] text-slate-500">
                  Doors &amp; Windows deducted
                </span>
              </div>
            </div>

            {/* Detected Wall Schedule Table Preview */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Detected Walls &amp; Openings Schedule ({result.detectedWalls.length} items)
                </h4>
                <span className="text-[10px] font-mono text-slate-500">
                  Floor Area: ~{result.floorArea} m²
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto pr-1">
                <table className="w-full text-left text-xs font-medium">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      <th className="pb-2">Wall</th>
                      <th className="pb-2 text-right">Length</th>
                      <th className="pb-2 text-right">Height</th>
                      <th className="pb-2 text-right">Gross</th>
                      <th className="pb-2 text-right">Openings</th>
                      <th className="pb-2 text-right">Net Area</th>
                      <th className="pb-2 text-right font-bold text-blue-600">Base CHB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700 text-xs">
                    {result.detectedWalls.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="py-2 font-sans font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">
                            {w.id}
                          </span>
                          <span className="truncate max-w-[140px] text-xs">{w.name}</span>
                        </td>
                        <td className="py-2 text-right">{w.length.toFixed(2)}m</td>
                        <td className="py-2 text-right">{w.height.toFixed(2)}m</td>
                        <td className="py-2 text-right">{w.grossArea.toFixed(2)}m²</td>
                        <td className="py-2 text-right text-rose-500">
                          {w.openingArea > 0 ? `−${w.openingArea.toFixed(2)}m²` : '0.00'}
                        </td>
                        <td className="py-2 text-right font-bold text-slate-900">{w.netArea.toFixed(2)}m²</td>
                        <td className="py-2 text-right font-bold text-blue-600">{w.baseCHB} pcs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ready to apply directly into measurement schedule &amp; calculation engine.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-apply-analysis-results"
                  type="button"
                  onClick={() => onApplyResults(result)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                >
                  <span>Apply Analyzed Results</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
