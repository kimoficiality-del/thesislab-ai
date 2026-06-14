/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  CornerDownRight, 
  Code, 
  Terminal, 
  HelpCircle,
  FileText,
  AlertCircle,
  Sparkles,
  Link,
  Minus
} from 'lucide-react';
import { Project, ChatMessage } from '../types';

interface RAGChatbotProps {
  project: Project;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  isMobileLayout?: boolean;
  isMinimizable?: boolean;
  onMinimize?: () => void;
}

export const RAGChatbot: React.FC<RAGChatbotProps> = ({
  project,
  onShowNotification,
  isMobileLayout = false,
  isMinimizable = false,
  onMinimize
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your Scholarly Methods & Statistical Assistant. 

I am set up to supply methodological guidance for your active **${project.academicLevel}** project: *"${project.title}"*. 

I can:
1. Explain statistical tests and their required mathematical assumptions (Normality, Homoscedasticity, Multicollinearity).
2. Recommend appropriate analytical pipelines based on your variable types.
3. Suggest Python or R script snippets.
4. Critique draft methodology paragraphs to meet academic peer standards.

*Ethical constraint: I cannot write standard thesis, dissertations, or full results chapters for you. Let's design them together!*`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: inputText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          projectContext: project
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server lost track');

      setMessages(prev => [...prev, data]);
    } catch (err: any) {
      onShowNotification(err.message, 'error');
      // Append a helpful offline fallback on error list
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `Sorry! It seems the communication route experienced a hiccup, but I can guide you based on our offline primers:
        
- **Welch t-test**: Select when comparing exactly 2 group levels on a continuous score outcome.
- **VIF Multi-collinearity**: Ensure metrics stay below 5 to prevent model inflating.
- **Ethical Writing**: Remember to describe the test, degrees of freedom, and exact coefficients. Avoid fabricating findings!`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const loadPresetQuery = (pQuery: string) => {
    setInputText(pQuery);
    onShowNotification(`Query loaded: "${pQuery}"`, 'success');
  };

  // Split chatbot UI into either floating widget or dedicated full component
  return (
    <div className={`flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${
      isMobileLayout ? 'h-[630px]' : 'h-[500px]'
    }`}>
      {/* Upper header */}
      <div className="bg-slate-950 p-4 border-b border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-900/50 rounded text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1">
              Methodology Co-Pilot
              <Sparkles className="w-3 h-3 text-indigo-400" />
            </h3>
            <p className="text-[10px] text-slate-400">Active guidance for {project.academicLevel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono border border-emerald-900">
            RAG Online
          </span>
          {isMinimizable && onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              className="p-1 text-slate-405 hover:bg-slate-850 text-slate-400 hover:text-white rounded transition-all cursor-pointer flex items-center justify-center border border-slate-800"
              title="Minimize Chat"
              id="chatbot-minimize-btn"
            >
              <Minus className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Messages scrollarea */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-950/20">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 text-xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-indigo-950 flex items-center justify-center shrink-0 border border-indigo-900">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            )}
            
            <div className={`space-y-2 p-3.5 rounded-xl max-w-[85%] leading-relaxed ${
              m.role === 'user' 
                ? 'bg-indigo-650 text-white rounded-tr-none' 
                : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-line">{m.text}</div>

              {/* Code Snippet attachment if model returns code */}
              {m.codeSnippet && (
                <div className="mt-2 border border-slate-800 rounded overflow-hidden">
                  <div className="p-1 px-2.5 bg-slate-950 text-[9px] font-mono text-indigo-400 flex items-center justify-between">
                    <span className="capitalize">{m.codeSnippet.language} Code Recipe</span>
                    <Terminal className="w-3 h-3" />
                  </div>
                  <pre className="p-3 bg-slate-975 text-[10px] text-green-305 font-mono overflow-x-auto selection:bg-indigo-500">
                    {m.codeSnippet.code}
                  </pre>
                </div>
              )}

              {/* Citations references */}
              {m.citations && m.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-850 text-[9px] text-slate-400">
                  <span className="font-bold flex items-center gap-1">
                    <Link className="w-2.5 h-2.5 text-indigo-400" />
                    Cited Knowledge Base:
                  </span>
                  {m.citations.map(c => (
                    <span key={c} className="underline decoration-indigo-500/50 hover:text-indigo-300 cursor-help">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-850 flex items-center justify-center shrink-0 border border-slate-800">
                <User className="w-3.5 h-3.5 text-slate-450" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center animate-bounce">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 italic">
              Searching literature indices and checking model metrics...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Prompts Help */}
      {messages.length === 1 && (
        <div className="p-3 px-4 bg-slate-950 border-t border-slate-850 space-y-1.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Suggested Co-Pilot queries:
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <button
              onClick={() => loadPresetQuery("Recommend a test if my independent is categorical with 3 groups and dependent is numerical.")}
              className="p-1 px-2.5 rounded bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 transition-all text-left"
            >
              Which test fits 3 groups?
            </button>
            <button
              onClick={() => loadPresetQuery("Explain the assumption test of homoscedasticity in linear regression.")}
              className="p-1 px-2.5 rounded bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 transition-all text-left"
            >
              Explain Homoscedasticity.
            </button>
            <button
              onClick={() => loadPresetQuery("How do I write a results paragraph for a t-test in APA style?")}
              className="p-1 px-2.5 rounded bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 transition-all text-left"
            >
              APA t-test template format.
            </button>
          </div>
        </div>
      )}

      {/* Input panel Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-850 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about studies, models, or APA formats..."
          className="flex-1 p-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-all cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
