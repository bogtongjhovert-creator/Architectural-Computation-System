import React from 'react';
import { X, Calculator, Ruler, DoorClosed, ShieldCheck, Layers, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl my-8 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Architectural CHB Calculation Engine &amp; Guide
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Standards, formulas, opening deductions, and calibration methods.
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

        <div className="mt-5 space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: CHB Dimensions */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-blue-600" />
              1. Hollow Block Unit Dimensions
            </h3>
            <p className="text-slate-600 font-medium">
              Unit block dimensions are explicitly specified in real metric millimeters:
            </p>
            <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-slate-800 space-y-1">
              <div>Length: 400 mm = 0.40 m</div>
              <div>Height: 200 mm = 0.20 m</div>
              <div>Unit Area = 0.40 × 0.20 = <strong className="text-blue-600">0.08 m² per block</strong></div>
              <div>Requirement = 1 ÷ 0.08 = <strong className="text-blue-600">12.5 blocks per m²</strong></div>
            </div>
          </div>

          {/* Section 2: Real Geometric Dimensions */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Ruler className="w-4 h-4 text-blue-600" />
              2. Real Geometric Accuracy &amp; Calibration
            </h3>
            <p className="text-slate-600 font-medium">
              The engine calculates actual wall lengths from drawings through:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 font-medium">
              <li><strong>Blueprint Analysis Scanner:</strong> Automatically detects boundaries, walls, and openings.</li>
              <li><strong>Scale Calibration Tool:</strong> Click 2 known points on a dimension line (e.g. 10.0m) to set precise pixel-to-meter ratio.</li>
              <li><strong>Direct Manual Verification:</strong> Edit any wall measurement directly inline or via modal.</li>
            </ul>
          </div>

          {/* Section 3: Openings Deductions */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <DoorClosed className="w-4 h-4 text-blue-600" />
              3. Door &amp; Window Deductions
            </h3>
            <p className="text-slate-600 font-medium">
              For every wall, door and window openings are calculated and deducted automatically:
            </p>
            <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-slate-800 space-y-1">
              <div>Gross Wall Area = Length × Height (e.g. 6.00 × 3.00 = 18.00 m²)</div>
              <div>Opening Area = Σ (Door Area + Window Area)</div>
              <div className="text-blue-600 font-bold">Net Wall Area = Gross Wall Area − Total Opening Area</div>
            </div>
          </div>

          {/* Section 4: Rounding & Waste Allowance */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-blue-600" />
              4. Rounding Rule &amp; Waste Allowance
            </h3>
            <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-slate-800 space-y-1">
              <div>Base CHB = ⌈Net Wall Area ÷ CHB Area⌉ (Always rounded upward)</div>
              <div className="text-amber-700 font-bold">Final Recommended CHB = ⌈Base CHB × (1 + Waste Percentage)⌉ (Default 10%)</div>
            </div>
          </div>

          {/* Section 5: Security & Offline Performance */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              5. 100% Client-Side / Secure Execution
            </h3>
            <p className="text-slate-600 font-medium">
              All calculations, plan image processing, and PDF rendering execute directly inside the browser using standard Web APIs.
            </p>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
