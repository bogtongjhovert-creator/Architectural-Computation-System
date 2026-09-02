import React from 'react';
import { X, Calculator, Ruler, DoorClosed, ShieldCheck, Layers, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-slate-100">
              Architectural CHB Calculation Engine &amp; Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-300 max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: CHB Dimensions */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-sm">
              <Layers className="w-4 h-4" />
              1. Hollow Block Explicit Dimensions
            </h3>
            <p className="text-slate-400">
              CHB unit dimensions are never guessed from pixels. The default standard block is:
            </p>
            <div className="bg-slate-900 p-2 rounded font-mono text-slate-200">
              Length: 400 mm = 0.40 m<br />
              Height: 200 mm = 0.20 m<br />
              Unit Area = 0.40 × 0.20 = <strong>0.08 m² per block</strong><br />
              Requirement = 1 ÷ 0.08 = <strong>12.5 blocks per m²</strong>
            </div>
          </div>

          {/* Section 2: Real Geometric Dimensions */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-sm">
              <Ruler className="w-4 h-4" />
              2. Real Geometric Accuracy &amp; Calibration
            </h3>
            <p className="text-slate-400">
              The engine establishes actual wall measurements using either:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li><strong>Blueprint Dimension OCR/Detection</strong> from plan markers.</li>
              <li><strong>Scale Calibration Tool:</strong> Click 2 points on a known dimension line (e.g. 10.0m) to calculate exact pixel-to-meter ratio.</li>
              <li><strong>Direct User Manual Entry &amp; Verification:</strong> Modify any length or height value inline.</li>
            </ul>
          </div>

          {/* Section 3: Openings Deductions */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-sm">
              <DoorClosed className="w-4 h-4" />
              3. Door &amp; Window Deductions
            </h3>
            <p className="text-slate-400">
              For every wall, door and window openings are calculated and deducted automatically:
            </p>
            <div className="bg-slate-900 p-2 rounded font-mono text-slate-200">
              Gross Wall Area = Length × Height (e.g. 6.00 × 3.00 = 18.00 m²)<br />
              Opening Area = Σ (Door Area + Window Area)<br />
              <strong>Net Wall Area = Gross Wall Area − Total Opening Area</strong>
            </div>
          </div>

          {/* Section 4: Rounding & Waste Allowance */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-sm">
              <Calculator className="w-4 h-4" />
              4. Rounding Rule &amp; Waste Allowance
            </h3>
            <div className="bg-slate-900 p-2 rounded font-mono text-slate-200">
              Base CHB = ⌈Net Wall Area ÷ CHB Area⌉ (Always rounded upward)<br />
              Final Recommended CHB = ⌈Base CHB × (1 + Waste Percentage)⌉ (Default 10%)
            </div>
          </div>

          {/* Section 5: GitHub Pages & Persistence */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4" />
              5. 100% Client-Side / GitHub Pages Deployment
            </h3>
            <p className="text-slate-400">
              All calculations, plan rendering, and PDF processing run directly inside the browser using standard Web APIs and LocalStorage persistence.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
