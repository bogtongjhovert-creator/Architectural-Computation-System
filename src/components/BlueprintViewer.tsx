import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Upload,
  Ruler,
  Compass,
  CheckCircle2,
  ScanLine,
  FileImage,
  Layers,
  Sparkles,
  MousePointer2,
  MapPin,
  Target,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Crosshair,
  PenTool,
} from 'lucide-react';
import { ScaleCalibration, Wall } from '../types';
import { SAMPLE_BLUEPRINTS, SampleBlueprint } from '../utils/sampleBlueprints';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF Worker initialization note:', e);
}

interface Props {
  blueprintDataUrl: string | null;
  blueprintName: string;
  walls: Wall[];
  scale: ScaleCalibration;
  onScaleChange: (newScale: ScaleCalibration) => void;
  onBlueprintUpload: (dataUrl: string, name: string, fileType: 'image' | 'pdf') => void;
  onSelectSample: (sample: SampleBlueprint) => void;
  onAddWallFromTrace: (lengthMeters: number, p1: { x: number; y: number }, p2: { x: number; y: number }) => void;
  onAnalyzeBlueprint: () => void;
  selectedWallId: string | null;
  onSelectWall: (id: string | null) => void;
  onOpenDesigner?: () => void;
}

type ToolMode = 'pan' | 'calibrate' | 'trace';

export const BlueprintViewer: React.FC<Props> = ({
  blueprintDataUrl,
  blueprintName,
  walls,
  scale,
  onScaleChange,
  onBlueprintUpload,
  onSelectSample,
  onAddWallFromTrace,
  onAnalyzeBlueprint,
  selectedWallId,
  onSelectWall,
  onOpenDesigner,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Tools
  const [activeTool, setActiveTool] = useState<ToolMode>('pan');
  const [calibPoint1, setCalibPoint1] = useState<{ x: number; y: number } | null>(null);
  const [calibPoint2, setCalibPoint2] = useState<{ x: number; y: number } | null>(null);
  const [showCalibModal, setShowCalibModal] = useState<boolean>(false);
  const [knownDistanceInput, setKnownDistanceInput] = useState<string>('10.00');

  // Wall tracing state
  const [traceStart, setTraceStart] = useState<{ x: number; y: number } | null>(null);
  const [traceCurrent, setTraceCurrent] = useState<{ x: number; y: number } | null>(null);

  // Wall Highlight Overlays state
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);
  const [showWallOverlays, setShowWallOverlays] = useState<boolean>(true);

  // Loading indicator for PDF or heavy blueprint processing
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [showAnalysisBanner, setShowAnalysisBanner] = useState<boolean>(false);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(4, Number((z * 1.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.2, Number((z / 1.25).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotateCw = () => setRotation((r) => (r + 90) % 360);
  const handleRotateCcw = () => setRotation((r) => (r - 90 + 360) % 360);

  // Helper to safely get (p1, p2) coordinates for any wall
  const getWallCoordinates = useCallback(
    (wall: Wall, index: number, total: number) => {
      if (wall.tracePoints && Array.isArray(wall.tracePoints) && wall.tracePoints.length >= 2) {
        return {
          p1: wall.tracePoints[0],
          p2: wall.tracePoints[1],
        };
      }

      // Synthesize smart layout coordinates based on wall name or ordinal index
      const name = (wall.name || '').toLowerCase();
      if (name.includes('north')) {
        return { p1: { x: 150, y: 157 }, p2: { x: 850, y: 157 } };
      }
      if (name.includes('south')) {
        return { p1: { x: 150, y: 563 }, p2: { x: 850, y: 563 } };
      }
      if (name.includes('west')) {
        return { p1: { x: 157, y: 150 }, p2: { x: 157, y: 570 } };
      }
      if (name.includes('east')) {
        return { p1: { x: 843, y: 150 }, p2: { x: 843, y: 570 } };
      }
      if (name.includes('bedroom')) {
        return { p1: { x: 505, y: 150 }, p2: { x: 505, y: 380 } };
      }
      if (name.includes('divider') || name.includes('living') || name.includes('kitchen')) {
        return { p1: { x: 500, y: 375 }, p2: { x: 720, y: 375 } };
      }
      if (name.includes('toilet') || name.includes('bath') || name.includes('t&b')) {
        return { p1: { x: 715, y: 370 }, p2: { x: 715, y: 570 } };
      }

      // Default distribute
      const stepY = 180 + ((index * 55) % 380);
      return { p1: { x: 180, y: stepY }, p2: { x: 820, y: stepY } };
    },
    []
  );

  // Center view on a specific wall's midpoint
  const centerOnWall = useCallback(
    (wallId: string) => {
      const idx = walls.findIndex((w) => w.id === wallId);
      if (idx === -1) return;
      const wall = walls[idx];
      const coords = getWallCoordinates(wall, idx, walls.length);
      const midX = (coords.p1.x + coords.p2.x) / 2;
      const midY = (coords.p1.y + coords.p2.y) / 2;

      // Target zoom 1.3
      const targetZoom = Math.max(1.2, zoom);
      setZoom(targetZoom);
      // Pan so midX, midY moves to center (500, 350 in 1000x700 viewport)
      setPan({
        x: Number((-(midX - 500) * targetZoom).toFixed(1)),
        y: Number((-(midY - 350) * targetZoom).toFixed(1)),
      });
    },
    [walls, getWallCoordinates, zoom]
  );

  // Next / Previous Wall Selectors
  const selectNextWall = () => {
    if (walls.length === 0) return;
    if (!selectedWallId) {
      onSelectWall(walls[0].id);
      return;
    }
    const curIdx = walls.findIndex((w) => w.id === selectedWallId);
    const nextIdx = (curIdx + 1) % walls.length;
    onSelectWall(walls[nextIdx].id);
  };

  const selectPrevWall = () => {
    if (walls.length === 0) return;
    if (!selectedWallId) {
      onSelectWall(walls[walls.length - 1].id);
      return;
    }
    const curIdx = walls.findIndex((w) => w.id === selectedWallId);
    const prevIdx = (curIdx - 1 + walls.length) % walls.length;
    onSelectWall(walls[prevIdx].id);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.max(0.2, Math.min(4, Number((z * zoomFactor).toFixed(2)))));
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Get click position relative to unzoomed image coordinate space
    const clickX = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom + 500;
    const clickY = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom + 350;

    if (activeTool === 'calibrate') {
      if (!calibPoint1) {
        setCalibPoint1({ x: clickX, y: clickY });
      } else if (!calibPoint2) {
        setCalibPoint2({ x: clickX, y: clickY });
        setShowCalibModal(true);
      } else {
        // restart calibration
        setCalibPoint1({ x: clickX, y: clickY });
        setCalibPoint2(null);
      }
      return;
    }

    if (activeTool === 'trace') {
      setTraceStart({ x: clickX, y: clickY });
      setTraceCurrent({ x: clickX, y: clickY });
      return;
    }

    // Default pan
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && activeTool === 'pan') {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (activeTool === 'trace' && traceStart) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const curX = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom + 500;
      const curY = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom + 350;
      setTraceCurrent({ x: curX, y: curY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
    if (activeTool === 'trace' && traceStart && traceCurrent) {
      const dx = traceCurrent.x - traceStart.x;
      const dy = traceCurrent.y - traceStart.y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      if (pixelDist > 15) {
        // Calculate real distance using calibrated scale
        const ppm = scale.pixelsPerMeter > 0 ? scale.pixelsPerMeter : 70; // fallback 70px/m
        const meters = Number((pixelDist / ppm).toFixed(2));
        onAddWallFromTrace(meters, traceStart, traceCurrent);
      }
      setTraceStart(null);
      setTraceCurrent(null);
    }
  };

  // Confirm Calibration
  const handleConfirmCalibration = () => {
    if (!calibPoint1 || !calibPoint2) return;
    const dx = calibPoint2.x - calibPoint1.x;
    const dy = calibPoint2.y - calibPoint1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const realMeters = Math.max(0.1, parseFloat(knownDistanceInput) || 10.0);
    const pixelsPerMeter = pixelDistance / realMeters;

    onScaleChange({
      isCalibrated: true,
      p1: calibPoint1,
      p2: calibPoint2,
      pixelDistance: Number(pixelDistance.toFixed(1)),
      realDistanceMeters: realMeters,
      pixelsPerMeter: Number(pixelsPerMeter.toFixed(2)),
    });

    setShowCalibModal(false);
    setActiveTool('pan');
  };

  // Upload Handler (JPG, JPEG, PNG, PDF)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    const filename = file.name;
    const isPdf = file.type === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');

    try {
      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          // Render page to canvas
          await page.render({ canvasContext: context, viewport, canvas } as any).promise;
          const dataUrl = canvas.toDataURL('image/png');
          onBlueprintUpload(dataUrl, filename, 'pdf');
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onBlueprintUpload(event.target.result as string, filename, 'image');
          }
        };
        reader.readAsDataURL(file);
      }
      handleResetView();
    } catch (err) {
      console.error('Error reading blueprint file:', err);
      alert('Could not render file. Please verify it is a valid JPG, PNG, or PDF file.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const triggerAnalyze = () => {
    setShowAnalysisBanner(true);
    onAnalyzeBlueprint();
    setTimeout(() => {
      setShowAnalysisBanner(false);
    }, 4000);
  };

  // Find currently selected wall object
  const activeSelectedWall = walls.find((w) => w.id === selectedWallId) || null;

  return (
    <div id="blueprint-viewer-panel" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full min-h-[580px]">
      {/* Top Toolbar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Info & Upload */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/70 text-slate-300">
            <FileImage className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium truncate max-w-[160px] sm:max-w-[200px]" title={blueprintName}>
              {blueprintName || 'No Blueprint Loaded'}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload-blueprint"
          />

          <button
            id="btn-upload-blueprint"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Plan
          </button>

          {onOpenDesigner && (
            <button
              id="btn-open-cad-studio"
              type="button"
              onClick={onOpenDesigner}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-colors shadow-sm"
              title="Design blueprint on the system using in-app CAD Studio"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Make Blueprint</span>
            </button>
          )}

          {/* Sample Plans Switcher */}
          <div className="flex items-center gap-1 ml-1">
            <span className="text-slate-500 text-[11px] hidden sm:inline">Samples:</span>
            {SAMPLE_BLUEPRINTS.map((sb) => (
              <button
                key={sb.id}
                id={`btn-sample-${sb.id}`}
                type="button"
                onClick={() => {
                  onSelectSample(sb);
                  handleResetView();
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  blueprintName === sb.name
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sb.category}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Interactive Tools, Wall Selector & View Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Wall Selector Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <select
              id="select-highlight-wall"
              value={selectedWallId || ''}
              onChange={(e) => onSelectWall(e.target.value || null)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer py-1 max-w-[140px] sm:max-w-[170px] truncate"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                📍 Highlight Wall... ({walls.length})
              </option>
              {walls.map((w) => (
                <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                  {w.id}: {w.name} ({w.length}m)
                </option>
              ))}
            </select>
          </div>

          {/* Wall Overlay Toggle */}
          <button
            type="button"
            onClick={() => setShowWallOverlays(!showWallOverlays)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              showWallOverlays
                ? 'bg-blue-950/80 border-blue-600/80 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Wall Highlighting Overlay on Blueprint"
          >
            {showWallOverlays ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">Overlay</span>
          </button>

          {/* Tool Modes */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              id="tool-pan"
              type="button"
              onClick={() => setActiveTool('pan')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                activeTool === 'pan'
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Pan / Navigate tool (Click and drag to move)"
            >
              <MousePointer2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Pan</span>
            </button>

            <button
              id="tool-calibrate"
              type="button"
              onClick={() => {
                setActiveTool('calibrate');
                setCalibPoint1(null);
                setCalibPoint2(null);
              }}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                activeTool === 'calibrate'
                  ? 'bg-amber-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Scale Calibration (Click 2 points on a known dimension line)"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Calibrate</span>
            </button>

            <button
              id="tool-trace"
              type="button"
              onClick={() => setActiveTool('trace')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                activeTool === 'trace'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Trace Wall Tool (Click & drag to measure real wall length)"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Trace</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Zoom / Rotate Controls */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              id="btn-zoom-in"
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono text-slate-400 min-w-[34px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              id="btn-zoom-out"
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-rotate-cw"
              type="button"
              onClick={handleRotateCw}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-reset-view"
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ANALYZE BLUEPRINT BUTTON */}
          <button
            id="btn-analyze-blueprint"
            type="button"
            onClick={triggerAnalyze}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-950"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Blueprint
          </button>
        </div>
      </div>

      {/* Tool Helper / Status Strip */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {activeTool === 'calibrate' && (
            <span className="text-amber-400 flex items-center gap-1 font-medium animate-pulse">
              <Ruler className="w-3.5 h-3.5" />
              Scale Mode: Click 2 points along a known dimension line (e.g. 10.0m) to calibrate meters per pixel.
            </span>
          )}
          {activeTool === 'trace' && (
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <Compass className="w-3.5 h-3.5" />
              Trace Wall Mode: Click and drag along any wall on the plan to measure real length.
            </span>
          )}
          {activeTool === 'pan' && (
            <span className="flex items-center gap-1 text-slate-300">
              <MousePointer2 className="w-3 h-3 text-cyan-400" />
              Interactive Mode: Click any wall on the blueprint or in the table below to highlight its exact position.
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                scale.isCalibrated ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {scale.isCalibrated
              ? `Scale: 1m = ${scale.pixelsPerMeter}px`
              : 'Scale: Uncalibrated (Default 70px/m)'}
          </span>
          <span>Rotation: {rotation}°</span>
        </div>
      </div>

      {/* Analysis Banner Notification */}
      {showAnalysisBanner && (
        <div className="bg-cyan-950/90 border-b border-cyan-500/50 px-4 py-2 text-xs text-cyan-200 flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>
              <strong>Blueprint Analyzed:</strong> High-precision geometric dimensions verified. Wall lengths, door openings, and window openings mapped and ready for calculation.
            </span>
          </div>
          <button
            onClick={() => setShowAnalysisBanner(false)}
            className="text-cyan-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Interactive Canvas / Blueprint View Area */}
      <div
        ref={containerRef}
        id="blueprint-canvas-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`relative flex-1 bg-slate-950 overflow-hidden select-none cursor-${
          activeTool === 'pan'
            ? isDragging
              ? 'grabbing'
              : 'grab'
            : activeTool === 'calibrate'
            ? 'crosshair'
            : 'crosshair'
        }`}
      >
        {isLoadingFile && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-30">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-slate-300">Rendering high-resolution blueprint...</p>
          </div>
        )}

        {/* Blueprint Visual Layer */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          {blueprintDataUrl ? (
            <div className="relative w-[1000px] h-[700px] bg-slate-900 shadow-2xl border border-slate-700/50">
              <img
                ref={imageRef}
                src={blueprintDataUrl}
                alt="Architectural Blueprint"
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />

              {/* WALL HIGHLIGHTING & INTERACTIVE SVG OVERLAY */}
              <svg className="absolute inset-0 w-full h-full pointer-events-auto z-15" viewBox="0 0 1000 700">
                <defs>
                  {/* Glow filter for active highlighted wall */}
                  <filter id="wall-glow-active" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f59e0b" floodOpacity="0.9" />
                    <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#38bdf8" floodOpacity="0.7" />
                  </filter>
                  {/* Glow filter for hovered wall */}
                  <filter id="wall-glow-hover" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.8" />
                  </filter>
                  <style>{`
                    @keyframes wallDashMove {
                      from { stroke-dashoffset: 24; }
                      to { stroke-dashoffset: 0; }
                    }
                    .animate-wall-dash {
                      animation: wallDashMove 1s linear infinite;
                    }
                  `}</style>
                </defs>

                {/* Render All Wall Segments */}
                {walls.map((w, idx) => {
                  const coords = getWallCoordinates(w, idx, walls.length);
                  const isSelected = selectedWallId === w.id;
                  const isHovered = hoveredWallId === w.id;
                  const { p1, p2 } = coords;
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;

                  return (
                    <g key={w.id} className="cursor-pointer">
                      {/* Invisible thick hit-area line for easy clicking on blueprint */}
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="transparent"
                        strokeWidth="32"
                        strokeLinecap="round"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWall(isSelected ? null : w.id);
                        }}
                        onMouseEnter={() => setHoveredWallId(w.id)}
                        onMouseLeave={() => setHoveredWallId(null)}
                      />

                      {/* 1. SELECTED WALL HIGHLIGHT (High-contrast glow, aura, target pin) */}
                      {isSelected && (
                        <>
                          {/* Pulsing Aura Capsule */}
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#f59e0b"
                            strokeWidth="20"
                            strokeOpacity="0.45"
                            strokeLinecap="round"
                            className="animate-pulse"
                          />
                          {/* Radiant Glow Filter Line */}
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#f59e0b"
                            strokeWidth="6"
                            strokeLinecap="round"
                            filter="url(#wall-glow-active)"
                          />
                          {/* Animated Marching-Ants Line */}
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            strokeDasharray="8 6"
                            strokeLinecap="round"
                            className="animate-wall-dash"
                          />
                          {/* Endpoint Glowing Markers */}
                          <circle cx={p1.x} cy={p1.y} r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                          <circle cx={p2.x} cy={p2.y} r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />

                          {/* Radar Target Pulse at Midpoint */}
                          <circle
                            cx={midX}
                            cy={midY}
                            r="18"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            className="animate-ping"
                            opacity="0.8"
                          />
                          <circle cx={midX} cy={midY} r="7" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
                        </>
                      )}

                      {/* 2. HOVERED WALL (when not selected) */}
                      {!isSelected && isHovered && (
                        <>
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#38bdf8"
                            strokeWidth="14"
                            strokeOpacity="0.4"
                            strokeLinecap="round"
                          />
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#60a5fa"
                            strokeWidth="4"
                            strokeLinecap="round"
                            filter="url(#wall-glow-hover)"
                          />
                          <circle cx={midX} cy={midY} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                        </>
                      )}

                      {/* 3. NORMAL WALL OVERLAY (when showWallOverlays is ON) */}
                      {!isSelected && !isHovered && showWallOverlays && (
                        <>
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke={w.type === 'Exterior Wall' ? '#38bdf8' : '#818cf8'}
                            strokeWidth="3.5"
                            strokeOpacity="0.65"
                            strokeLinecap="round"
                          />
                          {/* Small Wall ID Badge at midpoint */}
                          <g transform={`translate(${midX}, ${midY})`}>
                            <rect
                              x="-14"
                              y="-8"
                              width="28"
                              height="16"
                              rx="4"
                              fill="#0f172a"
                              fillOpacity="0.85"
                              stroke={w.type === 'Exterior Wall' ? '#38bdf8' : '#818cf8'}
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="3.5"
                              fill="#e2e8f0"
                              fontSize="9"
                              fontWeight="bold"
                              fontFamily="sans-serif"
                              textAnchor="middle"
                            >
                              {w.id}
                            </text>
                          </g>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* FLOATING INTERACTIVE CALLOUT HUD FOR SELECTED WALL */}
              {activeSelectedWall && (() => {
                const idx = walls.findIndex((w) => w.id === activeSelectedWall.id);
                const coords = getWallCoordinates(activeSelectedWall, idx, walls.length);
                const rawMidX = (coords.p1.x + coords.p2.x) / 2;
                const rawMidY = (coords.p1.y + coords.p2.y) / 2;

                // Clamp position inside the 1000x700 container bounds
                const posX = Math.max(140, Math.min(860, rawMidX));
                const posY = Math.max(70, Math.min(630, rawMidY - 54));

                return (
                  <div
                    className="absolute pointer-events-auto z-25 -translate-x-1/2 -translate-y-full transition-all duration-150 animate-fade-in"
                    style={{ left: `${posX}px`, top: `${posY}px` }}
                  >
                    <div className="bg-slate-950/95 text-white border-2 border-amber-500 rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md min-w-[220px] max-w-[280px]">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span className="font-bold text-amber-400 text-xs font-mono">
                            [{activeSelectedWall.id}]
                          </span>
                          <span className="font-semibold text-slate-100 text-xs truncate max-w-[130px]">
                            {activeSelectedWall.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectWall(null)}
                          className="text-slate-400 hover:text-white p-0.5 rounded"
                          title="Deselect Wall"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Specs */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-300">
                          <span>Dimensions:</span>
                          <span className="font-mono font-bold text-white">
                            {activeSelectedWall.length.toFixed(2)}m × {activeSelectedWall.height.toFixed(2)}m
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Net Wall Area:</span>
                          <span className="font-mono font-bold text-cyan-400">
                            {activeSelectedWall.netArea.toFixed(2)} m²
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300 border-t border-slate-800/80 pt-1">
                          <span className="font-medium text-amber-300">Base CHB Requirement:</span>
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {activeSelectedWall.baseCHB.toLocaleString()} pcs
                          </span>
                        </div>
                        {activeSelectedWall.openings.length > 0 && (
                          <div className="text-[10px] text-slate-400 pt-0.5">
                            Deductions: {activeSelectedWall.openings.length} opening(s) (-{activeSelectedWall.openingArea.toFixed(2)}m²)
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Tooltip Arrow Pointer */}
                    <div className="w-3 h-3 bg-amber-500 rotate-45 mx-auto -mt-1.5 shadow-md" />
                  </div>
                );
              })()}

              {/* Calibration Markers Layer */}
              {scale.isCalibrated && scale.p1 && scale.p2 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <line
                    x1={scale.p1.x}
                    y1={scale.p1.y}
                    x2={scale.p2.x}
                    y2={scale.p2.y}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="4,4"
                  />
                  <circle cx={scale.p1.x} cy={scale.p1.y} r="5" fill="#f59e0b" />
                  <circle cx={scale.p2.x} cy={scale.p2.y} r="5" fill="#f59e0b" />
                </svg>
              )}

              {/* Live Active Calibration Points */}
              {calibPoint1 && (
                <div
                  className="absolute w-4 h-4 -ml-2 -mt-2 bg-amber-500 border-2 border-white rounded-full z-20 shadow-md animate-ping"
                  style={{ left: `${calibPoint1.x}px`, top: `${calibPoint1.y}px` }}
                />
              )}
              {calibPoint2 && (
                <div
                  className="absolute w-4 h-4 -ml-2 -mt-2 bg-amber-500 border-2 border-white rounded-full z-20 shadow-md"
                  style={{ left: `${calibPoint2.x}px`, top: `${calibPoint2.y}px` }}
                />
              )}

              {/* Live Tracing Line Preview */}
              {traceStart && traceCurrent && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                  <line
                    x1={traceStart.x}
                    y1={traceStart.y}
                    x2={traceCurrent.x}
                    y2={traceCurrent.y}
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx={traceStart.x} cy={traceStart.y} r="4" fill="#10b981" />
                  <circle cx={traceCurrent.x} cy={traceCurrent.y} r="4" fill="#10b981" />
                </svg>
              )}
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl max-w-md bg-slate-900/60 backdrop-blur-xs">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-lg shadow-cyan-950/50">
                <Compass className="w-7 h-7" />
              </div>
              <p className="text-base text-slate-100 font-bold mb-1">No Blueprint Uploaded</p>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Design and draw custom floor plans directly on the system, upload an existing JPG/PDF blueprint, or pick a sample plan.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {onOpenDesigner && (
                  <button
                    id="btn-empty-make-blueprint"
                    type="button"
                    onClick={onOpenDesigner}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-950 flex items-center justify-center gap-2 transition-all"
                  >
                    <PenTool className="w-4 h-4" />
                    Make Blueprint on System
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Upload Image / PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SELECTED WALL HIGHLIGHT INSPECTOR BAR */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {activeSelectedWall ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold font-mono">
                <Target className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                {activeSelectedWall.id} Highlighted
              </span>
              <span className="font-semibold text-slate-200">
                {activeSelectedWall.name}
              </span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-300 font-mono hidden sm:inline">
                {activeSelectedWall.length.toFixed(2)}m (L) × {activeSelectedWall.height.toFixed(2)}m (H)
              </span>
              <span className="text-slate-400 hidden md:inline">•</span>
              <span className="text-cyan-300 font-mono font-medium hidden md:inline">
                Net: {activeSelectedWall.netArea.toFixed(2)} m²
              </span>
              <span className="text-slate-400 hidden md:inline">•</span>
              <span className="text-amber-400 font-mono font-bold">
                {activeSelectedWall.baseCHB.toLocaleString()} pcs CHB
              </span>
            </div>

            {/* Navigation & Center Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => centerOnWall(activeSelectedWall.id)}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                title="Center viewport directly on this wall"
              >
                <Crosshair className="w-3.5 h-3.5" />
                Center on Wall
              </button>
              <button
                type="button"
                onClick={selectPrevWall}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Previous Wall"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={selectNextWall}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Next Wall"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSelectWall(null)}
                className="p-1 rounded-md bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 border border-slate-700 ml-1"
                title="Clear Highlight"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Click any wall on the blueprint or in the schedule below to highlight where it was extracted from the photo.
            </span>
            <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
              {walls.length} walls mapped
            </span>
          </div>
        )}
      </div>

      {/* Scale Calibration Dialog Modal */}
      {showCalibModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Set Real Dimension</h3>
                <p className="text-xs text-slate-400">Enter the actual real-world length between the two points</p>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="input-known-distance" className="block text-xs font-medium text-slate-300 mb-1">
                Known Length (Meters)
              </label>
              <div className="relative">
                <input
                  id="input-known-distance"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="500"
                  value={knownDistanceInput}
                  onChange={(e) => setKnownDistanceInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 pointer-events-none font-mono">
                  meters (m)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Example: If the reference dimension line indicates 10.00m, enter 10.0.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCalibModal(false);
                  setCalibPoint1(null);
                  setCalibPoint2(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-calibration"
                type="button"
                onClick={handleConfirmCalibration}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
              >
                Save Scale Calibration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
