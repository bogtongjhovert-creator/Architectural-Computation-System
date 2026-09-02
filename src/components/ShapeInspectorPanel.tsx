import React from 'react';
import { DesignerRoomShape, Wall, DesignerDoor, DesignerWindow, WallType } from '../types';
import {
  Layers,
  Square,
  DoorOpen,
  Ruler,
  Trash2,
  Copy,
  RotateCw,
  Plus,
  Maximize2,
  Box,
  Check,
} from 'lucide-react';

interface Props {
  selectedShape: DesignerRoomShape | null;
  selectedWall: Wall | null;
  selectedDoor: DesignerDoor | null;
  selectedWin: DesignerWindow | null;
  selectedCount?: number;
  selectedCountsByType?: {
    shapes: number;
    walls: number;
    doors: number;
    windows: number;
    columns: number;
    dimensions: number;
  };
  totalSelectedArea?: number;
  onClearSelection?: () => void;
  onDuplicateAllSelected?: () => void;
  onUpdateShape: (updated: DesignerRoomShape) => void;
  onDeleteShape: (shapeId: string) => void;
  onDuplicateShape: (shape: DesignerRoomShape) => void;
  onRotateShape: (shape: DesignerRoomShape) => void;
  onAddDoorToSide: (shape: DesignerRoomShape, side: 'north' | 'south' | 'east' | 'west') => void;
  onAddWindowToSide: (shape: DesignerRoomShape, side: 'north' | 'south' | 'east' | 'west') => void;
  onUpdateWall: (updated: Wall) => void;
  onDeleteSelected: () => void;
  chbAreaSqM: number;
}

const ROOM_NAME_OPTIONS = [
  'Living Area',
  'Master Bedroom',
  'Bedroom 2',
  'Bedroom 3',
  'Dining Room',
  'Kitchen',
  'Toilet & Bath',
  'Master Bath',
  'Powder Room',
  'Carport / Garage',
  'Front Porch',
  'Balcony / Terrace',
  'Home Office / Study',
  'Laundry / Service',
  'Storage / Utility',
  'Hallway / Foyer',
];

const WALL_TYPES: WallType[] = ['Exterior Wall', 'Interior Wall', 'Partition Wall', 'Firewall', 'Perimeter / Fence', 'Retaining / Shear'];
const WALL_HEIGHTS = [2.4, 2.6, 2.8, 3.0, 3.2, 3.6, 4.0];

export const ShapeInspectorPanel: React.FC<Props> = ({
  selectedShape,
  selectedWall,
  selectedDoor,
  selectedWin,
  selectedCount = 0,
  selectedCountsByType,
  totalSelectedArea = 0,
  onClearSelection,
  onDuplicateAllSelected,
  onUpdateShape,
  onDeleteShape,
  onDuplicateShape,
  onRotateShape,
  onAddDoorToSide,
  onAddWindowToSide,
  onUpdateWall,
  onDeleteSelected,
  chbAreaSqM,
}) => {
  // 0. Multi-Selection Panel (when >1 items are selected via drag-select or multi-select)
  if (selectedCount > 1) {
    return (
      <div className="p-4 space-y-4 text-xs font-sans animate-fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              {selectedCount}
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Multi-Selection</h4>
              <span className="text-[10px] text-indigo-300">{selectedCount} elements selected</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onDuplicateAllSelected && (
              <button
                type="button"
                onClick={onDuplicateAllSelected}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Duplicate All Selected"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white transition-colors"
              title="Delete All Selected Elements"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Selected Contents
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            {selectedCountsByType?.shapes ? (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Room Shapes:</span>
                <span className="text-emerald-400 font-bold">{selectedCountsByType.shapes}</span>
              </div>
            ) : null}
            {selectedCountsByType?.walls ? (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Walls:</span>
                <span className="text-cyan-400 font-bold">{selectedCountsByType.walls}</span>
              </div>
            ) : null}
            {selectedCountsByType?.doors ? (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Doors:</span>
                <span className="text-amber-400 font-bold">{selectedCountsByType.doors}</span>
              </div>
            ) : null}
            {selectedCountsByType?.windows ? (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Windows:</span>
                <span className="text-blue-400 font-bold">{selectedCountsByType.windows}</span>
              </div>
            ) : null}
            {selectedCountsByType?.columns ? (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Columns:</span>
                <span className="text-purple-400 font-bold">{selectedCountsByType.columns}</span>
              </div>
            ) : null}
            {selectedCountsByType?.dimensions ? (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Dimensions:</span>
                <span className="text-yellow-400 font-bold">{selectedCountsByType.dimensions}</span>
              </div>
            ) : null}
          </div>

          {totalSelectedArea > 0 && (
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">Combined Room Area:</span>
              <span className="font-bold text-emerald-400 font-mono">{totalSelectedArea.toFixed(1)} m²</span>
            </div>
          )}
        </div>

        {/* Batch Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onDeleteSelected}
            className="w-full py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedCount} items)</span>
          </button>

          {onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Deselect All</span>
            </button>
          )}
        </div>
      </div>
    );
  }
  // 1. Room Shape Selected
  if (selectedShape) {
    const area = Number((selectedShape.widthM * selectedShape.heightM).toFixed(2));
    const perimeter = Number((2 * (selectedShape.widthM + selectedShape.heightM)).toFixed(2));
    const grossWallArea = Number((perimeter * selectedShape.wallHeightM).toFixed(2));
    const estCHB = Math.ceil(grossWallArea / chbAreaSqM);

    return (
      <div className="p-4 space-y-4 text-xs font-sans">
        {/* Header Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Square className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Room Shape</h4>
              <span className="text-[10px] font-mono text-emerald-400">ID: {selectedShape.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDuplicateShape(selectedShape)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Duplicate Room Shape"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRotateShape(selectedShape)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Rotate Room 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteShape(selectedShape.id)}
              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white transition-colors"
              title="Delete Room Shape"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Room Name & Category */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-slate-400">Room Name & Type</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={selectedShape.name}
              onChange={(e) => onUpdateShape({ ...selectedShape, name: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium focus:border-emerald-500 focus:outline-none"
            />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onUpdateShape({ ...selectedShape, name: e.target.value });
                }
              }}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none max-w-[100px]"
            >
              <option value="">Presets...</option>
              {ROOM_NAME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shape Metric Dimensions (Width & Height) */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">WIDTH (X-Span)</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  onUpdateShape({
                    ...selectedShape,
                    widthM: Math.max(1.0, Number((selectedShape.widthM - 0.25).toFixed(2))),
                  })
                }
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
              >
                -
              </button>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="30"
                value={selectedShape.widthM}
                onChange={(e) =>
                  onUpdateShape({
                    ...selectedShape,
                    widthM: Math.max(0.5, parseFloat(e.target.value) || 1),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white rounded-lg py-1 text-xs focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  onUpdateShape({
                    ...selectedShape,
                    widthM: Number((selectedShape.widthM + 0.25).toFixed(2)),
                  })
                }
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
            <span className="text-[9px] text-slate-500 font-mono text-center block mt-0.5">meters</span>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">LENGTH (Y-Span)</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  onUpdateShape({
                    ...selectedShape,
                    heightM: Math.max(1.0, Number((selectedShape.heightM - 0.25).toFixed(2))),
                  })
                }
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
              >
                -
              </button>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="30"
                value={selectedShape.heightM}
                onChange={(e) =>
                  onUpdateShape({
                    ...selectedShape,
                    heightM: Math.max(0.5, parseFloat(e.target.value) || 1),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white rounded-lg py-1 text-xs focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  onUpdateShape({
                    ...selectedShape,
                    heightM: Number((selectedShape.heightM + 0.25).toFixed(2)),
                  })
                }
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
            <span className="text-[9px] text-slate-500 font-mono text-center block mt-0.5">meters</span>
          </div>
        </div>

        {/* Live Area & Masonry Badges */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800/80 border border-slate-700/60 p-2 rounded-xl">
            <span className="text-[9px] text-slate-400 block font-mono">FLOOR AREA</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{area} m²</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/60 p-2 rounded-xl">
            <span className="text-[9px] text-slate-400 block font-mono">PERIMETER</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{perimeter} m</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/60 p-2 rounded-xl">
            <span className="text-[9px] text-slate-400 block font-mono">EST. CHB</span>
            <span className="text-xs font-mono font-bold text-amber-400">~{estCHB} pcs</span>
          </div>
        </div>

        {/* Wall Parameters for this Shape */}
        <div className="space-y-2.5 pt-1">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Wall Height (Story Height)</label>
            <div className="flex gap-1.5 flex-wrap">
              {WALL_HEIGHTS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onUpdateShape({ ...selectedShape, wallHeightM: h })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                    selectedShape.wallHeightM === h
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {h}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Perimeter Wall Type</label>
            <select
              value={selectedShape.wallType}
              onChange={(e) => onUpdateShape({ ...selectedShape, wallType: e.target.value as WallType })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              {WALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1-Click Wall Punchers (Add Doors / Windows to Sides) */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-[11px] font-bold text-slate-300 block">Quick Wall Openings</span>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                <DoorOpen className="w-3 h-3" /> Punch Door:
              </span>
              <div className="flex gap-1">
                {(['north', 'south', 'east', 'west'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => onAddDoorToSide(selectedShape, side)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-600/30 hover:text-amber-300 text-slate-400 text-[10px] font-mono uppercase"
                  >
                    {side[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-blue-400 flex items-center gap-1 font-mono">
                <Layers className="w-3 h-3" /> Punch Window:
              </span>
              <div className="flex gap-1">
                {(['north', 'south', 'east', 'west'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => onAddWindowToSide(selectedShape, side)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-blue-600/30 hover:text-blue-300 text-slate-400 text-[10px] font-mono uppercase"
                  >
                    {side[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Single Wall Selected
  if (selectedWall) {
    return (
      <div className="p-4 space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">{selectedWall.name || selectedWall.id}</h4>
              <span className="text-[10px] font-mono text-cyan-400">{selectedWall.type}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onDeleteSelected}
            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white"
            title="Delete Wall"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-slate-400">Wall Label</label>
          <input
            type="text"
            value={selectedWall.name}
            onChange={(e) => onUpdateWall({ ...selectedWall, name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 font-mono">
          <div>
            <span className="text-[9px] text-slate-400 block">LENGTH</span>
            <span className="text-sm font-bold text-white">{selectedWall.length.toFixed(2)} m</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block">HEIGHT</span>
            <span className="text-sm font-bold text-white">{selectedWall.height.toFixed(2)} m</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block">NET MASONRY AREA</span>
            <span className="text-sm font-bold text-cyan-400">{selectedWall.netArea.toFixed(2)} m²</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block">CHB COUNT</span>
            <span className="text-sm font-bold text-amber-400">{selectedWall.baseCHB} pcs</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Wall Type</label>
          <select
            value={selectedWall.type}
            onChange={(e) => onUpdateWall({ ...selectedWall, type: e.target.value as WallType })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            {WALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // 3. Single Door Selected
  if (selectedDoor) {
    return (
      <div className="p-4 space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Door Opening</h4>
              <span className="text-[10px] font-mono text-amber-400">{selectedDoor.label}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onDeleteSelected}
            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Clear Width:</span>
            <span className="text-white font-bold">{selectedDoor.widthM} m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Clear Height:</span>
            <span className="text-white font-bold">{selectedDoor.heightM || 2.1} m</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>Deducted Area:</span>
            <span>{(selectedDoor.widthM * (selectedDoor.heightM || 2.1)).toFixed(2)} m²</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Single Window Selected
  if (selectedWin) {
    return (
      <div className="p-4 space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Window Opening</h4>
              <span className="text-[10px] font-mono text-blue-400">{selectedWin.label}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onDeleteSelected}
            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Width:</span>
            <span className="text-white font-bold">{selectedWin.widthM} m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Height:</span>
            <span className="text-white font-bold">{selectedWin.heightM} m</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>Deducted Area:</span>
            <span>{(selectedWin.widthM * selectedWin.heightM).toFixed(2)} m²</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Blank Empty State
  return (
    <div className="p-6 text-center text-slate-400 space-y-3 font-sans">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center">
        <Box className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-bold text-slate-200 text-sm">No Shape Selected</h4>
        <p className="text-xs text-slate-400 mt-1">
          Click any room shape or wall on the canvas to inspect and customize dimensions, wall types, and openings.
        </p>
      </div>
    </div>
  );
};
