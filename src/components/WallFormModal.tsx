import React, { useState, useEffect } from 'react';
import { Wall, WallType, Opening, OpeningType, CHBSettings } from '../types';
import { calculateOpeningArea, calculateWallMetrics } from '../utils/calculator';
import { Plus, Trash2, DoorOpen, LayoutGrid, X, Check, Calculator, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wall: Wall) => void;
  initialWall: Wall | null;
  chbSettings: CHBSettings;
  nextWallIndex: number;
}

const WALL_TYPES: WallType[] = [
  'Exterior Wall',
  'Interior Wall',
  'Perimeter / Fence',
  'Partition Wall',
  'Firewall',
  'Retaining / Shear',
];

const OPENING_PRESETS = [
  { label: 'Main Entrance Door (0.90 × 2.10m)', type: 'door' as OpeningType, width: 0.9, height: 2.1 },
  { label: 'Bedroom Single Door (0.80 × 2.10m)', type: 'door' as OpeningType, width: 0.8, height: 2.1 },
  { label: 'T&B Bathroom Door (0.70 × 2.10m)', type: 'door' as OpeningType, width: 0.7, height: 2.1 },
  { label: 'Double French Door (1.60 × 2.10m)', type: 'door' as OpeningType, width: 1.6, height: 2.1 },
  { label: 'Sliding Patio Door (1.80 × 2.10m)', type: 'door' as OpeningType, width: 1.8, height: 2.1 },
  { label: 'Standard Window (1.20 × 1.20m)', type: 'window' as OpeningType, width: 1.2, height: 1.2 },
  { label: 'Living Room Window (1.50 × 1.20m)', type: 'window' as OpeningType, width: 1.5, height: 1.2 },
  { label: 'Wide Bedroom Window (1.80 × 1.20m)', type: 'window' as OpeningType, width: 1.8, height: 1.2 },
  { label: 'Bathroom Awning Vent (0.60 × 0.60m)', type: 'window' as OpeningType, width: 0.6, height: 0.6 },
];

export const WallFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialWall,
  chbSettings,
  nextWallIndex,
}) => {
  const [wallId, setWallId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<WallType>('Exterior Wall');
  const [length, setLength] = useState<string>('6.00');
  const [height, setHeight] = useState<string>('3.00');
  const [openings, setOpenings] = useState<Opening[]>([]);

  // New opening inputs
  const [newOpeningType, setNewOpeningType] = useState<OpeningType>('door');
  const [newOpeningLabel, setNewOpeningLabel] = useState<string>('Single Door');
  const [newOpeningWidth, setNewOpeningWidth] = useState<string>('0.90');
  const [newOpeningHeight, setNewOpeningHeight] = useState<string>('2.10');
  const [newOpeningQty, setNewOpeningQty] = useState<string>('1');

  useEffect(() => {
    if (initialWall) {
      setWallId(initialWall.id);
      setName(initialWall.name);
      setType(initialWall.type);
      setLength(initialWall.length.toString());
      setHeight(initialWall.height.toString());
      setOpenings(JSON.parse(JSON.stringify(initialWall.openings || [])));
    } else {
      const defaultId = `W${String(nextWallIndex).padStart(2, '0')}`;
      setWallId(defaultId);
      setName(`Wall ${defaultId}`);
      setType('Exterior Wall');
      setLength('6.00');
      setHeight('3.00');
      setOpenings([]);
    }
  }, [initialWall, nextWallIndex, isOpen]);

  if (!isOpen) return null;

  // Live preview metrics
  const numLength = Math.max(0, parseFloat(length) || 0);
  const numHeight = Math.max(0, parseFloat(height) || 0);
  const metrics = calculateWallMetrics(
    {
      length: numLength,
      height: numHeight,
      openings,
    },
    chbSettings.areaSqM
  );

  const handleAddOpening = () => {
    const w = Math.max(0.01, parseFloat(newOpeningWidth) || 0.9);
    const h = Math.max(0.01, parseFloat(newOpeningHeight) || 2.1);
    const qty = Math.max(1, parseInt(newOpeningQty, 10) || 1);
    const newOp: Opening = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: newOpeningType,
      label: newOpeningLabel.trim() || `${newOpeningType.toUpperCase()} (${w.toFixed(2)}×${h.toFixed(2)}m)`,
      width: w,
      height: h,
      quantity: qty,
      area: calculateOpeningArea({ width: w, height: h, quantity: qty }),
    };
    setOpenings([...openings, newOp]);
    // Reset opening name
    setNewOpeningLabel(newOpeningType === 'door' ? 'Room Door' : 'Window');
  };

  const handleApplyPreset = (preset: (typeof OPENING_PRESETS)[0]) => {
    setNewOpeningType(preset.type);
    setNewOpeningLabel(preset.label.split('(')[0].trim());
    setNewOpeningWidth(preset.width.toString());
    setNewOpeningHeight(preset.height.toString());
    setNewOpeningQty('1');
  };

  const handleRemoveOpening = (id: string) => {
    setOpenings(openings.filter((o) => o.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalWall: Wall = {
      id: wallId || `W${String(nextWallIndex).padStart(2, '0')}`,
      name: name.trim(),
      type,
      length: numLength,
      height: numHeight,
      openings,
      grossArea: metrics.grossArea,
      openingArea: metrics.openingArea,
      netArea: metrics.netArea,
      exactCHB: metrics.exactCHB,
      baseCHB: metrics.baseCHB,
      color: initialWall?.color || '#2563eb',
      tracePoints: initialWall?.tracePoints,
      isAutoDetected: initialWall?.isAutoDetected,
    };

    onSave(finalWall);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {initialWall ? `Edit Wall: ${initialWall.id}` : 'Add Wall to Schedule'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Configure geometry, dimensions, and door/window opening deductions.
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

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          {/* Wall Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="wall-name-input" className="block text-xs font-bold text-slate-600 mb-1">
                Wall Name / Designation
              </label>
              <input
                id="wall-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Master Bedroom North Wall"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label htmlFor="wall-type-select" className="block text-xs font-bold text-slate-600 mb-1">
                Wall Type
              </label>
              <select
                id="wall-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as WallType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {WALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Wall Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label htmlFor="wall-length-input" className="block text-xs font-bold text-blue-900 mb-1">
                Wall Length (Meters)
              </label>
              <div className="relative">
                <input
                  id="wall-length-input"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1000"
                  required
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                  m
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="wall-height-input" className="block text-xs font-bold text-blue-900 mb-1">
                Wall Height (Meters)
              </label>
              <div className="relative">
                <input
                  id="wall-height-input"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="50"
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                  m
                </span>
              </div>
            </div>
          </div>

          {/* Openings Section */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Door &amp; Window Openings (Deductions)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {openings.length} Deduction{openings.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Presets Quick Picker */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Size Presets
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {OPENING_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Opening Form Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 items-end">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Type</span>
                <select
                  value={newOpeningType}
                  onChange={(e) => setNewOpeningType(e.target.value as OpeningType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900"
                >
                  <option value="door">Door</option>
                  <option value="window">Window</option>
                  <option value="arch">Archway</option>
                  <option value="vent">Vent / Louver</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Width (m)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={newOpeningWidth}
                  onChange={(e) => setNewOpeningWidth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Height (m)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={newOpeningHeight}
                  onChange={(e) => setNewOpeningHeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Qty</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newOpeningQty}
                  onChange={(e) => setNewOpeningQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddOpening}
                  className="w-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold py-1.5 px-2 rounded-xl text-xs transition-colors border border-slate-200 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Active Openings List */}
            {openings.length > 0 && (
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                {openings.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          op.type === 'door'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {op.type.toUpperCase()}
                      </span>
                      <span className="font-sans font-medium text-slate-800 text-xs">{op.label}</span>
                      <span className="text-slate-400 text-[11px]">
                        {op.width.toFixed(2)}m × {op.height.toFixed(2)}m (×{op.quantity})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-rose-600 font-bold text-xs">
                        −{op.area.toFixed(2)} m²
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOpening(op.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Remove opening"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Calculated Output Card */}
          <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-blue-900">Computed Wall Output:</span>
            </div>

            <div className="flex items-center gap-4 font-mono">
              <div>
                <span className="text-slate-500 font-sans text-[11px]">Net Area: </span>
                <span className="font-bold text-slate-900">{metrics.netArea.toFixed(2)} m²</span>
              </div>
              <div className="h-4 w-px bg-blue-200" />
              <div>
                <span className="text-slate-500 font-sans text-[11px]">Base CHB: </span>
                <span className="font-black text-blue-700 text-sm">{metrics.baseCHB} pcs</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-wall"
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save Wall</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
