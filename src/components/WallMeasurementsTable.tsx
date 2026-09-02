import React, { useState } from 'react';
import { Wall, CHBSettings } from '../types';
import { calculateWallMetrics } from '../utils/calculator';
import {
  Plus,
  Trash2,
  Edit2,
  FileText,
  DoorOpen,
  Sparkles,
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
      exactCHB: metrics.exactCHB,
      baseCHB: metrics.baseCHB,
    };

    onUpdateWall(updated);
    setEditingWallId(null);
  };

  return (
    <section id="wall-measurements-section" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm font-sans">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Wall Measurements Schedule
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-bold">
              {walls.length} Wall{walls.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Geometric dimensions, door/window deductions, and live block unit recalculation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-view-all-calculation-details"
            type="button"
            onClick={() => onOpenCalculationDetails(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Math Formula
          </button>

          <button
            id="btn-add-wall"
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Wall
          </button>
        </div>
      </div>

      {/* Table responsive container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs font-mono border-collapse min-w-[840px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3.5 font-sans">Wall ID &amp; Type</th>
              <th className="py-3 px-3 text-right">Length (m)</th>
              <th className="py-3 px-3 text-right">Height (m)</th>
              <th className="py-3 px-3 text-right">Gross Area</th>
              <th className="py-3 px-3 font-sans">Openings (Deduction)</th>
              <th className="py-3 px-3 text-right">Net Area</th>
              <th className="py-3 px-3 text-right text-blue-600 font-bold">Base CHB</th>
              <th className="py-3 px-3 text-right text-slate-600">With {wastePercentage}% Waste</th>
              <th className="py-3 px-3.5 text-center font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                    className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
                      isSelected ? 'bg-blue-50/60 ring-1 ring-blue-500/50' : ''
                    }`}
                  >
                    {/* Wall ID & Type */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 text-[11px]">
                          {w.id}
                        </span>
                        <div>
                          <div className="font-sans font-bold text-slate-900 text-xs truncate max-w-[140px]" title={w.name}>
                            {w.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            {w.type}
                            {w.isAutoDetected && (
                              <span className="ml-1 text-[9px] text-blue-600 font-semibold">● Analyzed</span>
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
                          className="w-16 bg-white border border-blue-500 rounded px-1.5 py-0.5 text-right text-xs text-slate-900 font-mono focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            startInlineEdit(w);
                          }}
                          className="hover:underline cursor-text text-slate-800 font-bold"
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
                          className="w-16 bg-white border border-blue-500 rounded px-1.5 py-0.5 text-right text-xs text-slate-900 font-mono focus:outline-none"
                        />
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            startInlineEdit(w);
                          }}
                          className="hover:underline cursor-text text-slate-700"
                          title="Click to inline edit height"
                        >
                          {w.height.toFixed(2)} m
                        </span>
                      )}
                    </td>

                    {/* Gross Area */}
                    <td className="py-2.5 px-3 text-right text-slate-700 font-semibold">
                      {w.grossArea.toFixed(2)} m²
                    </td>

                    {/* Openings (Deductions) */}
                    <td className="py-2.5 px-3">
                      {w.openings.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-rose-600 font-bold">
                            −{w.openingArea.toFixed(2)} m²
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            ({doorOpenings.length}D, {windowOpenings.length}W)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans">None</span>
                      )}
                    </td>

                    {/* Net Area */}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {w.netArea.toFixed(2)} m²
                    </td>

                    {/* Base CHB */}
                    <td className="py-2.5 px-3 text-right font-black text-blue-600">
                      {w.baseCHB} pcs
                    </td>

                    {/* With Waste Allowance */}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                      {finalWithWaste} pcs
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveInlineEdit(w);
                            }}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                            title="Save inline edit"
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditModal(w);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Edit Wall & Openings"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCalculationDetails(w);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="View math details"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteWall(w.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete wall"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                  No walls added yet. Trace on the blueprint or click "Add Wall" or "Analyze Plan".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
