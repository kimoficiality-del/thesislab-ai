/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Project, 
  AcademicLevel, 
  MethodologyType, 
  ChatMessage 
} from './types';
import { DatasetClean } from './components/DatasetClean';
import { StatsWizards } from './components/StatsWizards';
import { RAGChatbot } from './components/RAGChatbot';
import { SupervisorAdmin } from './components/SupervisorAdmin';
import { ReportExport } from './components/ReportExport';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Database, 
  Wand2, 
  FileText, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Menu, 
  Smartphone, 
  Tv, 
  FolderGit2, 
  HelpCircle, 
  Plus, 
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'dataset' | 'wizard' | 'report' | 'supervisor' | 'co-pilot'>('overview');
  const [userRole, setUserRole] = useState<'student' | 'supervisor' | 'admin'>('student');
  const [viewportMode, setViewportMode] = useState<'web' | 'mobile'>('web');
  
  // Mobile Frame tabs
  const [mobileTab, setMobileTab] = useState<'dashboard' | 'dataset' | 'wizard' | 'chatbot' | 'report'>('dashboard');

  // Chatbot minimized state
  const [isChatbotMinimized, setIsChatbotMinimized] = useState<boolean>(false);

  // Notifications State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New Project Modal State
  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDiscipline, setNewDiscipline] = useState('');
  const [newAcademicLevel, setNewAcademicLevel] = useState<AcademicLevel>('MSc');
  const [newMethodology, setNewMethodology] = useState<MethodologyType>('Quantitative');

  // Load project elements
  const fetchProjects = async (selectLatestId?: string) => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (response.ok && data.length > 0) {
        setProjects(data);
        if (selectLatestId) {
          setSelectedProjectId(selectLatestId);
        } else if (!selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch {
      // fallback state
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleShowNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          discipline: newDiscipline,
          academicLevel: newAcademicLevel,
          methodology: newMethodology,
          datasetsName: `${newTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_dataset.csv`
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize project');

      await fetchProjects(data.id);
      setShowNewProjModal(false);
      setNewTitle('');
      setNewDiscipline('');
      handleShowNotification(`Constructed new ${newAcademicLevel} research dashboard.`, 'success');
    } catch (err: any) {
      handleShowNotification(err.message, 'error');
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Dynamic Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 p-3 rounded-lg flex items-center gap-2 border text-xs shadow-2xl ${
              notification.type === 'success' 
                ? 'bg-emerald-950 border-emerald-800 text-emerald-300' 
                : 'bg-rose-950 border-rose-900 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded text-white shadow-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1">
                Academic Analyzer Platform
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-indigo-400 font-mono px-1.5 py-0.5 rounded ml-1 font-normal">
                  RAG Chatbot
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">BSc, MSc, and PhD level scientific workflows</p>
            </div>
          </div>

          {/* Core Controls: Viewport, Role, Active Project selection */}
          <div className="flex items-center gap-4">
            {/* Project picker */}
            <div className="hidden sm:flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-slate-450" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none focus:border-indigo-500 font-mono"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>[{p.academicLevel}] {p.title.slice(0, 32)}...</option>
                ))}
              </select>
              <button 
                onClick={() => setShowNewProjModal(true)}
                className="p-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded transition-all flex items-center gap-1 text-[10px]"
              >
                <Plus className="w-3.5 h-3.5" />
                New Study
              </button>
            </div>

            {/* Role Manager selection */}
            <div className="hidden md:flex items-center gap-1.5 border border-slate-900 p-1 rounded bg-slate-950">
              <span className="text-[10px] text-slate-550 uppercase tracking-widest font-mono pl-1">Role:</span>
              {(['student', 'supervisor', 'admin'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => {
                    setUserRole(role);
                    handleShowNotification(`Switched role session to: ${role.toUpperCase()}`, 'success');
                  }}
                  className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded font-mono transition-all ${
                    userRole === role ? 'bg-indigo-650 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Viewport Toggler */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded">
              <button
                onClick={() => setViewportMode('web')}
                className={`p-1 rounded transition-all ${viewportMode === 'web' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Full Web App view"
              >
                <Tv className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setViewportMode('mobile');
                  handleShowNotification("Simulated mobile viewport rendered.", "success");
                }}
                className={`p-1 rounded transition-all ${viewportMode === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Mobile App view mirroring core features"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-start">
        {!activeProject ? (
          /* Initial loading placeholder */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <Clock className="w-12 h-12 animate-spin mb-4 text-indigo-500" />
            <h3 className="text-slate-300 font-medium text-sm">Initializing Academic Database...</h3>
          </div>
        ) : viewportMode === 'web' ? (
          /* WEB DASHBOARD VIEWPORT */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Side Navigation bar */}
            <div className="space-y-4">
              {/* Project Abstract Summary */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center bg-slate-950 p-1 px-2 border border-slate-850 rounded font-mono text-[10px] font-bold">
                  <span className="text-indigo-400">{activeProject.academicLevel} Dissertation</span>
                  <span className="text-slate-500">{activeProject.methodology}</span>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-100 leading-snug">{activeProject.title}</h3>
                  <p className="text-[10px] text-slate-450 italic">{activeProject.discipline}</p>
                </div>

                <div className="pt-2 border-t border-slate-850 space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono">Research Hypotheses:</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {activeProject.hypotheses.map((h, hIdx) => (
                      <div key={h.id || hIdx} className="text-[10px] text-slate-350 bg-slate-950 p-1.5 rounded border border-slate-850">
                        <span className="font-bold text-indigo-400 font-mono">H{hIdx+1}:</span> {h.statement}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Core web tabs lists */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left p-3 text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    activeTab === 'overview' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Study Overview
                </button>

                <button
                  onClick={() => setActiveTab('dataset')}
                  className={`w-full text-left p-3 text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    activeTab === 'dataset' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  Dataset & Clean Pipeline
                </button>

                <button
                  onClick={() => setActiveTab('wizard')}
                  className={`w-full text-left p-3 text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    activeTab === 'wizard' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Wand2 className="w-4 h-4" />
                  Scholarly Analysis Wizard
                </button>

                <button
                  onClick={() => setActiveTab('co-pilot')}
                  className={`w-full text-left p-3 text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    activeTab === 'co-pilot' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-violet-400 animate-pulse" />
                  Methodology AI Co-Pilot
                </button>

                <button
                  onClick={() => setActiveTab('report')}
                  className={`w-full text-left p-3 text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    activeTab === 'report' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  References & Report Export
                </button>

                <button
                  onClick={() => setActiveTab('supervisor')}
                  className={`w-full text-left p-3 text-xs font-semibold flex items-center gap-2.5 transition-all border-t border-slate-850 ${
                    activeTab === 'supervisor' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  Supervisor & Administrative Panel
                </button>
              </div>
            </div>

            {/* Display Panel */}
            <div className="lg:col-span-3 space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Introductory welcome cards */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded text-indigo-400">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-100">Welcome to your Academic Analysis Workspace</h2>
                        <p className="text-xs text-slate-400 mt-1">
                          A full-stack dissertation support assistant conforming to peer reviewer methodologies. Follow guided wizards, compute linear slopes on continuous records, compile APA report drafts, and annotate references.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-850">
                      <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Step 1</span>
                        <h4 className="text-xs font-bold text-slate-200">Ingest Database Table</h4>
                        <p className="text-[11px] text-slate-400">Upload or paste scientific CSV tables inside the Ingestion suite. Typecast categorical indices.</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Step 2</span>
                        <h4 className="text-xs font-bold text-slate-200">Run Statistical Wizards</h4>
                        <p className="text-[11px] text-slate-400">Choose OLS regression slope analysis, Welch’s comparisons, or K-Means clustering distributions.</p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Step 3</span>
                        <h4 className="text-xs font-bold text-slate-200">Compile Scholarly Reports</h4>
                        <p className="text-[11px] text-slate-400">Generate APA reference listings, check model diagnostics, and download LaTeX scripts.</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational specs details of active study */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-205">Active Research Design Specifications</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">Research Questions</span>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {activeProject.researchQuestions.map((q, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-slate-500 shrink-0 font-mono">Q{idx+1}:</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
                        <span className="text-[10px] font-mono text-violet-400 uppercase tracking-wider font-bold">Null & Alternative Hypotheses</span>
                        <div className="space-y-3 font-serif">
                          {activeProject.hypotheses.map((h, idx) => (
                            <div key={h.id || idx} className="text-xs border-b border-slate-900 pb-2.5 last:border-0 last:pb-0">
                              <div className="font-bold text-slate-200">Hypothesis Statement {idx+1}:</div>
                              <p className="italic text-slate-400 mt-1">"{h.statement}"</p>
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 mt-2">
                                <div>H0: {h.nullHypothesis}</div>
                                <div>H1: {h.alternativeHypothesis}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dataset' && (
                <DatasetClean 
                  project={activeProject}
                  onProjectUpdate={handleProjectUpdate}
                  onShowNotification={handleShowNotification}
                />
              )}

              {activeTab === 'wizard' && (
                <StatsWizards 
                  project={activeProject}
                  onShowNotification={handleShowNotification}
                />
              )}

              {activeTab === 'co-pilot' && (
                <RAGChatbot 
                  project={activeProject}
                  onShowNotification={handleShowNotification}
                />
              )}

              {activeTab === 'report' && (
                <ReportExport 
                  project={activeProject}
                  onProjectUpdate={handleProjectUpdate}
                  onShowNotification={handleShowNotification}
                />
              )}

              {activeTab === 'supervisor' && (
                <SupervisorAdmin 
                  project={activeProject}
                  onProjectUpdate={handleProjectUpdate}
                  onShowNotification={handleShowNotification}
                />
              )}
            </div>

            {/* Floating Chat Widget under web layout */}
            {activeTab !== 'co-pilot' && (
              <AnimatePresence>
                {isChatbotMinimized ? (
                  <motion.button
                    key="minimized-chat"
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setIsChatbotMinimized(false)}
                    className="fixed bottom-6 right-6 z-30 p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center gap-2 border border-indigo-500 cursor-pointer group"
                    id="chatbot-expand-trigger"
                  >
                    <div className="relative flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white animate-pulse" />
                      <span className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 bg-emerald-400 rounded-full border border-indigo-600 shadow" />
                    </div>
                    <span className="text-xs font-bold font-sans max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 pr-0 group-hover:pr-1.5 whitespace-nowrap flex items-center gap-1.5">
                      Ask Co-Pilot <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
                    </span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="maximized-chat"
                    initial={{ scale: 0.95, opacity: 0, y: 25 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 25 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-6 right-6 z-30 max-w-sm w-full hidden md:block"
                    id="chatbot-maximized-container"
                  >
                    <div className="shadow-2xl">
                      <RAGChatbot 
                        project={activeProject}
                        onShowNotification={handleShowNotification}
                        isMinimizable={true}
                        onMinimize={() => setIsChatbotMinimized(true)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        ) : (
          /* MOBILE VIEWPORT SMARTPHONE SIMULATION */
          <div className="flex justify-center p-4">
            <div className="w-[375px] h-[812px] bg-slate-950 border-[10px] border-slate-900 rounded-[40px] overflow-hidden flex flex-col justify-between shadow-2xl relative">
              {/* Speaker & notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center items-center rounded-b-xl z-50">
                <div className="w-16 h-4 bg-black rounded-full" />
              </div>

              {/* Simulated Mobile screen container */}
              <div className="flex-1 flex flex-col pt-6 overflow-hidden bg-slate-950 text-slate-100">
                {/* Mobile Tab display */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                  {mobileTab === 'dashboard' && (
                    <div className="space-y-4 pt-2">
                      <div className="p-3 bg-slate-900 border border-slate-805 rounded-xl space-y-2">
                        <span className="text-[9px] bg-indigo-900/60 font-bold px-1.5 py-0.5 rounded text-indigo-300 font-mono uppercase tracking-wider">{activeProject.academicLevel} project</span>
                        <h2 className="text-xs font-extrabold text-slate-100">{activeProject.title}</h2>
                        <p className="text-[10px] text-slate-400">{activeProject.discipline}</p>
                      </div>

                      {/* Hypotheses feed */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Active Hypotheses</span>
                        {activeProject.hypotheses.map((h, hIdx) => (
                          <div key={h.id || hIdx} className="p-2.5 bg-slate-900 border border-slate-850 rounded text-[10px]">
                            <span className="font-bold text-indigo-400">H{hIdx+1}:</span> {h.statement}
                          </div>
                        ))}
                      </div>

                      {/* Ingestion warning if empty */}
                      {!activeProject.dataset && (
                        <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-center text-slate-300 text-[11px] space-y-2">
                          <Database className="w-8 h-8 text-indigo-400 mx-auto" />
                          <p className="font-bold">Pending dataset upload</p>
                          <button
                            onClick={() => setMobileTab('dataset')}
                            className="p-1 px-3 bg-indigo-600 rounded text-[10px] font-bold text-white cursor-pointer"
                          >
                            Add Dataset
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {mobileTab === 'dataset' && (
                    <DatasetClean 
                      project={activeProject}
                      onProjectUpdate={handleProjectUpdate}
                      onShowNotification={handleShowNotification}
                    />
                  )}

                  {mobileTab === 'wizard' && (
                    <StatsWizards 
                      project={activeProject}
                      onShowNotification={handleShowNotification}
                    />
                  )}

                  {mobileTab === 'chatbot' && (
                    <RAGChatbot 
                      project={activeProject}
                      onShowNotification={handleShowNotification}
                      isMobileLayout={true}
                    />
                  )}

                  {mobileTab === 'report' && (
                    <ReportExport 
                      project={activeProject}
                      onProjectUpdate={handleProjectUpdate}
                      onShowNotification={handleShowNotification}
                    />
                  )}
                </div>

                {/* Simulated mobile footer tabs links */}
                <div className="bg-slate-900 border-t border-slate-850 p-2 grid grid-cols-5 text-center text-[9px] shrink-0 font-medium">
                  <button
                    onClick={() => setMobileTab('dashboard')}
                    className={`flex flex-col items-center gap-1 ${mobileTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-450'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Home</span>
                  </button>

                  <button
                    onClick={() => setMobileTab('dataset')}
                    className={`flex flex-col items-center gap-1 ${mobileTab === 'dataset' ? 'text-indigo-400' : 'text-slate-450'}`}
                  >
                    <Database className="w-4 h-4" />
                    <span>Data</span>
                  </button>

                  <button
                    onClick={() => setMobileTab('wizard')}
                    className={`flex flex-col items-center gap-1 ${mobileTab === 'wizard' ? 'text-indigo-400' : 'text-slate-450'}`}
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Stats</span>
                  </button>

                  <button
                    onClick={() => setMobileTab('chatbot')}
                    className={`flex flex-col items-center gap-1 ${mobileTab === 'chatbot' ? 'text-violet-400 animate-pulse font-bold' : 'text-slate-450'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>CoPilot</span>
                  </button>

                  <button
                    onClick={() => setMobileTab('report')}
                    className={`flex flex-col items-center gap-1 ${mobileTab === 'report' ? 'text-indigo-400' : 'text-slate-450'}`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Output</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProjModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Initialize New Academic Study
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-450 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Socio-Economic Predictors of Stress Scores"
                  className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-450 mb-1">Discipline / Subject Field</label>
                <input
                  type="text"
                  value={newDiscipline}
                  onChange={(e) => setNewDiscipline(e.target.value)}
                  placeholder="e.g. Clinical Pharmacology"
                  className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-450 mb-1">Academic Level</label>
                  <select
                    value={newAcademicLevel}
                    onChange={(e) => setNewAcademicLevel(e.target.value as AcademicLevel)}
                    className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-205 focus:outline-none"
                  >
                    <option value="BSc">Bachelor's (BSc)</option>
                    <option value="MSc">Master's (MSc)</option>
                    <option value="PhD">Doctorate (PhD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-455 mb-1">Methodology</label>
                  <select
                    value={newMethodology}
                    onChange={(e) => setNewMethodology(e.target.value as MethodologyType)}
                    className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-205 focus:outline-none"
                  >
                    <option value="Quantitative">Quantitative</option>
                    <option value="Qualitative">Qualitative</option>
                    <option value="Mixed-Methods">Mixed-Methods</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="flex-1 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 text-xs rounded transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs rounded transition-all cursor-pointer"
                >
                  Create Project Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer credits line */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 p-4 text-center text-[10px] text-slate-550 select-none">
        Academic Data Analysis Platform • Integrated RAG Co-Pilot Assistance. Compliant with university credit integrity laws.
      </footer>
    </div>
  );
}
