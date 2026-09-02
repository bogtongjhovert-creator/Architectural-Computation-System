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
  };

  const handleApplyPreset = (preset: typeof OPENING_PRESETS[0]) => {
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
    const finalWall: Wall = {
      id: wallId.trim() || `W${nextWallIndex}`,
      name: name.trim() || `Wall ${wallId}`,
      type,
      length: numLength,
      height: numHeight,
      openings,
      grossArea: metrics.grossArea,
      openingArea: metrics.openingArea,
      netArea: metrics.netArea,
      baseCHB: metrics.baseCHB,
      color: initialWall?.color || '#60a5fa',
    };
    onSave(finalWall);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {initialWall ? `Edit Wall: ${initialWall.id}` : 'Add New Wall Measurement'}
              </h2>
              <p className="text-xs text-slate-400">
                Enter geometric dimensions and deduct door/window openings accurately.
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Wall Basic Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="wall-id-input" className="block text-xs font-medium text-slate-300 mb-1">
                Wall ID
              </label>
              <input
                id="wall-id-input"
                type="text"
                required
                value={wallId}
                onChange={(e) => setWallId(e.target.value)}
                placeholder="e.g. W01"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="wall-name-input" className="block text-xs font-medium text-slate-300 mb-1">
                Wall Name / Location
              </label>
              <input
                id="wall-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Front Perimeter Wall"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="wall-type-select" className="block text-xs font-medium text-slate-300 mb-1">
                Wall Type
              </label>
              <select
                id="wall-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as WallType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div>
              <label htmlFor="wall-length-input" className="block text-xs font-medium text-cyan-300 mb-1">
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 pointer-events-none font-mono">
                  m
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="wall-height-input" className="block text-xs font-medium text-cyan-300 mb-1">
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 pointer-events-none font-mono">
                  m
                </span>
              </div>
            </div>
          </div>

          {/* Openings Deductions Section */}
          <div className="border border-slate-800 rounded-lg p-3.5 bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4 text-amber-400" />
                Deduct Openings (Doors &amp; Windows)
              </span>
              <span className="text-xs font-mono text-amber-300">
                Total Deduction: {metrics.openingArea.toFixed(2)} m²
              </span>
            </div>

            {/* Presets quick tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {OPENING_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-[11px] px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700/80 transition-colors"
                >
                  + {preset.label.split('(')[0]} ({preset.width}×{preset.height}m)
                </button>
              ))}
            </div>

            {/* New Opening Input Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 mb-3 items-end">
              <div className="sm:col-span-3">
                <label className="block text-[11px] text-slate-400 mb-1">Type</label>
                <select
                  value={newOpeningType}
                  onChange={(e) => setNewOpeningType(e.target.value as OpeningType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-mono"
                >
                  <option value="door">Door</option>
                  <option value="window">Window</option>
                  <option value="vent">Vent / Louver</option>
                  <option value="custom">Custom Opening</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-slate-400 mb-1">Label</label>
                <input
                  type="text"
                  value={newOpeningLabel}
                  onChange={(e) => setNewOpeningLabel(e.target.value)}
                  placeholder="e.g. D1 or W1"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Width (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={newOpeningWidth}
                  onChange={(e) => setNewOpeningWidth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Height (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={newOpeningHeight}
                  onChange={(e) => setNewOpeningHeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  id="btn-add-opening-to-wall"
                  type="button"
                  onClick={handleAddOpening}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* List of active openings for this wall */}
            {openings.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {openings.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          op.type === 'door'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {op.type}
                      </span>
                      <span className="text-slate-200">{op.label}</span>
                      <span className="text-slate-400">
                        {op.width.toFixed(2)}m × {op.height.toFixed(2)}m
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-semibold">
                        -{op.area.toFixed(2)} m²
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOpening(op.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove opening deduction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-2">
                No door or window openings added. (Gross wall area will equal net wall area).
              </p>
            )}
          </div>

          {/* Real-time Math Summary Card for this Wall */}
          <div className="bg-slate-950 border border-cyan-900/60 rounded-lg p-3.5 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-slate-400 text-[11px]">Gross Area</div>
                <div className="text-slate-200 font-bold text-sm mt-0.5">
                  {metrics.grossArea.toFixed(2)} m²
                </div>
                <div className="text-[10px] text-slate-500">
                  {numLength.toFixed(2)} × {numHeight.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px]">Opening Deduction</div>
                <div className="text-amber-400 font-bold text-sm mt-0.5">
                  -{metrics.openingArea.toFixed(2)} m²
                </div>
                <div className="text-[10px] text-slate-500">
                  {openings.length} opening{openings.length === 1 ? '' : 's'}
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px]">Net Wall Area</div>
                <div className="text-cyan-300 font-bold text-sm mt-0.5">
                  {metrics.netArea.toFixed(2)} m²
                </div>
                <div className="text-[10px] text-slate-500">Gross − Openings</div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px]">Base CHB Needed</div>
                <div className="text-emerald-400 font-bold text-sm mt-0.5">
                  {metrics.baseCHB.toLocaleString()} pcs
                </div>
                <div className="text-[10px] text-slate-500">
                  ⌈{metrics.netArea.toFixed(2)} ÷ {chbSettings.areaSqM}⌉
                </div>
              </div>
            </div>

            {metrics.netArea === 0 && (
              <div className="mt-2 text-rose-400 text-[11px] flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Warning: Opening area exceeds or equals gross wall area.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              id="btn-save-wall-modal"
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {initialWall ? 'Save Changes' : 'Add Wall to Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
