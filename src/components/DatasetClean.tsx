/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Upload, 
  Trash2, 
  Sparkles, 
  Maximize2, 
  Clock, 
  ChevronRight, 
  FileSpreadsheet, 
  ChevronDown, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Project, AcademicLevel } from '../types';

interface DatasetCleanProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

const SAMPLE_CSV_BSC = `Student_ID,Reading_Score,Grade_Level,Support_Hours,Socio_Economic_Group,Screen_Time_Hrs
STU-01,88,4th Grade,6.5,Mid,2.1
STU-02,62,4th Grade,1.0,Low,5.5
STU-03,94,5th Grade,8.0,High,1.2
STU-04,78,4th Grade,4.0,Mid,3.0
STU-05,54,5th Grade,0.5,Low,7.2
STU-06,82,5th Grade,5.0,High,2.8
STU-07,71,4th Grade,3.5,Low,4.4
STU-08,91,5th Grade,7.0,High,1.5
STU-09,80,4th Grade,4.5,Mid,2.9
STU-10,65,5th Grade,2.0,Low,6.0
STU-11,85,4th Grade,5.5,High,2.2
STU-12,73,5th Grade,3.0,Low,4.8`;

const SAMPLE_CSV_PHD = `Patient_Code,BNP_Level,Age_Years,Ejection_Fraction,Dosage_MG,Resiliency_Index
P-101,1150,68,32,150,4.2
P-102,1420,72,28,200,3.5
P-103,890,59,41,100,5.8
P-104,1850,81,22,250,2.1
P-105,980,63,38,150,4.9
P-106,1280,75,30,200,3.8
P-107,710,52,48,75,6.5
P-108,1600,78,25,250,2.6
P-109,1050,65,36,150,4.7
P-110,1310,70,31,200,3.9`;

export const DatasetClean: React.FC<DatasetCleanProps> = ({
  project,
  onProjectUpdate,
  onShowNotification
}) => {
  const [csvInput, setCsvInput] = useState('');
  const [filenameInput, setFilenameInput] = useState('clinical_trials_data.csv');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [cleaningColumn, setCleaningColumn] = useState('');
  const [cleaningMethod, setCleaningMethod] = useState('drop_missing');
  const [cleanLoading, setCleanLoading] = useState(false);

  // Paste a pre-formatted mock CSV depending on study methodology
  const loadMockCSVTemplate = (level: AcademicLevel) => {
    if (level === 'PhD') {
      setCsvInput(SAMPLE_CSV_PHD);
      setFilenameInput('dissertation_cohort_markers.csv');
    } else {
      setCsvInput(SAMPLE_CSV_BSC);
      setFilenameInput('urban_reading_performance.csv');
    }
    onShowNotification('Syllogistic academic CSV dataset template inserted.', 'success');
  };

  const handleCsvParseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvInput.trim()) {
      onShowNotification('Dataset target block is empty.', 'error');
      return;
    }
    setUploadLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filenameInput,
          fileContent: csvInput
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ingestion fail');

      onProjectUpdate(data);
      onShowNotification('Dataset file structural ingest parsed successfully.', 'success');
      setCsvInput('');
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCleanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleaningColumn) {
      onShowNotification('Please select a target cleaning column.', 'error');
      return;
    }
    setCleanLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnName: cleaningColumn,
          method: cleaningMethod
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cleaning pipeline error');

      onProjectUpdate(data);
      onShowNotification(`Data transform executed: ${cleaningMethod} completed.`, 'success');
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setCleanLoading(false);
    }
  };

  const dataset = project.dataset;

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Dataset Management & Clean Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Incorporate data matrices, verify schema types, audit missing values, and execute reproducible transformation histories (BSc/MSc/PhD compliance).
          </p>
        </div>
      </div>

      {!dataset ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-300">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-200">No active dataset ingested</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            Get started by typing, uploading or loading sample datasets designed specifically to fit standard BSC and PhD statistical methodologies.
          </p>
          
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => loadMockCSVTemplate('BSc')}
              className="px-3 py-1.5 text-xs font-medium border border-slate-800 hover:border-indigo-500 rounded bg-slate-950 text-slate-300 transition-all"
            >
              Load BSc Sample Spreadsheet (Reading Score)
            </button>
            <button
              onClick={() => loadMockCSVTemplate('PhD')}
              className="px-3 py-1.5 text-xs font-medium border border-slate-800 hover:border-emerald-500 rounded bg-slate-950 text-slate-300 transition-all"
            >
              Load PhD Sample Spreadsheet (Biomarkers)
            </button>
          </div>

          <form onSubmit={handleCsvParseSubmit} className="mt-8 text-left max-w-2xl mx-auto space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Spreadsheet File Name</label>
              <input
                type="text"
                value={filenameInput}
                onChange={(e) => setFilenameInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Paste Tabular Content (Comma-separated values, header on first line)
              </label>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                rows={8}
                placeholder="Student_ID,Reading_Score,Grade_Level,Support_Hours,Socio_Economic_Group,Screen_Time_Hrs..."
                className="w-full p-3 font-mono text-xs bg-slate-950 border border-slate-800 rounded text-green-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={uploadLoading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {uploadLoading ? 'Evaluating data...' : 'Ingest and Preview Dataset Schema'}
              <Upload className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* Dataset Ingested View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Table Preview & Columns info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-100 font-medium text-sm">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Active Matrix: <span className="text-emerald-400 text-xs font-mono">{dataset.name}</span>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="font-mono text-slate-100">{dataset.rows.length}</span> Rows x{' '}
                  <span className="font-mono text-slate-100">{dataset.headers.length}</span> Columns
                </div>
              </div>

              {/* Live scrollable preview matrix */}
              <div className="overflow-x-auto border border-slate-800 rounded bg-slate-950 custom-scrollbar max-h-60">
                <table className="w-full text-left text-[11px] text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      {dataset.headers.map((h) => (
                        <th key={h} className="p-2 border-r border-slate-800 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.rows.slice(0, 8).map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-900 hover:bg-slate-900 transition-colors">
                        {dataset.headers.map((h) => (
                          <td key={h} className="p-2 font-mono border-r border-slate-900">
                            {row[h] === null || row[h] === undefined ? (
                              <span className="text-rose-500 italic">null</span>
                            ) : (
                              row[h]
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {dataset.rows.length > 8 && (
                <div className="text-center text-[10px] text-slate-500 font-mono mt-2">
                  Showing first 8 records. All {dataset.rows.length} records evaluated in server mathematical scopes.
                </div>
              )}
            </div>

            {/* Variable Schema Analysis */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Variable Type Induction & Completeness Map
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataset.variables.map((v) => (
                  <div key={v.name} className="p-3 bg-slate-950 border border-slate-850 rounded hover:border-slate-800 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-200">{v.name}</span>
                      <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        v.type === 'numeric' 
                          ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50' 
                          : 'bg-amber-900/40 text-amber-300 border border-amber-850/50'
                      }`}>
                        {v.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 font-mono">
                      <div>
                        Uniques: <span className="text-slate-200 font-bold">{v.uniqueCount}</span>
                      </div>
                      <div>
                        Missing: <span className={v.missingCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{v.missingCount}</span>
                      </div>
                      <div>
                        Pct: <span className={v.missingCount > 0 ? 'text-rose-400' : 'text-slate-500'}>{v.missingPercentage}%</span>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 font-mono truncate">
                      Values: [{v.sampleValues.join(', ')}...]
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cleaning Panel & Reversible History Logs */}
          <div className="space-y-6">
            {/* Cleaning Tool widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Data Transformations Cleaner
              </h3>
              <form onSubmit={handleCleanSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target Column</label>
                  <select
                    value={cleaningColumn}
                    onChange={(e) => setCleaningColumn(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="">-- Choose Column --</option>
                    {dataset.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cleaning Action</label>
                  <select
                    value={cleaningMethod}
                    onChange={(e) => setCleaningMethod(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="drop_missing">Listwise Deletion (Drop Missing Rows)</option>
                    <option value="fill_mean">Imputation (Replace Nulls with Column Mean)</option>
                    <option value="min_max_normalize">Normalization (Min-Max Scaling [0,1])</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={cleanLoading}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {cleanLoading ? 'Running statistics...' : 'Execute Data Pipeline'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Audit Trail versions logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-indigo-400" />
                Pipeline Audit Trail (Reproducible)
              </h3>

              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-850">
                {dataset.versions.map((ver) => (
                  <div key={ver.id} className="relative pl-6 space-y-1">
                    {/* Circle indicators */}
                    <div className="absolute left-[8px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-slate-900 ring-4 ring-slate-900/50" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">{ver.id}: {ver.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{ver.description}</p>
                    <div className="text-[9px] text-indigo-400 font-mono flex gap-2">
                      <span>Rows: {ver.rowCount}</span>
                      <span>•</span>
                      <span>Cols: {ver.columnCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
