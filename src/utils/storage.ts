import { BlueprintProject, CHBSettings, Wall, BuildingElevation } from '../types';
import { DEFAULT_CHB_SETTINGS, DEFAULT_ENGINEERING_SETTINGS, DEFAULT_BUILDING_ELEVATION } from './calculator';
import { SAMPLE_BLUEPRINTS } from './sampleBlueprints';

const STORAGE_KEY = 'blueprint_chb_calculator_v1';
const RECENT_PROJECTS_KEY = 'blueprint_chb_recent_projects_v1';

export function createDefaultProject(): BlueprintProject {
  const sample = SAMPLE_BLUEPRINTS[0];
  return {
    id: 'project-default',
    projectName: 'Residential Bungalow Model 1',
    blueprintName: sample.name,
    blueprintDataUrl: sample.dataUrl,
    blueprintFileType: 'sample',
    floorArea: sample.floorArea,
    chbSettings: { ...DEFAULT_CHB_SETTINGS },
    engineeringSettings: { ...DEFAULT_ENGINEERING_SETTINGS },
    elevation: { ...DEFAULT_BUILDING_ELEVATION },
    wastePercentage: 10,
    walls: JSON.parse(JSON.stringify(sample.detectedWalls)),
    scale: {
      isCalibrated: true,
      p1: sample.scaleReferencePoints[0],
      p2: sample.scaleReferencePoints[1],
      pixelDistance: 700,
      realDistanceMeters: sample.initialScaleMeters,
      pixelsPerMeter: 70,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Initial blueprint load with standard 400x200mm hollow blocks at 10% waste allowance and building elevation profile.',
  };
}

export function saveProjectToStorage(project: BlueprintProject): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    // Also save in recent project list
    const recentsRaw = localStorage.getItem(RECENT_PROJECTS_KEY);
    let recents: Array<{ id: string; name: string; updatedAt: string; wallCount: number }> = [];
    if (recentsRaw) {
      recents = JSON.parse(recentsRaw);
    }
    const idx = recents.findIndex((p) => p.id === project.id);
    const summary = {
      id: project.id,
      name: project.projectName || 'Untitled Project',
      updatedAt: new Date().toISOString(),
      wallCount: project.walls.length,
    };
    if (idx >= 0) {
      recents[idx] = summary;
    } else {
      recents.unshift(summary);
    }
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recents.slice(0, 10)));
  } catch (err) {
    console.warn('Unable to persist project to LocalStorage:', err);
  }
}

export function loadProjectFromStorage(): BlueprintProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.walls && Array.isArray(parsed.walls)) {
        // Ensure all walls have valid tracePoints if they were saved in an older version
        const sample = SAMPLE_BLUEPRINTS[0];
        const sampleWallMap = new Map(sample.detectedWalls.map((w) => [w.id, w.tracePoints]));

        parsed.walls = parsed.walls.map((w: Wall, idx: number) => {
          if (!w.tracePoints || !Array.isArray(w.tracePoints) || w.tracePoints.length < 2) {
            const mappedTrace = sampleWallMap.get(w.id);
            if (mappedTrace) {
              return { ...w, tracePoints: mappedTrace };
            }
          }
          return w;
        });

        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading from LocalStorage:', err);
  }
  return createDefaultProject();
}

export function exportProjectToJson(project: BlueprintProject): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  const filename = `${(project.projectName || 'chb-project').toLowerCase().replace(/[^a-z0-9]/g, '_')}_estimate.json`;
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportWallsToCsv(
  walls: Wall[],
  projectName: string,
  chbSettings: CHBSettings,
  wastePercentage: number
): void {
  const headers = [
    'Wall ID',
    'Wall Name',
    'Wall Type',
    'Length (m)',
    'Height (m)',
    'Gross Area (m²)',
    'Openings Count',
    'Opening Area (m²)',
    'Net Area (m²)',
    'CHB Size (mm)',
    'Base CHB (pcs)',
    `Waste %`,
    'Final Recommended CHB (pcs)',
  ];

  const rows = walls.map((w) => {
    const finalWallCHB = Math.ceil(w.baseCHB * (1 + wastePercentage / 100));
    return [
      `"${w.id}"`,
      `"${w.name.replace(/"/g, '""')}"`,
      `"${w.type}"`,
      w.length.toFixed(2),
      w.height.toFixed(2),
      w.grossArea.toFixed(2),
      w.openings.length,
      w.openingArea.toFixed(2),
      w.netArea.toFixed(2),
      `"${chbSettings.lengthMm}x${chbSettings.heightMm}"`,
      w.baseCHB,
      `${wastePercentage}%`,
      finalWallCHB,
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  const filename = `${(projectName || 'chb_walls').toLowerCase().replace(/[^a-z0-9]/g, '_')}_bill_of_materials.csv`;
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
