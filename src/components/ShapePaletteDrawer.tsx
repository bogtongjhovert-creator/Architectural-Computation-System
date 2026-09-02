import React from 'react';
import { ARCHITECTURAL_ROOM_TEMPLATES, RoomShapeTemplate } from '../utils/shapePlanner';
import { Square, Plus, Sparkles, Home, Layers, ArrowRight } from 'lucide-react';

interface Props {
  onSelectTemplate: (template: RoomShapeTemplate) => void;
  onQuickAddCustomShape: (widthM: number, heightM: number, name: string) => void;
}

export const ShapePaletteDrawer: React.FC<Props> = ({
  onSelectTemplate,
  onQuickAddCustomShape,
}) => {
  const [activeCategory, setActiveCategory] = React.useState<string>('All');
  const [customW, setCustomW] = React.useState<number>(4.0);
  const [customH, setCustomH] = React.useState<number>(3.5);
  const [customName, setCustomName] = React.useState<string>('New Room');

  const categories = ['All', 'Living & Social', 'Bedrooms', 'Kitchen & Dining', 'Sanitary', 'Outdoor & Utility'];

  const filteredTemplates = activeCategory === 'All'
    ? ARCHITECTURAL_ROOM_TEMPLATES
    : ARCHITECTURAL_ROOM_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="p-4 space-y-4 text-xs font-sans">
      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Quick Custom Shape Creator */}
      <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
            <Square className="w-3.5 h-3.5 text-emerald-400" /> Custom Room Shape
          </span>
          <span className="text-[10px] font-mono text-emerald-400">
            {(customW * customH).toFixed(1)} m²
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <label className="text-[9px] font-mono text-slate-400 block">NAME</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-slate-400 block">WIDTH (m)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="25"
              value={customW}
              onChange={(e) => setCustomW(parseFloat(e.target.value) || 4)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-slate-400 block">LENGTH (m)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="25"
              value={customH}
              onChange={(e) => setCustomH(parseFloat(e.target.value) || 3)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onQuickAddCustomShape(customW, customH, customName)}
          className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Drop Custom Shape
        </button>
      </div>

      {/* Architectural Shape Catalog */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Shape Library ({filteredTemplates.length})
        </span>

        <div className="grid grid-cols-1 gap-2">
          {filteredTemplates.map((t) => {
            const area = (t.widthM * t.heightM).toFixed(1);
            return (
              <div
                key={t.id}
                onClick={() => onSelectTemplate(t)}
                className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/80 rounded-2xl p-3 cursor-pointer transition-all shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg shadow-inner group-hover:scale-105 transition-transform">
                    {t.icon}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-200 group-hover:text-emerald-300 transition-colors text-xs">
                      {t.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {t.widthM}m × {t.heightM}m • <span className="text-emerald-400 font-bold">{area} m²</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-700 group-hover:bg-emerald-600 text-slate-300 group-hover:text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
