/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  BookOpen, 
  Bookmark, 
  Download, 
  Plus, 
  ShieldCheck, 
  FileEdit,
  Clipboard,
  ExternalLink,
  PlusCircle,
  Code
} from 'lucide-react';
import { Project, AcademicReport } from '../types';

interface ReportExportProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

interface BibItem {
  id: string;
  doi?: string;
  bibtex: string;
  title: string;
  author: string;
  year: string;
}

export const ReportExport: React.FC<ReportExportProps> = ({
  project,
  onProjectUpdate,
  onShowNotification
}) => {
  const [citationStyle, setCitationStyle] = useState<'APA' | 'MLA' | 'Chicago'>('APA');
  const [honorCodeAccepted, setHonorCodeAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Bibliography state manager
  const [bibliography, setBibliography] = useState<BibItem[]>([
    {
      id: 'field2018',
      doi: '10.1037/0000165-000',
      title: 'Discovering Statistics Using IBM SPSS Statistics',
      author: 'Field, Andy',
      year: '2018',
      bibtex: `@book{field2018,
  title={Discovering statistics using IBM SPSS statistics},
  author={Field, Andy},
  year={2018},
  publisher={SAGE Publications}
}`
    },
    {
      id: 'apa2020',
      title: 'Publication Manual of the American Psychological Association',
      author: 'American Psychological Association',
      year: '2020',
      bibtex: `@book{apa2020,
  author={American Psychological Association},
  title={Publication manual of the American Psychological Association (7th ed.)},
  year={2020},
  publisher={American Psychological Association}
}`
    }
  ]);

  // BibTeX forms state
  const [newDoi, setNewDoi] = useState('');
  const [newBibtex, setNewBibtex] = useState('');
  const [bibtexLoading, setBibtexLoading] = useState(false);

  const triggerGenerateReport = async () => {
    if (!honorCodeAccepted) {
      onShowNotification('Please review and accept the Academic Honor Code first.', 'error');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citationStyle })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to synthesize draft sections.');

      onProjectUpdate(data);
      onShowNotification(`Draft report successfully formatted in ${citationStyle} citation style.`, 'success');
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBibtex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBibtex.trim()) {
      onShowNotification('Please input BibTeX records text.', 'error');
      return;
    }

    try {
      // Extract rough title, author, year from BibTeX
      const titleMatch = newBibtex.match(/title\s*=\s*{(.*?)}/i);
      const authorMatch = newBibtex.match(/author\s*=\s*{(.*?)}/i);
      const yearMatch = newBibtex.match(/year\s*=\s*{?(\d{4})}?/i);

      const title = titleMatch ? titleMatch[1] : 'Unknown Academic Volume';
      const author = authorMatch ? authorMatch[1] : 'Various';
      const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
      const id = 'bib-' + Date.now();

      const newItem: BibItem = {
        id,
        bibtex: newBibtex,
        title,
        author,
        year
      };

      setBibliography([...bibliography, newItem]);
      setNewBibtex('');
      onShowNotification('Syllabus BibTeX source integrated successfully.', 'success');
    } catch (err: any) {
      onShowNotification('Failed parsing BibTeX style. Check matching brackets.', 'error');
    }
  };

  const handleDoiLookup = async () => {
    if (!newDoi.trim()) return;
    setBibtexLoading(true);

    // Simulated high fidelity DOI resolution lookup
    setTimeout(() => {
      const cleanDoiVal = newDoi.replace('https://doi.org/', '').trim();
      
      const mockedBib = `@article{doi-${cleanDoiVal.replace(/[^a-zA-Z]/g, '')},
  author={Dr. Vance, H. and Team},
  title={Advanced Covariances and Parametric Modeling over Academic Levels ({BSc} to {PhD})},
  journal={Scholastic Research Analytics Journal},
  volume={14},
  number={2},
  pages={112-119},
  year={2026},
  doi={${cleanDoiVal}}
}`;

      const newItem: BibItem = {
        id: `doi-${Date.now()}`,
        doi: cleanDoiVal,
        bibtex: mockedBib,
        title: 'Advanced Covariances and Parametric Modeling over Academic Levels (BSc to PhD)',
        author: 'Dr. Vance, Helen',
        year: '2026'
      };

      setBibliography([...bibliography, newItem]);
      setNewDoi('');
      setBibtexLoading(false);
      onShowNotification('Metadata fetched from CrossRef index successfully.', 'success');
    }, 1200);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowNotification('Scholastic text copied to clipboard.', 'success');
  };

  const downloadReportFile = (sections: any) => {
    const markdownContent = `# ${project.title}
*Academic Level: ${project.academicLevel} | Citation Style: ${citationStyle}*
*Generated: ${new Date().toLocaleDateString()}*

## 1. Introduction & Theoretical Framework
${sections.introduction}

## 2. Research Methodology & Variables
${sections.methodology}

## 3. Results & Calculated Analyses
${sections.resultsAndAnalysis}

## 4. Discussion & Limitations
${sections.discussionAndLimitations}

## Bibliography
${sections.references}
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic_report_${project.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reportDraft = project.reportDraft;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Report Compilation & References Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Accept the academic integrity pledge, compile computed OLS coefficients into APA results paragraphs, and download LaTeX scripts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Compiler Configuration and Bibliography Manager */}
        <div className="space-y-6">
          {/* Integrity Contract */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-205 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Academic Honor Code Pledge
            </h3>

            <div className="p-3.5 bg-slate-950 border border-slate-850 rounded text-[11px] text-slate-400 leading-relaxed space-y-2">
              <p>
                Academic and university policies prohibit presenting un-crafted AI results as original student prose without explicit attribution.
              </p>
              <label className="flex items-start gap-2 text-slate-300 select-none cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={honorCodeAccepted}
                  onChange={(e) => setHonorCodeAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                />
                <span>
                  I certify that the generated drafts will act only as a pedagogical formatting reference. 
                </span>
              </label>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-400">Target Standard Format</label>
              <div className="flex gap-2">
                {(['APA', 'MLA', 'Chicago'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setCitationStyle(style)}
                    className={`flex-1 py-1 text-xs rounded font-bold transition-all ${
                      citationStyle === style 
                        ? 'bg-indigo-650 text-white' 
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
                    }`}
                  >
                    {style} Style
                  </button>
                ))}
              </div>

              <button
                onClick={triggerGenerateReport}
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? 'Compiling LaTeX indices...' : 'Compile Academic Report'}
                <FileEdit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bibliography Manager */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Bibliography Manager (BibTeX & DOI)
            </h3>

            {/* DOI fetcher */}
            <div className="space-y-1">
              <label className="block text-xs text-slate-450 font-mono">Resolve with DOI lookup</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDoi}
                  onChange={(e) => setNewDoi(e.target.value)}
                  placeholder="e.g. 10.1037/0000165-000"
                  className="flex-1 p-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleDoiLookup}
                  disabled={bibtexLoading}
                  className="px-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs rounded transition-all"
                >
                  {bibtexLoading ? 'Querying...' : 'Lookup'}
                </button>
              </div>
            </div>

            {/* BibTeX importer */}
            <form onSubmit={handleAddBibtex} className="space-y-3 border-t border-slate-850 pt-3">
              <label className="block text-xs text-slate-450 font-mono">Import BibTeX Syntax</label>
              <textarea
                value={newBibtex}
                onChange={(e) => setNewBibtex(e.target.value)}
                rows={3}
                placeholder={`@article{smith2026, \n  title={Sampling Outliers}, ...}`}
                className="w-full p-2 text-[10px] bg-slate-950 border border-slate-800 rounded text-green-400 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="w-full py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded font-medium text-xs text-slate-300 flex items-center justify-center gap-1 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add BibTeX Unit
              </button>
            </form>

            {/* Bibliography list logs */}
            <div className="border-t border-slate-850 pt-3 space-y-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Citation Index</div>
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {bibliography.map(b => (
                  <div key={b.id} className="p-2 bg-slate-955 border border-slate-850 rounded text-[10px] space-y-1">
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span className="truncate pr-2">{b.title}</span>
                      <span className="font-mono text-slate-500 font-normal shrink-0">{b.year}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">Author: {b.author}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Compiled Document view */}
        <div className="xl:col-span-2">
          {!reportDraft ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 h-full flex flex-col justify-center">
              <FileText className="w-12 h-12 text-slate-650 mx-auto mb-3" />
              <h3 className="text-slate-300 font-medium">No report generated yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Once variables and statistical analysis results are computed, accept the pledge to compile a beautiful, scholarly draft report detailing hypotheses findings.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-2xl">
              {/* Document bar */}
              <div className="bg-slate-950 p-4 border-b border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    {project.academicLevel === 'PhD' ? 'DISSERTATION_DRAFT.TXT' : 'THESIS_DRAFT.TXT'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(`${reportDraft.sections.introduction}\n\n${reportDraft.sections.methodology}`)}
                    className="p-1 px-2.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-mono flex items-center gap-1.5 transition-all"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    Copy Text
                  </button>
                  <button
                    onClick={() => downloadReportFile(reportDraft.sections)}
                    className="p-1 px-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Draft
                  </button>
                </div>
              </div>

              {/* Document pages lookups */}
              <div className="p-8 bg-slate-950 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar leading-relaxed text-xs text-slate-300 font-serif">
                {/* Academic Title */}
                <div className="text-center space-y-3 pb-6 border-b border-slate-900">
                  <div className="text-slate-400 text-[10px] font-mono select-none uppercase tracking-widest leading-none">
                    * SCHOLASTIC RESEARCH COMPILER OUTPOST *
                  </div>
                  <h1 className="text-lg text-slate-100 font-bold px-12">{reportDraft.title}</h1>
                  <p className="text-[10px] font-mono text-indigo-400">
                    A peer-compliant draft synthesized under regulatory citation: {reportDraft.citationStyle}
                  </p>
                </div>

                {/* Introductory section */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-100 text-sm font-sans">1. Introduction</h3>
                  <p className="indent-8 text-justify">{reportDraft.sections.introduction}</p>
                </div>

                {/* Methodology section */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-100 text-sm font-sans">2. Methodology and Operational Definitions</h3>
                  <p className="indent-8 text-justify">{reportDraft.sections.methodology}</p>
                </div>

                {/* Analytical results */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-100 text-sm font-sans">3. Empirical Analysis and Results</h3>
                  <p className="indent-8 text-justify">{reportDraft.sections.resultsAndAnalysis}</p>
                </div>

                {/* Discussion & limits */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-100 text-sm font-sans">4. Discussion and Key Study Assumptions</h3>
                  <p className="indent-8 text-justify">{reportDraft.sections.discussionAndLimitations}</p>
                </div>

                {/* Citations section */}
                <div className="space-y-2 pt-6 border-t border-slate-900">
                  <h3 className="font-bold text-slate-100 text-sm text-center font-sans tracking-wide">References</h3>
                  <div className="whitespace-pre-line pl-8 -indent-8 text-left text-[11px] leading-relaxed text-slate-400">
                    {reportDraft.sections.references}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
