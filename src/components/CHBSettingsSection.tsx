import React from 'react';
import { CHBSettings } from '../types';
import { buildCHBSettings } from '../utils/calculator';
import { Layers, Check, RefreshCw } from 'lucide-react';

interface Props {
  settings: CHBSettings;
  onChange: (newSettings: CHBSettings) => void;
}

const PRESETS = [
  {
    name: 'Standard 400 × 200 mm (12.5 pcs/m²)',
    lengthMm: 400,
    heightMm: 200,
    thicknessMm: 150,
    desc: 'Most common commercial & residential block',
  },
  {
    name: '400 × 150 mm (16.7 pcs/m²)',
    lengthMm: 400,
    heightMm: 150,
    thicknessMm: 100,
    desc: 'Low-height partition block',
  },
  {
    name: '400 × 100 mm (25.0 pcs/m²)',
    lengthMm: 400,
    heightMm: 100,
    thicknessMm: 100,
    desc: 'Quarter-height decorative block',
  },
];

export const CHBSettingsSection: React.FC<Props> = ({ settings, onChange }) => {
  const handleLengthChange = (val: number) => {
    onChange(buildCHBSettings(val, settings.heightMm, settings.thicknessMm));
  };

  const handleHeightChange = (val: number) => {
    onChange(buildCHBSettings(settings.lengthMm, val, settings.thicknessMm));
  };

  const handleThicknessChange = (val: number) => {
    onChange(buildCHBSettings(settings.lengthMm, settings.heightMm, val));
  };

  const applyPreset = (p: typeof PRESETS[0]) => {
    onChange(buildCHBSettings(p.lengthMm, p.heightMm, p.thicknessMm));
  };

  const isPresetActive = (p: typeof PRESETS[0]) => {
    return settings.lengthMm === p.lengthMm && settings.heightMm === p.heightMm;
  };

  return (
    <section id="chb-settings-card" className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Hollow Block (CHB) Settings
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                Formula Encoded
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              CHB dimensions explicitly drive all mathematical calculations (Never guessed from blueprint pixels).
            </p>
          </div>
        </div>

        <button
          id="btn-reset-chb-defaults"
          type="button"
          onClick={() => applyPreset(PRESETS[0])}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition-colors"
          title="Reset to default 400x200mm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Default 400×200
        </button>
      </div>

      {/* Quick Presets */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
          Standard Block Size Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESETS.map((p) => {
            const active = isPresetActive(p);
            return (
              <button
                key={p.name}
                id={`btn-chb-preset-${p.lengthMm}x${p.heightMm}`}
                type="button"
                onClick={() => applyPreset(p)}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all relative ${
                  active
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-sm shadow-cyan-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-medium">
                  <span>{p.lengthMm} × {p.heightMm} mm</span>
                  {active && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Dimensions Input */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="input-chb-length" className="block text-xs font-medium text-slate-300 mb-1">
            CHB Length (mm)
          </label>
          <div className="relative">
            <input
              id="input-chb-length"
              type="number"
              min="50"
              max="2000"
              step="10"
              value={settings.lengthMm}
              onChange={(e) => handleLengthChange(parseFloat(e.target.value) || 400)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-500 pointer-events-none font-mono">
              = {(settings.lengthMm / 1000).toFixed(2)} m
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="input-chb-height" className="block text-xs font-medium text-slate-300 mb-1">
            CHB Height (mm)
          </label>
          <div className="relative">
            <input
              id="input-chb-height"
              type="number"
              min="50"
              max="2000"
              step="10"
              value={settings.heightMm}
              onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 200)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-500 pointer-events-none font-mono">
              = {(settings.heightMm / 1000).toFixed(2)} m
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="select-chb-thickness" className="block text-xs font-medium text-slate-300 mb-1">
            CHB Thickness / Wall Grade
          </label>
          <select
            id="select-chb-thickness"
            value={settings.thicknessMm}
            onChange={(e) => handleThicknessChange(parseInt(e.target.value, 10) || 150)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            <option value={100}>100 mm (4&quot; Partition Block)</option>
            <option value={150}>150 mm (6&quot; Standard Load-Bearing)</option>
            <option value={200}>200 mm (8&quot; Heavy Structural / Firewall)</option>
          </select>
        </div>
      </div>

      {/* Live Calculated Output Box as requested in spec */}
      <div className="bg-slate-950/80 rounded-lg p-3.5 border border-cyan-900/50 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="space-y-1">
          <div className="text-slate-400">
            CHB Area Formula: <span className="text-slate-200">Length (m) × Height (m)</span>
          </div>
          <div className="text-cyan-300 font-semibold text-sm">
            {(settings.lengthMm / 1000).toFixed(2)} m × {(settings.heightMm / 1000).toFixed(2)} m = {settings.areaSqM.toFixed(4)} m²
          </div>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden sm:block" />

        <div className="space-y-1">
          <div className="text-slate-400">
            CHB Requirement: <span className="text-slate-200">1 ÷ CHB Area</span>
          </div>
          <div className="text-emerald-400 font-semibold text-sm">
            1 ÷ {settings.areaSqM.toFixed(4)} = {settings.blocksPerSqM} pcs / m²
          </div>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden sm:block" />

        <div className="space-y-1">
          <div className="text-slate-400">1 m² Wall Coverage:</div>
          <div className="text-slate-100 font-medium">
            {settings.blocksPerSqM} blocks needed per m²
          </div>
        </div>
      </div>
    </section>
  );
};
