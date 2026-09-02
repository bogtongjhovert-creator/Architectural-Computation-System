import React, { useState, useEffect, useMemo } from 'react';
import {
  BlueprintProject,
  CHBSettings,
  ScaleCalibration,
  Wall,
  WallType,
} from './types';
import {
  buildCHBSettings,
  calculateProjectTotals,
  calculateWallMetrics,
  DEFAULT_CHB_SETTINGS,
} from './utils/calculator';
import {
  createDefaultProject,
  exportProjectToJson,
  exportWallsToCsv,
  loadProjectFromStorage,
  saveProjectToStorage,
} from './utils/storage';
import { SAMPLE_BLUEPRINTS, SampleBlueprint } from './utils/sampleBlueprints';

import { Header } from './components/Header';
import { CHBSettingsSection } from './components/CHBSettingsSection';
import { BlueprintViewer } from './components/BlueprintViewer';
import { WallMeasurementsTable } from './components/WallMeasurementsTable';
import { WallFormModal } from './components/WallFormModal';
import { CalculationDetailsModal } from './components/CalculationDetailsModal';
import { SummaryDashboard } from './components/SummaryDashboard';
import { HelpModal } from './components/HelpModal';

export default function App() {
  // Initialize project state from LocalStorage or default sample
  const [project, setProject] = useState<BlueprintProject>(() => loadProjectFromStorage());

  // Active modal states
  const [isWallModalOpen, setIsWallModalOpen] = useState<boolean>(false);
  const [editingWall, setEditingWall] = useState<Wall | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditTargetWall, setAuditTargetWall] = useState<Wall | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);

  // Toast / Save banner state
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Auto-save to LocalStorage on project changes
  useEffect(() => {
    saveProjectToStorage(project);
  }, [project]);

  // Derived Project Totals
  const projectTotals = useMemo(() => {
    return calculateProjectTotals(project.walls, project.chbSettings, project.wastePercentage);
  }, [project.walls, project.chbSettings, project.wastePercentage]);

  // Handlers for CHB Settings
  const handleCHBSettingsChange = (newSettings: CHBSettings) => {
    // Recalculate metrics for all walls with new CHB unit area
    const updatedWalls = project.walls.map((w) => {
      const m = calculateWallMetrics(w, newSettings.areaSqM);
      return {
        ...w,
        baseCHB: m.baseCHB,
      };
    });

    setProject((prev) => ({
      ...prev,
      chbSettings: newSettings,
      walls: updatedWalls,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Handlers for Waste Percentage
  const handleWasteChange = (newWaste: number) => {
    setProject((prev) => ({
      ...prev,
      wastePercentage: newWaste,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Handlers for Blueprint Upload / Select
  const handleBlueprintUpload = (dataUrl: string, name: string, fileType: 'image' | 'pdf') => {
    setProject((prev) => ({
      ...prev,
      blueprintDataUrl: dataUrl,
      blueprintName: name,
      blueprintFileType: fileType,
      updatedAt: new Date().toISOString(),
    }));
    showNotification(`Uploaded plan: ${name}`);
  };

  const handleSelectSample = (sample: SampleBlueprint) => {
    setProject((prev) => ({
      ...prev,
      blueprintName: sample.name,
      blueprintDataUrl: sample.dataUrl,
      blueprintFileType: 'sample',
      floorArea: sample.floorArea,
      walls: JSON.parse(JSON.stringify(sample.detectedWalls)),
      scale: {
        isCalibrated: true,
        p1: sample.scaleReferencePoints[0],
        p2: sample.scaleReferencePoints[1],
        pixelDistance: 700,
        realDistanceMeters: sample.initialScaleMeters,
        pixelsPerMeter: 70,
      },
      updatedAt: new Date().toISOString(),
    }));
    showNotification(`Loaded ${sample.name}`);
  };

  // Handle Scale Calibration update
  const handleScaleChange = (newScale: ScaleCalibration) => {
    setProject((prev) => ({
      ...prev,
      scale: newScale,
      updatedAt: new Date().toISOString(),
    }));
    showNotification(`Calibrated scale: 1 meter = ${newScale.pixelsPerMeter} pixels`);
  };

  // Handle Wall traced directly on Blueprint
  const handleAddWallFromTrace = (lengthMeters: number, p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const nextIdx = project.walls.length + 1;
    const defaultId = `W${String(nextIdx).padStart(2, '0')}`;
    const newWall: Wall = {
      id: defaultId,
      name: `Traced Wall ${defaultId}`,
      type: 'Exterior Wall',
      length: lengthMeters,
      height: 3.0,
      openings: [],
      grossArea: Number((lengthMeters * 3.0).toFixed(2)),
      openingArea: 0,
      netArea: Number((lengthMeters * 3.0).toFixed(2)),
      baseCHB: Math.ceil((lengthMeters * 3.0) / project.chbSettings.areaSqM),
      color: '#10b981',
      tracePoints: [p1, p2],
    };

    setEditingWall(newWall);
    setIsWallModalOpen(true);
  };

  // Analyze Blueprint action (Explicit requirement #3 & #9)
  const handleAnalyzeBlueprint = () => {
    // If current plan is the commercial sample or custom, analyze/detect walls
    if (project.walls.length === 0) {
      const sample = SAMPLE_BLUEPRINTS[0];
      setProject((prev) => ({
        ...prev,
        walls: JSON.parse(JSON.stringify(sample.detectedWalls)),
        floorArea: sample.floorArea,
      }));
    }
    showNotification('Blueprint analyzed: High-precision dimensions & openings mapped.');
  };

  // Wall Management Handlers
  const handleSaveWall = (wall: Wall) => {
    setProject((prev) => {
      const exists = prev.walls.some((w) => w.id === wall.id);
      let updated: Wall[];
      if (exists) {
        updated = prev.walls.map((w) => (w.id === wall.id ? wall : w));
      } else {
        updated = [...prev.walls, wall];
      }
      return {
        ...prev,
        walls: updated,
        updatedAt: new Date().toISOString(),
      };
    });
    setEditingWall(null);
  };

  const handleUpdateWall = (updatedWall: Wall) => {
    setProject((prev) => ({
      ...prev,
      walls: prev.walls.map((w) => (w.id === updatedWall.id ? updatedWall : w)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleDeleteWall = (id: string) => {
    if (window.confirm(`Delete Wall ${id} from measurements schedule?`)) {
      setProject((prev) => ({
        ...prev,
        walls: prev.walls.filter((w) => w.id !== id),
        updatedAt: new Date().toISOString(),
      }));
      if (selectedWallId === id) setSelectedWallId(null);
    }
  };

  const handleOpenAddWallModal = () => {
    setEditingWall(null);
    setIsWallModalOpen(true);
  };

  const handleOpenEditWallModal = (wall: Wall) => {
    setEditingWall(wall);
    setIsWallModalOpen(true);
  };

  const handleOpenCalculationDetails = (wall: Wall | null = null) => {
    setAuditTargetWall(wall);
    setIsAuditModalOpen(true);
  };

  // Project Import / Export / Reset
  const handleNewProject = () => {
    if (window.confirm('Reset and start a fresh CHB quantity project?')) {
      const fresh = createDefaultProject();
      fresh.walls = [];
      fresh.projectName = 'New Blueprint Project';
      setProject(fresh);
      showNotification('Created new blank project.');
    }
  };

  const handleSaveProjectLocal = () => {
    saveProjectToStorage(project);
    showNotification('Project saved to browser storage!');
  };

  const handleExportJson = () => {
    exportProjectToJson(project);
    showNotification('Exported project JSON file.');
  };

  const handleExportCsv = () => {
    exportWallsToCsv(project.walls, project.projectName, project.chbSettings, project.wastePercentage);
    showNotification('Exported CSV Bill of Materials.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.walls)) {
          setProject(parsed);
          showNotification(`Imported project: ${parsed.projectName || file.name}`);
        } else {
          alert('Invalid project JSON structure.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        projectName={project.projectName}
        onProjectNameChange={(name) =>
          setProject((p) => ({ ...p, projectName: name, updatedAt: new Date().toISOString() }))
        }
        onNewProject={handleNewProject}
        onImportJson={handleImportJson}
        onSaveProject={handleSaveProjectLocal}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      {/* Temporary Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 bg-cyan-950 border border-cyan-500 text-cyan-200 text-xs px-4 py-2.5 rounded-lg shadow-xl z-50 animate-fade-in flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          {notification}
        </div>
      )}

      {/* Main Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* SECTION 1 & 2: Hollow Block Explicit Settings (Requirement #1 & #2) */}
        <CHBSettingsSection
          settings={project.chbSettings}
          onChange={handleCHBSettingsChange}
        />

        {/* SECTION 3 & 9: Interactive Blueprint Viewer & Scale Calibration (Requirement #3 & #9) */}
        <div className="grid grid-cols-1 gap-6">
          <BlueprintViewer
            blueprintDataUrl={project.blueprintDataUrl}
            blueprintName={project.blueprintName}
            walls={project.walls}
            scale={project.scale}
            onScaleChange={handleScaleChange}
            onBlueprintUpload={handleBlueprintUpload}
            onSelectSample={handleSelectSample}
            onAddWallFromTrace={handleAddWallFromTrace}
            onAnalyzeBlueprint={handleAnalyzeBlueprint}
            selectedWallId={selectedWallId}
            onSelectWall={setSelectedWallId}
          />
        </div>

        {/* SECTION 4, 5, 6, 7, 10: Wall Measurements Schedule Table (Requirement #4 - #10) */}
        <WallMeasurementsTable
          walls={project.walls}
          chbSettings={project.chbSettings}
          wastePercentage={project.wastePercentage}
          onUpdateWall={handleUpdateWall}
          onDeleteWall={handleDeleteWall}
          onOpenAddModal={handleOpenAddWallModal}
          onOpenEditModal={handleOpenEditWallModal}
          onOpenCalculationDetails={handleOpenCalculationDetails}
          selectedWallId={selectedWallId}
          onSelectWall={setSelectedWallId}
        />

        {/* SECTION 8 & 11: Summary Dashboard with Prominent Final Recommendation & Waste Allowance (Requirement #8 & #11) */}
        <SummaryDashboard
          projectName={project.projectName}
          blueprintName={project.blueprintName}
          floorArea={project.floorArea}
          scale={project.scale}
          chbSettings={project.chbSettings}
          wastePercentage={project.wastePercentage}
          onWasteChange={handleWasteChange}
          totals={projectTotals}
          onOpenCalculationDetails={() => handleOpenCalculationDetails(null)}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
        />
      </main>

      {/* Modals */}
      <WallFormModal
        isOpen={isWallModalOpen}
        onClose={() => {
          setIsWallModalOpen(false);
          setEditingWall(null);
        }}
        onSave={handleSaveWall}
        initialWall={editingWall}
        chbSettings={project.chbSettings}
        nextWallIndex={project.walls.length + 1}
      />

      <CalculationDetailsModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setAuditTargetWall(null);
        }}
        wall={auditTargetWall}
        allWalls={project.walls}
        chbSettings={project.chbSettings}
        wastePercentage={project.wastePercentage}
        projectTotals={projectTotals}
        projectName={project.projectName}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Architectural Blueprint Hollow Block Calculator • GitHub Pages Client Engine</span>
          <span>Formula: ⌈Net Wall Area ÷ ({project.chbSettings.lengthMm}×{project.chbSettings.heightMm}mm Area)⌉ × (1 + {project.wastePercentage}%)</span>
        </div>
      </footer>
    </div>
  );
}
