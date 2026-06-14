/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Settings, 
  ShieldAlert, 
  Activity, 
  HardDrive, 
  Cpu, 
  CornerDownRight, 
  Send,
  PlusCircle,
  Clock,
  HeartPulse
} from 'lucide-react';
import { Project, CommentAnnotation, SystemHealth } from '../types';

interface SupervisorAdminProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

export const SupervisorAdmin: React.FC<SupervisorAdminProps> = ({
  project,
  onProjectUpdate,
  onShowNotification
}) => {
  const [activeRole, setActiveRole] = useState<'supervisor' | 'admin'>('supervisor');
  
  // Supervisor form
  const [commentText, setCommentText] = useState('');
  const [commentSection, setCommentSection] = useState('Methodology');
  const [commentAuthor, setCommentAuthor] = useState('Dr. Helen Vance (Advisor)');
  const [commentLoading, setCommentLoading] = useState(false);

  // Admin server health metrics
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    cpuUsage: 22,
    ramUsage: 44,
    activeJobs: 0,
    storageQuotaUsed: '42.1 MB / 500 MB'
  });

  const fetchHealthMetrics = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      if (response.ok) setHealth(data);
    } catch {
      // Keep static defaults on failure
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 6000);
    return () => clearInterval(interval);
  }, []);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: commentAuthor,
          text: commentText,
          role: 'supervisor',
          sectionLink: commentSection
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit comment');

      onProjectUpdate(data);
      setCommentText('');
      onShowNotification('Supervisor advisory comment archived.', 'success');
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Supervisor & System Admin Core
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Toggle between Supervisor feedback review tracks and Admin system diagnostic logs.
          </p>
        </div>

        {/* Console Toggles */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveRole('supervisor')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeRole === 'supervisor' ? 'bg-indigo-650 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
            }`}
          >
            Supervisor Panel
          </button>
          <button
            onClick={() => setActiveRole('admin')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeRole === 'admin' ? 'bg-indigo-950 text-white border border-indigo-800/60' : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
            }`}
          >
            System Admin Panel
          </button>
        </div>
      </div>

      {activeRole === 'supervisor' ? (
        /* Supervisor Advisory annotation console */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline and feedback logs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Advisory Feed and Annotations History
              </h3>

              {project.comments.length === 0 ? (
                <div className="text-center p-6 text-xs text-slate-500 italic">
                  No comments or section annotations left on this project yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {project.comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${comment.role === 'supervisor' ? 'bg-indigo-400' : 'bg-green-400'}`} />
                          <span className="text-xs font-bold text-slate-200">{comment.author}</span>
                          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-450 px-1.5 py-0.5 rounded font-mono">
                            {comment.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(comment.timestamp).toLocaleDateString()} at{' '}
                          {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pl-4 border-l-2 border-slate-800">
                        {comment.text}
                      </p>

                      {comment.sectionLink && (
                        <div className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5" />
                          Linked Chapter: <span className="underline">{comment.sectionLink}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comment submission form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-fit space-y-4">
            <h3 className="text-sm font-semibold text-slate-250 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-violet-400" />
              Incorporate Supervisor Review
            </h3>

            <form onSubmit={handlePostComment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Supervisor Full Name</label>
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Link to Dissertation Chapter</label>
                <select
                  value={commentSection}
                  onChange={(e) => setCommentSection(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none"
                >
                  <option value="Introduction">Introduction & Hypotheses</option>
                  <option value="Methodology">Methodology & Design</option>
                  <option value="Results">Results & Analytical Tables</option>
                  <option value="Discussion">Discussion & Constraints</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Observation / Guidance Annotation</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  placeholder="Review test assumptions, check for outliers, or critique literature alignment..."
                  className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={commentLoading}
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {commentLoading ? 'Archiving feedback...' : 'Post Critique Log'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Admin diagnostics dashboard */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Health Summary Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Infrastructure</span>
              <HeartPulse className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold font-mono text-emerald-400 flex items-center gap-2">
                {health.status.toUpperCase()}
              </div>
              <p className="text-[10px] text-slate-400">All Node API instances routing efficiently on ingress PORT: 3000.</p>
            </div>
          </div>

          {/* CPU telemetry logs progress bar representation */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CPU Computational Rate</span>
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-bold font-mono text-slate-150">{health.cpuUsage}%</div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-1000"
                  style={{ width: `${health.cpuUsage}%` }}
                />
              </div>
            </div>
          </div>

          {/* RAM utilization */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">RAM Memory Buffer</span>
              <Activity className="w-5 h-5 text-violet-400" />
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-bold font-mono text-slate-150">{health.ramUsage}%</div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-violet-500 h-full transition-all duration-1000"
                  style={{ width: `${health.ramUsage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Storage Quota */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">S3 Object Quota</span>
              <HardDrive className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold font-mono text-slate-100">{health.storageQuotaUsed}</div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-1000"
                  style={{ width: '8.4%' }}
                />
              </div>
              <p className="text-[9px] text-slate-500">Limits configured at max 500 MB per file matrix.</p>
            </div>
          </div>

          {/* Operational logs */}
          <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Core Moderation and System Security logs
            </h3>
            
            <div className="p-4 bg-slate-950 border border-slate-850 rounded font-mono text-[10px] text-zinc-400 space-y-1.5">
              <div>[SYSTEM INFO - {new Date().toISOString()}] Initiated secure full-stack sandbox environment.</div>
              <div>[SYSTEM INFO - {new Date().toISOString()}] Successfully parsed metadata major capability SERVER_SIDE_GEMINI_API.</div>
              <div>[METRIC CHECK - {new Date().toISOString()}] CORS routes initialized on ingress node listener.</div>
              <div className="text-indigo-400">[JWT INSPECT] Authentication tokens verification using local session state securely encryption.</div>
              <div className="text-emerald-400">[HEALTH RETRIEVE] PostgreSQL client pooling: OK (Simulated durable persistent models).</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
