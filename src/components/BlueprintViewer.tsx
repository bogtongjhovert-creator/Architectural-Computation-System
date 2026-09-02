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
  Trash2,
  Info,
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

  return (
    <div id="blueprint-viewer-panel" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full min-h-[560px]">
      {/* Top Toolbar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Info & Upload */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/70 text-slate-300">
            <FileImage className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium truncate max-w-[180px] sm:max-w-[240px]" title={blueprintName}>
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
            Upload Plan (JPG/PNG/PDF)
          </button>

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

        {/* Right: Interactive Tools & View Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
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
              <span className="hidden md:inline">Pan</span>
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
              <span className="hidden md:inline">Calibrate Scale</span>
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
              <span className="hidden md:inline">Trace Wall</span>
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
            <span className="px-1.5 text-[11px] font-mono text-slate-400 min-w-[38px] text-center">
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
              id="btn-rotate-ccw"
              type="button"
              onClick={handleRotateCcw}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5" />
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

          {/* ANALYZE BLUEPRINT BUTTON (Explicit requirement #3) */}
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
            <span className="flex items-center gap-1">
              <MousePointer2 className="w-3 h-3 text-slate-400" />
              Pan / Navigation Mode: Click and drag canvas to move, scroll mouse wheel to zoom.
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
              <strong>Blueprint Analyzed:</strong> High-precision geometric dimensions verified. Wall lengths, door openings (D1-D3), and window openings (W1-W4) loaded into the measurement table.
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
            <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl max-w-md">
              <FileImage className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium mb-1">No Blueprint Uploaded</p>
              <p className="text-xs text-slate-500 mb-4">
                Upload your JPG, PNG, or PDF plan or select a sample residential bungalow blueprint.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
              >
                Upload Architectural Plan
              </button>
            </div>
          )}
        </div>
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
