import React, { useState } from 'react';
import { Wall, CHBSettings } from '../types';
import { calculateWallMetrics } from '../utils/calculator';
import {
  Plus,
  Trash2,
  Edit2,
  FileText,
  DoorOpen,
  Maximize2,
  Sparkles,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  walls: Wall[];
  chbSettings: CHBSettings;
  wastePercentage: number;
  onUpdateWall: (updatedWall: Wall) => void;
  onDeleteWall: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (wall: Wall) => void;
  onOpenCalculationDetails: (wall: Wall | null) => void;
  selectedWallId: string | null;
  onSelectWall: (id: string | null) => void;
}

export const WallMeasurementsTable: React.FC<Props> = ({
  walls,
  chbSettings,
  wastePercentage,
  onUpdateWall,
  onDeleteWall,
  onOpenAddModal,
  onOpenEditModal,
  onOpenCalculationDetails,
  selectedWallId,
  onSelectWall,
}) => {
  // Track inline editing fields
  const [editingWallId, setEditingWallId] = useState<string | null>(null);
  const [editLength, setEditLength] = useState<string>('');
  const [editHeight, setEditHeight] = useState<string>('');

  const startInlineEdit = (wall: Wall) => {
    setEditingWallId(wall.id);
    setEditLength(wall.length.toString());
    setEditHeight(wall.height.toString());
  };

  const saveInlineEdit = (wall: Wall) => {
    const newL = Math.max(0.1, parseFloat(editLength) || wall.length);
    const newH = Math.max(0.1, parseFloat(editHeight) || wall.height);
    const metrics = calculateWallMetrics(
      {
        length: newL,
        height: newH,
        openings: wall.openings,
      },
      chbSettings.areaSqM
    );

    const updated: Wall = {
      ...wall,
      length: newL,
      height: newH,
      grossArea: metrics.grossArea,
      openingArea: metrics.openingArea,
      netArea: metrics.netArea,
      baseCHB: metrics.baseCHB,
    };

    onUpdateWall(updated);
    setEditingWallId(null);
  };

  const cancelInlineEdit = () => {
    setEditingWallId(null);
  };

  return (
    <section id="wall-measurements-section" className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            Wall Measurements Schedule
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {walls.length} Wall{walls.length === 1 ? '' : 's'}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Verify real geometric lengths, heights, and door/window opening deductions with live recalculation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-view-all-calculation-details"
            type="button"
            onClick={() => onOpenCalculationDetails(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/60 hover:text-cyan-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Project Math Audit
          </button>

          <button
            id="btn-add-wall"
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-950 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Wall
          </button>
        </div>
      </div>

      {/* Table responsive container */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs font-mono border-collapse min-w-[840px]">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Wall ID &amp; Type</th>
              <th className="py-3 px-3 text-right">Length (m)</th>
              <th className="py-3 px-3 text-right">Height (m)</th>
              <th className="py-3 px-3 text-right">Gross Area</th>
              <th className="py-3 px-3">Openings (Deduction)</th>
              <th className="py-3 px-3 text-right">Net Area</th>
              <th className="py-3 px-3 text-right text-emerald-400">Base CHB</th>
              <th className="py-3 px-3 text-right text-slate-300">With {wastePercentage}% Waste</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {walls.length > 0 ? (
              walls.map((w) => {
                const isSelected = selectedWallId === w.id;
                const isEditing = editingWallId === w.id;
                const doorOpenings = w.openings.filter((o) => o.type === 'door');
                const windowOpenings = w.openings.filter((o) => o.type !== 'door');
                const finalWithWaste = Math.ceil(w.baseCHB * (1 + wastePercentage / 100));

                return (
                  <tr
                    key={w.id}
                    id={`wall-row-${w.id}`}
                    onClick={() => onSelectWall(w.id)}
                    className={`transition-colors hover:bg-slate-800/40 cursor-pointer ${
                      isSelected ? 'bg-cyan-950/30 ring-1 ring-cyan-500/40' : ''
                    }`}
                  >
                    {/* Wall ID & Type */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                          {w.id}
                        </span>
                        <div>
                          <div className="font-sans font-medium text-slate-200 text-xs truncate max-w-[140px]" title={w.name}>
                            {w.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            {w.type}
                            {w.isAutoDetected && (
                              <span className="ml-1 text-[9px] text-cyan-400">● Detected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Length (m) with inline edit capability */}
                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={editLength}
                          onChange={(e) => setEditLength(e.target.value)}
                          className="w-16 bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-right text-xs text-white font-mono focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            startInlineEdit(w);
                          }}
                          className="hover:underline cursor-text text-slate-200 font-semibold"
                          title="Click to inline edit length"
                        >
                          {w.length.toFixed(2)} m
                        </span>
                      )}
                    </td>

                    {/* Height (m) with inline edit capability */}
                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={editHeight}
                          onChange={(e) => setEditHeight(e.target.value)}
                          className="w-16 bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-right text-xs text-white font-mono focus:outline-none"
                        />
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            startInlineEdit(w);
                          }}
                          className="hover:underline cursor-text text-slate-300"
                          title="Click to inline edit height"
                        >
                          {w.height.toFixed(2)} m
                        </span>
                      )}
                    </td>

                    {/* Gross Area */}
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {w.grossArea.toFixed(2)} m²
                    </td>

                    {/* Openings (Doors & Windows) */}
                    <td className="py-2.5 px-3">
                      {w.openings.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {doorOpenings.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 text-[10px]">
                                {doorOpenings.length} Door{doorOpenings.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {windowOpenings.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[10px]">
                                {windowOpenings.length} Window{windowOpenings.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-amber-400">
                            −{w.openingArea.toFixed(2)} m²
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">— None —</span>
                      )}
                    </td>

                    {/* Net Area */}
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                      {w.netArea.toFixed(2)} m²
                    </td>

                    {/* Base CHB */}
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {w.baseCHB.toLocaleString()} pcs
                    </td>

                    {/* With Waste Allowance */}
                    <td className="py-2.5 px-3 text-right text-slate-200 font-semibold">
                      {finalWithWaste.toLocaleString()} pcs
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-save-inline-${w.id}`}
                            type="button"
                            onClick={() => saveInlineEdit(w)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            title="Save inline edit"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelInlineEdit}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                            title="Cancel inline edit"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-audit-wall-${w.id}`}
                            type="button"
                            onClick={() => onOpenCalculationDetails(w)}
                            className="p-1.5 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300"
                            title="View step-by-step calculation audit for this wall"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`btn-edit-wall-${w.id}`}
                            type="button"
                            onClick={() => onOpenEditModal(w)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            title="Edit wall & openings"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`btn-delete-wall-${w.id}`}
                            type="button"
                            onClick={() => onDeleteWall(w.id)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400"
                            title="Delete wall"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  <div className="max-w-xs mx-auto text-xs">
                    <p className="font-medium text-slate-400 mb-1">No Wall Measurements Added</p>
                    <p className="text-[11px] mb-3">
                      Click &ldquo;Add Wall&rdquo; above or use the &ldquo;Analyze Blueprint&rdquo; tool to populate measurements.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenAddModal}
                      className="px-3 py-1.5 bg-cyan-600 text-white rounded-md text-xs font-semibold"
                    >
                      + Add First Wall
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Verification Info Banner (Requirement #10) */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Tip: Click any <strong>Length</strong> or <strong>Height</strong> value in the table to perform instant manual verification.
        </span>
        <span className="font-mono text-slate-500">
          CHB Unit Size: {chbSettings.lengthMm}×{chbSettings.heightMm}mm ({chbSettings.areaSqM} m²/pc)
        </span>
      </div>
    </section>
  );
};
