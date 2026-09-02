import React, { useState } from 'react';
import { BuildingElevation, Wall } from '../types';
import {
  ArrowUpFromLine,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Layers,
  Maximize2,
  RefreshCw,
  Ruler,
  ShieldAlert,
  Sparkles,
  Triangle,
} from 'lucide-react';

interface Props {
  elevation: BuildingElevation;
  onChange: (elevation: BuildingElevation) => void;
  onApplyHeightToAllWalls: (newHeight: number) => void;
  wallsCount: number;
}

const WALL_HEIGHT_PRESETS = [
  { val: 2.6, label: '2.60m', desc: 'Low clearance / Utility' },
  { val: 2.8, label: '2.80m', desc: 'Budget residential' },
  { val: 3.0, label: '3.00m', desc: 'Standard Residential (Philippine Code)' },
  { val: 3.2, label: '3.20m', desc: 'Comfort / High Ceiling' },
  { val: 3.5, label: '3.50m', desc: 'Grand / Commercial' },
];

const FFL_PRESETS = [
  { val: 0.2, label: '+0.20m', desc: 'Low plinth / Slab-on-grade' },
  { val: 0.45, label: '+0.45m', desc: 'Standard residential plinth (3 steps)' },
  { val: 0.8, label: '+0.80m', desc: 'Flood-resistant elevation' },
  { val: 1.2, label: '+1.20m', desc: 'High-plinth / Sloped lot' },
];

export const HouseElevationCard: React.FC<Props> = ({
  elevation,
  onChange,
  onApplyHeightToAllWalls,
  wallsCount,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showApplyConfirm, setShowApplyConfirm] = useState<boolean>(false);

  const update = (partial: Partial<BuildingElevation>) => {
    onChange({
      ...elevation,
      ...partial,
    });
  };

  const stories = Math.max(1, elevation.numberOfStories || 1);
  const ffl = Number((elevation.groundToFloorElevationM || 0.45).toFixed(2));
  const wallH = Number((elevation.floorToCeilingHeightM || 3.0).toFixed(2));
  const tow = Number((ffl + wallH * stories).toFixed(2));
  const gableRise = elevation.hasGableWalls
    ? elevation.gableRoofHeightM || 1.5
    : elevation.hasParapet
    ? elevation.parapetHeightM || 0.8
    : 0;
  const ridge = Number((tow + gableRise).toFixed(2));
  const totalHeight = ridge;
  const totalStructural = Number((totalHeight + (elevation.foundationDepthM || 0.6)).toFixed(2));

  const handleApplyToAll = () => {
    onApplyHeightToAllWalls(wallH);
    setShowApplyConfirm(false);
  };

  return (
    <section
      id="house-elevation-card"
      className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm font-sans relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs">
            <ArrowUpFromLine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                House Elevation &amp; Story Height Profile
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 font-mono">
                {stories}-Storey | Total Elevation: +{ridge.toFixed(2)}m
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Configure Finished Floor Level (FFL), ceiling clearance, roof gable rise, and global wall heights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-elevation-card"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Expand
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-6">
          {/* Top Quick Level Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Finished Floor (FFL)
              </span>
              <span className="text-lg font-black text-slate-800 font-mono">
                +{ffl.toFixed(2)} m
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Above Natural Ground</span>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                Clear Wall Height (H)
              </span>
              <span className="text-lg font-black text-indigo-700 font-mono">
                {wallH.toFixed(2)} m
              </span>
              <span className="text-[10px] text-indigo-600/80 block mt-0.5">Floor to Ceiling Beam</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Top of Wall (TOW)
              </span>
              <span className="text-lg font-black text-slate-800 font-mono">
                +{tow.toFixed(2)} m
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Beam Level Elevation</span>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Roof Ridge / Apex (RL)
              </span>
              <span className="text-lg font-black text-blue-700 font-mono">
                +{ridge.toFixed(2)} m
              </span>
              <span className="text-[10px] text-blue-600/80 block mt-0.5">Total Building Height</span>
            </div>
          </div>

          {/* Grid with Interactive Diagram and Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Dynamic Architectural Elevation Cross-Section Diagram */}
            <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white overflow-hidden relative shadow-inner">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Architectural Section &amp; Elevation Profile
                </span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                  Live Scaled SVG
                </span>
              </div>

              {/* Dynamic SVG Elevation View */}
              <div className="w-full bg-slate-900 rounded-xl p-2 border border-slate-800 flex items-center justify-center">
                <svg
                  viewBox="0 0 460 300"
                  className="w-full h-auto max-h-[280px]"
                  style={{ userSelect: 'none' }}
                >
                  <defs>
                    <pattern id="diag-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#334155" strokeWidth="1" />
                    </pattern>
                    <pattern id="masonry-pattern" width="16" height="8" patternUnits="userSpaceOnUse">
                      <rect width="16" height="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.4" />
                      <line x1="8" y1="4" x2="8" y2="8" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.4" />
                      <line x1="0" y1="4" x2="16" y2="4" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.4" />
                    </pattern>
                    <marker id="arrow-up" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 10 L 5 0 L 10 10 z" fill="#818cf8" />
                    </marker>
                    <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 5 10 L 10 0 z" fill="#818cf8" />
                    </marker>
                  </defs>

                  {/* Grid Lines Background */}
                  <line x1="20" y1="30" x2="440" y2="30" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="90" x2="440" y2="90" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="210" x2="440" y2="210" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="250" x2="440" y2="250" stroke="#1e293b" strokeDasharray="3,3" />

                  {/* Foundation Footing / Soil Level */}
                  <rect x="110" y="250" width="180" height="30" fill="url(#diag-hatch)" stroke="#475569" strokeWidth="1" />
                  <line x1="20" y1="250" x2="440" y2="250" stroke="#10b981" strokeWidth="1.5" />
                  <text x="30" y="246" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    NGL ±0.00m (Natural Ground)
                  </text>

                  {/* Plinth / Stem Wall below FFL */}
                  <rect x="130" y="220" width="140" height="30" fill="#334155" stroke="#64748b" strokeWidth="1" />
                  <line x1="20" y1="220" x2="440" y2="220" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="30" y="216" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    FFL +{ffl.toFixed(2)}m (Floor Line)
                  </text>

                  {/* Main Story Wall Body */}
                  <rect
                    x="130"
                    y={stories > 1 ? 110 : 130}
                    width="140"
                    height={stories > 1 ? 110 : 90}
                    fill="url(#masonry-pattern)"
                    stroke="#60a5fa"
                    strokeWidth="1.5"
                  />

                  {/* Door & Window Openings on diagram */}
                  <rect x="145" y={stories > 1 ? 170 : 160} width="22" height={stories > 1 ? 50 : 60} fill="#0f172a" stroke="#93c5fd" strokeWidth="1" />
                  <rect x="180" y={stories > 1 ? 140 : 150} width="35" height="30" fill="#0f172a" stroke="#93c5fd" strokeWidth="1" />
                  <rect x="230" y={stories > 1 ? 140 : 150} width="25" height="30" fill="#0f172a" stroke="#93c5fd" strokeWidth="1" />
                  {stories > 1 && (
                    <>
                      <line x1="130" y1="165" x2="270" y2="165" stroke="#cbd5e1" strokeWidth="2" />
                      <rect x="150" y="120" width="30" height="28" fill="#0f172a" stroke="#93c5fd" strokeWidth="1" />
                      <rect x="200" y="120" width="40" height="28" fill="#0f172a" stroke="#93c5fd" strokeWidth="1" />
                    </>
                  )}

                  {/* Beam / Top of Wall Line */}
                  <line
                    x1="20"
                    y1={stories > 1 ? 110 : 130}
                    x2="440"
                    y2={stories > 1 ? 110 : 130}
                    stroke="#818cf8"
                    strokeWidth="1.5"
                  />
                  <text
                    x="30"
                    y={stories > 1 ? 106 : 126}
                    fill="#818cf8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    TOW +{tow.toFixed(2)}m (Top of Wall / Beam)
                  </text>

                  {/* Roof Gable or Parapet */}
                  {elevation.hasGableWalls ? (
                    <>
                      <polygon
                        points={`130,${stories > 1 ? 110 : 130} 200,${stories > 1 ? 40 : 50} 270,${
                          stories > 1 ? 110 : 130
                        }`}
                        fill="#1e293b"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="20"
                        y1={stories > 1 ? 40 : 50}
                        x2="440"
                        y2={stories > 1 ? 40 : 50}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                      <text
                        x="30"
                        y={stories > 1 ? 36 : 46}
                        fill="#f43f5e"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        RL +{ridge.toFixed(2)}m (Roof Ridge Apex)
                      </text>
                    </>
                  ) : elevation.hasParapet ? (
                    <>
                      <rect
                        x="130"
                        y={stories > 1 ? 85 : 105}
                        width="140"
                        height="25"
                        fill="#334155"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="20"
                        y1={stories > 1 ? 85 : 105}
                        x2="440"
                        y2={stories > 1 ? 85 : 105}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                      <text
                        x="30"
                        y={stories > 1 ? 81 : 101}
                        fill="#f43f5e"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        PARAPET +{ridge.toFixed(2)}m
                      </text>
                    </>
                  ) : (
                    // Standard Sloped Roof Pitch line
                    <polygon
                      points={`120,${stories > 1 ? 110 : 130} 200,${stories > 1 ? 55 : 65} 280,${
                        stories > 1 ? 110 : 130
                      }`}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                    />
                  )}

                  {/* Right Side Dimension Strings */}
                  <line x1="290" y1="220" x2="290" y2="250" stroke="#f59e0b" strokeWidth="1.5" markerStart="url(#arrow-up)" markerEnd="url(#arrow-down)" />
                  <text x="300" y="238" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    FFL = {ffl.toFixed(2)}m
                  </text>

                  <line
                    x1="290"
                    y1={stories > 1 ? 110 : 130}
                    x2="290"
                    y2="220"
                    stroke="#818cf8"
                    strokeWidth="1.5"
                    markerStart="url(#arrow-up)"
                    markerEnd="url(#arrow-down)"
                  />
                  <text
                    x="300"
                    y={stories > 1 ? 168 : 178}
                    fill="#818cf8"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Wall H = {wallH.toFixed(2)}m
                  </text>

                  <line
                    x1="380"
                    y1={elevation.hasGableWalls ? (stories > 1 ? 40 : 50) : stories > 1 ? 110 : 130}
                    x2="380"
                    y2="250"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    markerStart="url(#arrow-up)"
                    markerEnd="url(#arrow-down)"
                  />
                  <text
                    x="390"
                    y="145"
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Total H = {totalHeight.toFixed(2)}m
                  </text>
                </svg>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Elevation levels align directly with structural masonry height</span>
                <span className="text-slate-300 font-mono">NSCP / DPWH Standard</span>
              </div>
            </div>

            {/* Right: Elevation Height Inputs & Configuration */}
            <div className="lg:col-span-6 space-y-4">
              {/* Wall / Floor-to-Ceiling Height */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="input-elevation-wall-height" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                    Standard Wall / Story Height (m)
                  </label>
                  <span className="text-xs font-bold font-mono text-indigo-600">
                    {wallH.toFixed(2)} meters
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    id="input-elevation-wall-height"
                    type="number"
                    min="1.8"
                    max="10.0"
                    step="0.05"
                    value={elevation.floorToCeilingHeightM}
                    onChange={(e) => update({ floorToCeilingHeightM: parseFloat(e.target.value) || 3.0 })}
                    className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">Clear floor-to-beam height</span>
                </div>

                {/* Quick Presets for Wall Height */}
                <div className="flex flex-wrap gap-1.5">
                  {WALL_HEIGHT_PRESETS.map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => update({ floorToCeilingHeightM: p.val })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        Math.abs(elevation.floorToCeilingHeightM - p.val) < 0.01
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={p.desc}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Finished Floor Level (FFL) above Ground */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="input-elevation-ffl" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-600" />
                    Finished Floor Elevation (FFL above NGL)
                  </label>
                  <span className="text-xs font-bold font-mono text-amber-700">
                    +{ffl.toFixed(2)} m
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    id="input-elevation-ffl"
                    type="number"
                    min="0.0"
                    max="5.0"
                    step="0.05"
                    value={elevation.groundToFloorElevationM}
                    onChange={(e) => update({ groundToFloorElevationM: parseFloat(e.target.value) || 0.45 })}
                    className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">Height of floor slab above natural ground</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {FFL_PRESETS.map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => update({ groundToFloorElevationM: p.val })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        Math.abs(elevation.groundToFloorElevationM - p.val) < 0.01
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={p.desc}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Stories & Roof Gable / Parapet Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Number of Storeys */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <label htmlFor="select-stories-count" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Building Stories
                  </label>
                  <select
                    id="select-stories-count"
                    value={elevation.numberOfStories || 1}
                    onChange={(e) => update({ numberOfStories: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={1}>1-Storey (Bungalow)</option>
                    <option value={2}>2-Storey (Townhouse / Multi-level)</option>
                    <option value={3}>3-Storey (Commercial / Residential)</option>
                  </select>
                </div>

                {/* Foundation Footing Depth */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <label htmlFor="input-foundation-depth" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Footing Depth below NGL
                  </label>
                  <input
                    id="input-foundation-depth"
                    type="number"
                    min="0.3"
                    max="3.0"
                    step="0.05"
                    value={elevation.foundationDepthM || 0.6}
                    onChange={(e) => update({ foundationDepthM: parseFloat(e.target.value) || 0.6 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Roof Gable Wall or Parapet Options */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Roof Gable &amp; Firewall Parapet Extensions
                </span>

                {/* Gable Wall Toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={elevation.hasGableWalls || false}
                      onChange={(e) => update({ hasGableWalls: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Include Roof Gable Triangle Masonry
                    </span>
                  </label>

                  {elevation.hasGableWalls && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">Apex Height:</span>
                      <input
                        type="number"
                        min="0.5"
                        max="5.0"
                        step="0.1"
                        value={elevation.gableRoofHeightM || 1.5}
                        onChange={(e) => update({ gableRoofHeightM: parseFloat(e.target.value) || 1.5 })}
                        className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900"
                      />
                      <span className="text-xs font-mono text-slate-500">m</span>
                    </div>
                  )}
                </div>

                {/* Parapet Firewall Toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={elevation.hasParapet || false}
                      onChange={(e) => update({ hasParapet: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Include Firewall Parapet Extension
                    </span>
                  </label>

                  {elevation.hasParapet && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">Parapet H:</span>
                      <input
                        type="number"
                        min="0.3"
                        max="3.0"
                        step="0.1"
                        value={elevation.parapetHeightM || 0.8}
                        onChange={(e) => update({ parapetHeightM: parseFloat(e.target.value) || 0.8 })}
                        className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900"
                      />
                      <span className="text-xs font-mono text-slate-500">m</span>
                    </div>
                  )}
                </div>

                {/* Plinth Masonry Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={elevation.includePlinthMasonry || false}
                      onChange={(e) => update({ includePlinthMasonry: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Include Plinth Stem Wall Masonry below FFL
                    </span>
                  </label>

                  {elevation.includePlinthMasonry && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">Stem H:</span>
                      <input
                        type="number"
                        min="0.1"
                        max="2.0"
                        step="0.05"
                        value={elevation.plinthMasonryHeightM || 0.45}
                        onChange={(e) => update({ plinthMasonryHeightM: parseFloat(e.target.value) || 0.45 })}
                        className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900"
                      />
                      <span className="text-xs font-mono text-slate-500">m</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Apply Height to All Walls Action Banner */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Synchronize Wall Schedule Heights
                  </div>
                  <p className="text-[11px] text-indigo-700/90 font-medium">
                    Set all {wallsCount} existing walls in the schedule to the house elevation height ({wallH.toFixed(2)}m).
                  </p>
                </div>

                {showApplyConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-confirm-apply-wall-heights"
                      type="button"
                      onClick={handleApplyToAll}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Confirm Apply ({wallH.toFixed(2)}m)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApplyConfirm(false)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    id="btn-apply-elevation-to-all-walls"
                    type="button"
                    onClick={() => setShowApplyConfirm(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply {wallH.toFixed(2)}m to All Walls
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
