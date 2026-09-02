import React, { useState } from 'react';
import {
  Building2,
  FolderOpen,
  Save,
  RotateCcw,
  Sparkles,
  Github,
  HelpCircle,
} from 'lucide-react';

interface Props {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onNewProject: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveProject: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<Props> = ({
  projectName,
  onProjectNameChange,
  onNewProject,
  onImportJson,
  onSaveProject,
  onOpenHelp,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="bg-white border border-slate-200 rounded-2xl shadow-sm sticky top-4 z-40 mx-4 sm:mx-6 my-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Project Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Blueprint CHB Quantity Calculator
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Bento Grid Edition
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => onProjectNameChange(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  autoFocus
                  className="bg-slate-50 border border-blue-500 rounded-lg px-2 py-0.5 text-xs text-slate-900 font-medium focus:outline-none"
                />
              ) : (
                <span
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xs text-slate-500 hover:text-blue-600 cursor-pointer flex items-center gap-1 group font-medium"
                  title="Click to rename project"
                >
                  Project: <strong className="text-slate-800 group-hover:text-blue-600">{projectName || 'Untitled Project'}</strong>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-500">
                    ✎
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImportJson}
            className="hidden"
          />

          <button
            id="btn-import-project"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Import saved project JSON"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Open JSON</span>
          </button>

          <button
            id="btn-save-project-local"
            type="button"
            onClick={onSaveProject}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Save to Browser LocalStorage"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            id="btn-new-project-reset"
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Reset to new project"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          <button
            id="btn-open-help-guide"
            type="button"
            onClick={onOpenHelp}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            title="How it works / Calculation rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
