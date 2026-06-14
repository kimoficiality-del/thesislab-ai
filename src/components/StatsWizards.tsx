/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wand2, 
  BarChart4, 
  Plus, 
  Play, 
  Code, 
  BookOpen, 
  Binary, 
  LineChart, 
  Terminal,
  HelpCircle,
  TrendingUp,
  Cpu,
  Layers,
  PieChart
} from 'lucide-react';
import { Project } from '../types';

interface StatsWizardsProps {
  project: Project;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

// Math generator helper for clean SVG Pie slices representation
const cleanPieSlices = (data: { label: string; value: number }[]) => {
  const total = data.reduce((sum, item) => sum + Math.abs(item.value), 0);
  if (total === 0) return [];

  let accumulatedPercent = 0;
  return data.map((item, idx) => {
    const percent = Math.abs(item.value) / total;
    const startPercent = accumulatedPercent;
    accumulatedPercent += percent;

    const radius = 70;
    const centerX = 100;
    const centerY = 100;

    const angleStart = startPercent * 2 * Math.PI - Math.PI / 2;
    const angleEnd = accumulatedPercent * 2 * Math.PI - Math.PI / 2;

    const x1 = centerX + radius * Math.cos(angleStart);
    const y1 = centerY + radius * Math.sin(angleStart);
    const x2 = centerX + radius * Math.cos(angleEnd);
    const y2 = centerY + radius * Math.sin(angleEnd);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    let pathData = '';
    if (percent >= 0.999) {
      pathData = `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX - 0.01} ${centerY - radius} Z`;
    } else {
      pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }

    return {
      ...item,
      percent,
      pathData,
      color: [`#6366f1`, `#10b981`, `#f59e0b`, `#ec4899`, `#14b8a6`, `#8b5cf6`][idx % 6]
    };
  });
};

export const StatsWizards: React.FC<StatsWizardsProps> = ({
  project,
  onShowNotification
}) => {
  const [activeTab, setActiveTab] = useState<'descriptive' | 't-test' | 'regression' | 'kmeans' | 'cronbach' | 'charts'>('descriptive');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Form selections state
  const [numericCol, setNumericCol] = useState('');
  const [numericY, setNumericY] = useState('');
  const [categoricalCol, setCategoricalCol] = useState('');
  const [predictors, setPredictors] = useState<string[]>([]);
  const [kClusters, setKClusters] = useState(3);
  const [codeType, setCodeType] = useState<'python' | 'r'>('python');

  // Interactive Chart Workbench States
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'graph'>('bar');
  const [chartXCol, setChartXCol] = useState('');
  const [chartYCol, setChartYCol] = useState('');
  const [chartAggregate, setChartAggregate] = useState<'mean' | 'sum' | 'count' | 'none'>('mean');

  const dataset = project.dataset;
  const allHeaders = dataset?.headers || [];
  const numericHeaders = dataset?.variables?.filter(v => v.type === 'numeric').map(v => v.name) || [];
  const categoricalHeaders = dataset?.variables?.filter(v => v.type === 'categorical').map(v => v.name) || [];

  const runAnalysis = async () => {
    if (!dataset) {
      onShowNotification('Include a valid student dataset before continuing.', 'error');
      return;
    }
    setLoading(true);

    let payload: any = { type: activeTab };
    if (activeTab === 'descriptive') {
      if (!numericCol) {
        onShowNotification('Choose a numerical variable.', 'error');
        setLoading(false);
        return;
      }
      payload.numericX = numericCol;
    } else if (activeTab === 't-test') {
      if (!numericCol || !categoricalCol) {
        onShowNotification('Select both numerical and comparative categorical columns.', 'error');
        setLoading(false);
        return;
      }
      payload.numericX = numericCol;
      payload.categoricalCol = categoricalCol;
    } else if (activeTab === 'regression') {
      if (!numericY || predictors.length === 0) {
        onShowNotification('Select a target metric and at least one predictor.', 'error');
        setLoading(false);
        return;
      }
      payload.numericY = numericY;
      payload.predictorCols = predictors;
    } else if (activeTab === 'kmeans') {
      if (!numericCol || !numericY) {
        onShowNotification('Select two continuous columns to align clusters.', 'error');
        setLoading(false);
        return;
      }
      payload.numericX = numericCol;
      payload.numericY = numericY;
      payload.clusters = kClusters;
    } else if (activeTab === 'cronbach') {
      if (predictors.length < 2) {
        onShowNotification('Select at least 2 Likert numerical scale items.', 'error');
        setLoading(false);
        return;
      }
      payload.predictorCols = predictors;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Computation failed');

      setAnalysisResult(data);
      onShowNotification(`${activeTab.toUpperCase()} computation compiled successfully.`, 'success');
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictorToggle = (col: string) => {
    if (predictors.includes(col)) {
      setPredictors(predictors.filter(p => p !== col));
    } else {
      setPredictors([...predictors, col]);
    }
  };

  // Python and R code templates generator matching active test parameters
  const getCodeSnippet = (lang: 'python' | 'r') => {
    if (activeTab === 'descriptive') {
      return lang === 'python'
        ? `import pandas as pd\n\n# Load active student dataset\ndf = pd.read_csv("${dataset?.name || 'project_dataset.csv'}")\n\n# Calculate descriptive matrices\nstats = df['${numericCol || 'Variable'}'].describe()\nprint(stats)\n\n# Calculate IQR specifically\niqr = df['${numericCol || 'Variable'}'].quantile(0.75) - df['${numericCol || 'Variable'}'].quantile(0.25)\nprint(f"Interquartile Range: {iqr}")`
        : `library(dplyr)\n\n# Read academic dataset\ndata <- read.csv("${dataset?.name || 'project_dataset.csv'}")\n\n# Inquire descriptive metadata\nsummary(data$${numericCol || 'Variable'})\nsd(data$${numericCol || 'Variable'}, na.rm = TRUE)\nIQR(data$${numericCol || 'Variable'}, na.rm = TRUE)`;
    }
    if (activeTab === 't-test') {
      return lang === 'python'
        ? `import pandas as pd\nfrom scipy import stats\n\ndf = pd.read_csv("${dataset?.name || 'project_dataset.csv'}")\n\n# Extract categories\ngrp_a = df[df['${categoricalCol || 'Group'}'] == df['${categoricalCol || 'Group'}'].unique()[0]]['${numericCol || 'Score'}']\ngrp_b = df[df['${categoricalCol || 'Group'}'] == df['${categoricalCol || 'Group'}'].unique()[1]]['${numericCol || 'Score'}']\n\n# Run Welch's t-test (unequal variances)\nt_stat, p_val = stats.ttest_ind(grp_a, grp_b, equal_var=False)\nprint(f"Welch t-stat: {t_stat}, p-value: {p_val}")`
        : `data <- read.csv("${dataset?.name || 'project_dataset.csv'}")\n\n# Run standard independent Welch t-test\nt.test(${numericCol || 'Score'} ~ ${categoricalCol || 'Group'}, data = data, var.equal = FALSE)`;
    }
    if (activeTab === 'regression') {
      const predStrPy = predictors.map(p => `'${p}'`).join(', ');
      const predStrR = predictors.join(' + ');
      return lang === 'python'
        ? `import pandas as pd\nimport statsmodels.api as sm\n\ndf = pd.read_csv("${dataset?.name || 'project_dataset.csv'}")\n\n# Define predictors and target variable\nX = df[[${predStrPy || "'Predictor'"}]]\nX = sm.add_constant(X)\ny = df['${numericY || 'Target'}']\n\n# Fit Ordinary Least Squares\nmodel = sm.OLS(y, X).fit()\nprint(model.summary())`
        : `data <- read.csv("${dataset?.name || 'project_dataset.csv'}")\n\n# Fit standard Ordinary Least Squares\nmodel <- lm(${numericY || 'Target'} ~ ${predStrR || 'Predictor'}, data = data)\nsummary(model)`;
    }
    if (activeTab === 'kmeans') {
      return lang === 'python'
        ? `import pandas as pd\nfrom sklearn.cluster import KMeans\n\ndf = pd.read_csv("${dataset?.name || 'project_dataset.csv'}")\nX = df[['${numericCol || 'FeatureX'}', '${numericY || 'FeatureY'}']]\n\nkmeans = KMeans(n_clusters=${kClusters}, random_state=42).fit(X)\ndf['Cluster'] = kmeans.labels_`
        : `data <- read.csv("${dataset?.name || 'project_dataset.csv'}")\n\n# Run K-Means cluster analysis\ncl <- kmeans(data[, c("${numericCol || 'FeatureX'}", "${numericY || 'FeatureY'}")], centers = ${kClusters})\ndata$Cluster <- cl$cluster`;
    }
    return '';
  };

  const getChartData = () => {
    if (!dataset || !dataset.rows || dataset.rows.length === 0) return [];
    
    const rows = dataset.rows;

    // Case 1: No aggregation (none) or blank column - plot raw row pairs
    if (chartAggregate === 'none' || !chartXCol) {
      const activeX = chartXCol || (dataset.headers && dataset.headers[0]) || '';
      const activeY = chartYCol || (numericHeaders && numericHeaders[0]) || '';
      
      return rows.map((row, idx) => {
        const label = String(row[activeX] ?? `Row ${idx + 1}`);
        const rawVal = row[activeY];
        const value = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal ?? '0')) || 0;
        return {
          label: label.length > 25 ? `${label.substring(0, 22)}...` : label,
          value: Number(value.toFixed(2))
        };
      }).slice(0, 30); // Limit to 30 for readability
    }

    // Case 2: Aggregate by category/column
    const groups: Record<string, { sum: number; count: number }> = {};
    rows.forEach(row => {
      const key = String(row[chartXCol] ?? 'Missing/NA').trim() || 'Missing/NA';
      const activeY = chartYCol || (numericHeaders && numericHeaders[0]) || '';
      const rawVal = row[activeY];
      const val = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal ?? '0')) || 0;

      if (!groups[key]) {
        groups[key] = { sum: 0, count: 0 };
      }
      groups[key].sum += val;
      groups[key].count += 1;
    });

    return Object.entries(groups).map(([key, info]) => {
      let value = 0;
      if (chartAggregate === 'mean') {
        value = info.count > 0 ? info.sum / info.count : 0;
      } else if (chartAggregate === 'sum') {
        value = info.sum;
      } else if (chartAggregate === 'count') {
        value = info.count;
      }
      return {
        label: key,
        value: Number(value.toFixed(2))
      };
    });
  };

  const handleJumpToCharts = () => {
    if (!dataset) return;
    
    // Fallbacks
    const fallbackX = dataset.headers[0] || '';
    const fallbackY = numericHeaders[0] || '';

    if (activeTab === 'descriptive') {
      setChartType('bar');
      setChartXCol(numericCol || fallbackX);
      setChartYCol(numericCol || fallbackY);
      setChartAggregate('none');
    } else if (activeTab === 't-test') {
      setChartType('bar');
      setChartXCol(categoricalCol || fallbackX);
      setChartYCol(numericCol || fallbackY);
      setChartAggregate('mean');
    } else if (activeTab === 'regression') {
      setChartType('graph');
      setChartXCol(predictors[0] || fallbackX);
      setChartYCol(numericY || fallbackY);
      setChartAggregate('none');
    } else if (activeTab === 'kmeans') {
      setChartType('graph');
      setChartXCol(numericCol || fallbackX);
      setChartYCol(numericY || fallbackY);
      setChartAggregate('none');
    } else {
      setChartType('bar');
      setChartXCol(fallbackX);
      setChartYCol(fallbackY);
      setChartAggregate('mean');
    }
    
    // Auto-fill states if they are empty
    setTimeout(() => {
      if (!chartXCol && dataset.headers.length > 0) {
        setChartXCol(fallbackX);
      }
      if (!chartYCol && numericHeaders.length > 0) {
        setChartYCol(fallbackY);
      }
    }, 50);

    setActiveTab('charts');
    onShowNotification('Successfully exported active analytical variables to Chart Creator Workbench!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-400" />
            Scholarly Guided Analysis Wizard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose a methodology-compliant tool to calculate coefficients, view interactive vector diagnostic plots, and inspect generated code.
          </p>
        </div>
      </div>

      {!dataset ? (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400">
          <Wand2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <h3 className="text-slate-300 font-medium text-sm">Spreadsheet context required</h3>
          <p className="text-xs text-slate-500 mt-1">
            Please import or template a dataset inside the **Dataset & Clean** tab first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Navigation vertical list */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 p-1 flex items-center gap-1.5">
              <Binary className="w-3.5 h-3.5 text-indigo-400" />
              Test Categories
            </div>
            
            <button
              onClick={() => { setActiveTab('descriptive'); setAnalysisResult(null); }}
              className={`w-full text-left p-3 rounded text-xs font-medium transition-all flex items-center justify-between ${
                activeTab === 'descriptive' ? 'bg-indigo-650 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart4 className="w-4 h-4" />
                Descriptive Summaries
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('t-test'); setAnalysisResult(null); }}
              className={`w-full text-left p-3 rounded text-xs font-medium transition-all flex items-center justify-between ${
                activeTab === 't-test' ? 'bg-indigo-650 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Welch t-Test (2 groups)
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('regression'); setAnalysisResult(null); }}
              className={`w-full text-left p-3 rounded text-xs font-medium transition-all flex items-center justify-between ${
                activeTab === 'regression' ? 'bg-indigo-650 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <LineChart className="w-4 h-4" />
                Ordinary Least Squares (OLS)
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('kmeans'); setAnalysisResult(null); }}
              className={`w-full text-left p-3 rounded text-xs font-medium transition-all flex items-center justify-between ${
                activeTab === 'kmeans' ? 'bg-indigo-650 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                K-Means Centroids Clustering
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('cronbach'); setAnalysisResult(null); }}
              className={`w-full text-left p-3 rounded text-xs font-medium transition-all flex items-center justify-between ${
                activeTab === 'cronbach' ? 'bg-indigo-650 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Cronbach Alpha Reliability
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('charts');
                setAnalysisResult(null);
                if (!chartXCol && dataset?.headers && dataset.headers[0]) {
                  setChartXCol(dataset.headers[0]);
                }
                if (!chartYCol && numericHeaders && numericHeaders[0]) {
                  setChartYCol(numericHeaders[0]);
                }
              }}
              className={`w-full text-left p-3 rounded text-xs font-medium transition-all flex items-center justify-between ${
                activeTab === 'charts' ? 'bg-indigo-650 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'
              }`}
              id="charts-tab-locator"
            >
              <span className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-450" />
                <span>Interactive Chart Workbench</span>
              </span>
              <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-900">
                Plot Graph
              </span>
            </button>
          </div>

          {/* Setup controls & Results plots */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 capitalize flex items-center gap-2">
                Configure {activeTab === 'kmeans' ? 'K-Means Clustering' : activeTab === 'cronbach' ? 'Survey scale check' : activeTab === 'charts' ? 'Interactive Plot Workbench' : activeTab + ' testing'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dynamic Configuration fields relying on activeTab */}
                {activeTab === 'descriptive' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Select Numeric Column</label>
                    <select
                      value={numericCol}
                      onChange={(e) => setNumericCol(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Column --</option>
                      {numericHeaders.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === 't-test' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Select Dependent Metric (Continuous)</label>
                      <select
                        value={numericCol}
                        onChange={(e) => setNumericCol(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="">-- Choose Column --</option>
                        {numericHeaders.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Select Categorical Key (2 groups)</label>
                      <select
                        value={categoricalCol}
                        onChange={(e) => setCategoricalCol(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="">-- Choose Column --</option>
                        {categoricalHeaders.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'regression' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Select Target variable Y (Dependent)</label>
                      <select
                        value={numericY}
                        onChange={(e) => setNumericY(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="">-- Choose Column --</option>
                        {numericHeaders.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Select Predictors X (Multiple allowed)</label>
                      <div className="space-y-1 bg-slate-955 p-3 border border-slate-850 rounded max-h-32 overflow-y-auto">
                        {numericHeaders.filter(h => h !== numericY).map(h => (
                          <label key={h} className="flex items-center gap-2 text-xs font-mono text-slate-350 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={predictors.includes(h)}
                              onChange={() => handlePredictorToggle(h)}
                              className="rounded border-slate-800 bg-slate-950 text-indigo-650"
                            />
                            {h}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'kmeans' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Plot Coordinate Axis X (Numeric)</label>
                      <select
                        value={numericCol}
                        onChange={(e) => setNumericCol(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="">-- Choose Axis X --</option>
                        {numericHeaders.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Plot Coordinate Axis Y (Numeric)</label>
                      <select
                        value={numericY}
                        onChange={(e) => setNumericY(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="">-- Choose Axis Y --</option>
                        {numericHeaders.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Desired Clustered Centroids (K)</label>
                      <input
                        type="number"
                        min="2"
                        max="5"
                        value={kClusters}
                        onChange={(e) => setKClusters(Number(e.target.value))}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'cronbach' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Select Likert Scale Variables (Choose 2+)</label>
                    <div className="space-y-1 bg-slate-955 p-3 border border-slate-850 rounded max-h-40 overflow-y-auto">
                      {numericHeaders.map(h => (
                        <label key={h} className="flex items-center gap-2 text-xs font-mono text-slate-350 select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={predictors.includes(h)}
                            onChange={() => handlePredictorToggle(h)}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-650"
                          />
                          {h}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'charts' && (
                  <>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Select Graph Form Factor (Includes Pie / PII option)</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setChartType('bar')}
                          className={`py-2 px-3 rounded flex items-center justify-center gap-1.5 text-xs font-sans font-medium transition-all cursor-pointer ${
                            chartType === 'bar' ? 'bg-indigo-600 text-white border border-indigo-500' : 'bg-slate-950 text-slate-300 border border-slate-850 hover:bg-slate-900'
                          }`}
                        >
                          <BarChart4 className="w-4 h-4 text-indigo-400" />
                          Bar Chart
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartType('pie')}
                          className={`py-2 px-3 rounded flex items-center justify-center gap-1.5 text-xs font-sans font-medium transition-all cursor-pointer ${
                            chartType === 'pie' ? 'bg-emerald-600 text-white border border-emerald-500' : 'bg-slate-950 text-slate-300 border border-slate-850 hover:bg-slate-900'
                          }`}
                        >
                          <PieChart className="w-4 h-4 text-emerald-400" />
                          Pie Chart (PII)
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartType('graph')}
                          className={`py-2 px-3 rounded flex items-center justify-center gap-1.5 text-xs font-sans font-medium transition-all cursor-pointer ${
                            chartType === 'graph' ? 'bg-amber-600 text-white border border-amber-500' : 'bg-slate-950 text-slate-300 border border-slate-850 hover:bg-slate-900'
                          }`}
                        >
                          <LineChart className="w-4 h-4 text-amber-450" />
                          Trend Graph
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">X-Axis Column (Factor Grouping / Segment Labels)</label>
                      <select
                        value={chartXCol}
                        onChange={(e) => setChartXCol(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="">-- Choose Grouping Column --</option>
                        {allHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Y-Axis Column (Continuous Numeric Metric)</label>
                      <select
                        value={chartYCol}
                        onChange={(e) => setChartYCol(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono font-sans"
                      >
                        <option value="">-- Choose Values Column --</option>
                        {numericHeaders.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Statistical Aggregator</label>
                      <select
                        value={chartAggregate}
                        onChange={(e) => setChartAggregate(e.target.value as any)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-250 focus:outline-none focus:border-indigo-500 font-sans"
                      >
                        <option value="mean">Group Arithmetic Mean Average</option>
                        <option value="sum">Sum Cumulative Total of Group</option>
                        <option value="count">Frequency Count (Percentage Breakdown)</option>
                        <option value="none">No aggregate (Scatter raw rows - capped at 30 records)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {activeTab !== 'charts' ? (
                <button
                  onClick={runAnalysis}
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? 'Evaluating vectors and matrices...' : 'Run Statistical Calculation'}
                  <Play className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="text-[10px] text-slate-400 font-sans leading-relaxed text-center italic bg-slate-950 p-2.5 rounded border border-slate-850">
                  ⚡ Charts and legends re-compile dynamically as you adjust vectors above. No API requests queued!
                </div>
              )}
            </div>

            {/* Interactive Charts Workbench Output */}
            {activeTab === 'charts' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                {/* 1. Category and Population Legend (1 col) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between" id="chart-workbench-legend">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Plot Taxonomy
                      </h4>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono border border-emerald-900 uppercase font-semibold">
                        {chartType}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-sans text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase tracking-wider">X grouping factor</span>
                        <span className="font-mono text-slate-200 font-semibold">{chartXCol || '(Please choose x-axis)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Y metric value</span>
                        <span className="font-mono text-slate-200 font-semibold">{chartYCol || '(Please choose y-axis)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Aggregation logic</span>
                        <span className="text-indigo-400 font-semibold">
                          {chartAggregate === 'mean' ? 'Arithmetic Mean' :
                           chartAggregate === 'sum' ? 'Sum Cumulative Total' :
                           chartAggregate === 'count' ? 'Case Frequencies' : 'Unaggregated rows'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 space-y-2">
                       <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Active Series Population</span>
                       <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                         {getChartData().map((d, i) => {
                           const colors = [`#6366f1`, `#10b981`, `#f59e0b`, `#ec4899`, `#14b8a6`, `#8b5cf6`];
                           return (
                             <div key={i} className="flex items-center justify-between text-[11px] font-mono border-b border-slate-850 pb-1 last:border-0">
                               <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                                 <span 
                                   className="w-2 h-2 rounded-full flex-shrink-0" 
                                   style={{ backgroundColor: colors[i % colors.length] }} 
                                 />
                                 <span className="text-slate-350 truncate" title={d.label}>{d.label}</span>
                               </div>
                               <span className="text-slate-100 font-bold ml-1">{d.value}</span>
                             </div>
                           );
                         })}
                         {getChartData().length === 0 && (
                           <span className="text-[10px] text-slate-500 block italic">Configure chart axes to populate legends.</span>
                         )}
                       </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 border border-slate-850 rounded text-[10px] text-slate-400 font-sans leading-relaxed mt-4">
                    📚 <strong className="text-slate-300">Scholarly Standard:</strong> Visual graphics are structured recursively to ensure clean layout scaling under PDF citation rendering environments.
                  </div>
                </div>

                {/* 2. Visual rendering canvas (2 cols) */}
                <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between" id="chart-workbench-vector">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      High-Precision Diagnostic Plot Vector
                    </h4>
                    <span className="text-[9px] text-indigo-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                      Dynamic Vector Graphics
                    </span>
                  </div>

                  <div className="h-80 w-full flex items-center justify-center bg-slate-950 border border-slate-850 rounded p-4 relative overflow-hidden">
                    {getChartData().length === 0 ? (
                      <div className="text-center text-slate-500 text-xs">
                        <BarChart4 className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-bounce" />
                        Please choose X and Y dimensions above to construct visual vectors.
                      </div>
                    ) : (
                      <>
                        {/* 2.1 BAR CHART */}
                        {chartType === 'bar' && (
                          (() => {
                            const data = getChartData();
                            const maxVal = Math.max(...data.map(d => d.value), 0.001);
                            const heightScale = 180 / maxVal;
                            
                            return (
                              <svg viewBox="0 0 340 220" className="w-full h-full text-indigo-400">
                                {/* Grid Lines */}
                                <line x1="35" y1="180" x2="320" y2="180" stroke="#1e293b" strokeWidth="2" />
                                <line x1="35" y1="20" x2="35" y2="180" stroke="#1e293b" strokeWidth="2" />
                                
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const y = 20 + idx * 40;
                                  const labelVal = maxVal - (maxVal / 4) * idx;
                                  return (
                                    <g key={idx}>
                                      <line x1="35" y1={y} x2="320" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                                      <text x="5" y={y + 3} fill="#475569" fontSize="8" fontFamily="monospace">
                                        {labelVal.toFixed(0)}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Bars */}
                                {data.map((d, i) => {
                                  const numBars = data.length;
                                  const width = Math.min(45, Math.max(8, 230 / numBars));
                                  const gap = Math.min(18, Math.max(4, (230 - width * numBars) / (numBars + 1)));
                                  const x = 35 + gap + i * (width + gap);
                                  const barHeight = d.value * heightScale;
                                  const y = 180 - barHeight;
                                  const colors = [`#6366f1`, `#10b981`, `#f59e0b`, `#ec4899`, `#14b8a6`, `#8b5cf6`];
                                  
                                  return (
                                    <g key={i} className="group">
                                      <rect 
                                        x={x} 
                                        y={Math.min(178, y)} 
                                        width={width} 
                                        height={Math.max(2, barHeight)} 
                                        fill={colors[i % colors.length]} 
                                        fillOpacity="0.8" 
                                        rx="1.5"
                                        className="transition-all hover:fill-opacity-100 cursor-pointer" 
                                      >
                                        <title>{d.label}: {d.value}</title>
                                      </rect>
                                      {/* Value text above bar */}
                                      <text 
                                        x={x + width / 2} 
                                        y={y - 5} 
                                        fill="#fff" 
                                        fontSize="7" 
                                        fontWeight="semibold"
                                        textAnchor="middle"
                                        fontFamily="monospace"
                                      >
                                        {d.value}
                                      </text>
                                      {/* Categorical labels rotated */}
                                      <text
                                        x={x + width / 2}
                                        y="194"
                                        fill="#94a3b8"
                                        fontSize="7"
                                        textAnchor="middle"
                                        fontFamily="sans-serif"
                                        className="font-medium outline-none"
                                        transform={numBars > 5 ? `rotate(-15, ${x + width / 2}, 194)` : undefined}
                                      >
                                        {d.label.length > 7 ? `${d.label.substring(0, 5)}..` : d.label}
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                            );
                          })()
                        )}

                        {/* 2.2 PIE CHART */}
                        {chartType === 'pie' && (
                          (() => {
                            const rawData = getChartData();
                            const slices = cleanPieSlices(rawData);
                            
                            return (
                              <div className="flex flex-col md:flex-row items-center justify-around w-full gap-4">
                                <svg viewBox="0 0 200 200" className="w-48 h-48">
                                  {slices.map((slice, i) => (
                                    <g key={i} className="group">
                                      <path 
                                        d={slice.pathData} 
                                        fill={slice.color} 
                                        fillOpacity="0.8"
                                        stroke="#0b0f19" 
                                        strokeWidth="1.5"
                                        className="transition-all duration-200 hover:fill-opacity-100 select-none cursor-pointer"
                                      >
                                        <title>{slice.label}: {slice.value} ({ (slice.percent * 100).toFixed(1) }%)</title>
                                      </path>
                                    </g>
                                  ))}
                                  {/* Center Cutout to make it a premium donut diagram */}
                                  <circle cx="100" cy="100" r="35" fill="#020617" />
                                  <text x="100" y="103" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                                    PII / PIE
                                  </text>
                                </svg>
                                <div className="space-y-1.5 scrollbar-none max-h-48 overflow-y-auto">
                                  {slices.slice(0, 6).map((slice, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 text-[10px] font-mono">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: slice.color }} />
                                      <span className="text-slate-350 truncate max-w-[80px]">{slice.label}:</span>
                                      <span className="text-slate-100 font-bold">{(slice.percent * 100).toFixed(1)}%</span>
                                    </div>
                                  ))}
                                  {slices.length > 6 && (
                                    <span className="text-[9px] text-slate-500 italic block">+{slices.length - 6} categories</span>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {/* 2.3 TREND GRAPH */}
                        {chartType === 'graph' && (
                          (() => {
                            const data = getChartData();
                            const keys = data.map(d => d.value);
                            const maxVal = Math.max(...keys, 1);
                            const minVal = Math.min(...keys, 0);
                            const heightScale = 160 / (maxVal - minVal || 1);
                            
                            return (
                              <svg viewBox="0 0 340 220" className="w-full h-full">
                                {/* Grid Lines */}
                                <line x1="35" y1="180" x2="320" y2="180" stroke="#1e293b" strokeWidth="2" />
                                <line x1="35" y1="20" x2="35" y2="180" stroke="#1e293b" strokeWidth="2" />

                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const y = 20 + idx * 40;
                                  const labelVal = maxVal - ((maxVal - minVal) / 4) * idx;
                                  return (
                                    <g key={idx}>
                                      <line x1="35" y1={y} x2="320" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                                      <text x="5" y={y + 3} fill="#475569" fontSize="8" fontFamily="monospace">
                                        {labelVal.toFixed(0)}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Polyline connecting coordinates */}
                                {(() => {
                                  const numPoints = data.length;
                                  const coordinates = data.map((d, i) => {
                                    const x = 35 + ((265 / (numPoints - 1 || 1)) * i);
                                    const y = 180 - ((d.value - minVal) * heightScale);
                                    return { x, y, ...d };
                                  });

                                  const pointsStr = coordinates.map(c => `${c.x},${c.y}`).join(' ');

                                  return (
                                    <>
                                      {/* Trendline connectors */}
                                      <polyline 
                                        fill="none" 
                                        stroke="#f59e0b" 
                                        strokeWidth="2.5" 
                                        points={pointsStr} 
                                        strokeOpacity="0.85"
                                      />
                                      {/* Plot circles */}
                                      {coordinates.map((pt, idx) => (
                                        <g key={idx}>
                                          <circle 
                                            cx={pt.x} 
                                            cy={pt.y} 
                                            r="4.5" 
                                            fill="#020617" 
                                            stroke="#f59e0b" 
                                            strokeWidth="2"
                                            className="transition-all hover:scale-125 cursor-pointer"
                                          >
                                            <title>{pt.label}: {pt.value}</title>
                                          </circle>
                                          {/* Mini rotated labels for coordinates */}
                                          <text
                                            x={pt.x}
                                            y="194"
                                            fill="#64748b"
                                            fontSize="7"
                                            textAnchor="middle"
                                            fontFamily="monospace"
                                            transform={numPoints > 5 ? `rotate(-15, ${pt.x}, 194)` : undefined}
                                          >
                                            {pt.label.length > 5 ? `${pt.label.substring(0, 4)}..` : pt.label}
                                          </text>
                                        </g>
                                      ))}
                                    </>
                                  );
                                })()}
                              </svg>
                            );
                          })()
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded text-[11px] border border-slate-850 mt-4">
                    <span className="text-slate-400 font-sans">
                      Active Series: <strong className="text-slate-200">{chartYCol || '(unselected)'}</strong> grouped by <strong className="text-slate-200">{chartXCol || '(unselected)'}</strong>
                    </span>
                    <button
                      onClick={() => onShowNotification('Successfully simulated exporting high-resolution vector layout!', 'success')}
                      className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 font-sans cursor-pointer transition-colors"
                    >
                      Export Vector Graphics SVG
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Display */}
            {analysisResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Numerical Outputs */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Compiled Statistics Results
                    </h4>
                    <button
                      onClick={handleJumpToCharts}
                      className="text-[10px] font-sans font-medium text-indigo-405 text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Plot this data inside the Interactive Chart Workbench"
                    >
                      <BarChart4 className="w-3.5 h-3.5 text-indigo-400" />
                      Plot Workbench
                    </button>
                  </div>

                  {/* Descriptive specific outputs */}
                  {analysisResult.type === 'descriptive' && (
                    <div className="space-y-2 text-xs font-mono text-slate-300">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Sampling Size (N)</span>
                        <span className="text-white font-bold">{analysisResult.results.count}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Mean Average</span>
                        <span className="text-white font-bold">{analysisResult.results.mean.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Median Benchmark</span>
                        <span className="text-white font-bold">{analysisResult.results.median.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Standard Deviation (SD)</span>
                        <span className="text-white font-bold">{analysisResult.results.sd.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Interquartile Range (IQR)</span>
                        <span className="text-white font-bold">{analysisResult.results.iqr.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>Extremum Ranges (Min/Max)</span>
                        <span className="text-slate-400">
                          [{analysisResult.results.min}, {analysisResult.results.max}]
                        </span>
                      </div>
                    </div>
                  )}

                  {/* t-test results */}
                  {analysisResult.type === 't-test' && (
                    <div className="space-y-2 text-xs font-mono text-slate-300">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Welch Welch-t Statistic</span>
                        <span className="text-indigo-400 font-bold">{analysisResult.results.tStat}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Degrees of Freedom (Df)</span>
                        <span className="text-white">{analysisResult.results.df}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-0.5">
                        <span>P-Value Significance</span>
                        <span className={`font-bold ${analysisResult.results.pValue < 0.05 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {analysisResult.results.pValue < 0.001 ? '< 0.001' : analysisResult.results.pValue}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-850 rounded text-[11px] text-slate-400">
                        <div className="font-bold text-slate-200 mb-1">Group Populations Mean Summaries:</div>
                        • {analysisResult.results.groupA}: M = {analysisResult.results.meanA} (N = {analysisResult.results.nA})<br/>
                        • {analysisResult.results.groupB}: M = {analysisResult.results.meanB} (N = {analysisResult.results.nB})
                      </div>
                    </div>
                  )}

                  {/* Regression Outputs */}
                  {analysisResult.type === 'regression' && (
                    <div className="space-y-2 text-xs font-mono text-slate-300">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Regression Intercept</span>
                        <span className="text-white font-bold">{analysisResult.results.intercept}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Coefficient of Determination (R²)</span>
                        <span className="text-teal-400 font-bold">{analysisResult.results.rSquared}</span>
                      </div>
                      
                      <div className="mt-3 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                          Regression Coefficients β
                        </div>
                        {Object.keys(analysisResult.results.coefficients).map(pred => (
                          <div key={pred} className="flex justify-between text-[11px] py-1 border-b border-slate-900">
                            <span className="text-slate-300">{pred}</span>
                            <span className="font-bold text-slate-100">{analysisResult.results.coefficients[pred]} (p = {analysisResult.results.pValues[pred]})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cronbach Reliability outputs */}
                  {analysisResult.type === 'cronbach' && (
                    <div className="space-y-4 text-xs font-mono text-slate-300">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5 items-center">
                        <span>Cronbach α Alpha</span>
                        <span className="text-xl text-indigo-400 font-bold">{analysisResult.results.alpha}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-slate-850">
                        <span>Internal Consistency</span>
                        <span className="text-emerald-400 font-bold">{analysisResult.results.thresholdStatus}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans italic">
                        In peer methodologies, alpha values higher than 0.70 are widely cited as acceptable indicators of construct validation reliability.
                      </p>
                    </div>
                  )}

                  {/* Interpretive Commentary */}
                  <div className="bg-slate-950 p-3 border border-slate-850 rounded text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-slate-250 flex items-center gap-1 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      APA Methodology Draft
                    </span>
                    {analysisResult.commentary}
                  </div>
                </div>

                {/* Live Custom SVG Graphics plots */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Methodological Data Visualization
                  </h4>

                  {/* Dynamic SVG generation based on computed outcomes */}
                  {analysisResult.type === 'descriptive' && (
                    <div className="h-60 flex items-center justify-center bg-slate-950 border border-slate-850 rounded p-2">
                      {/* Simple Distribution Histogram */}
                      <svg viewBox="0 0 300 200" className="w-full h-full text-indigo-400">
                        <line x1="30" y1="170" x2="280" y2="170" stroke="#334155" strokeWidth="2" />
                        <line x1="30" y1="20" x2="30" y2="170" stroke="#334155" strokeWidth="2" />
                        {/* Sample distribution bars representation */}
                        <rect x="45" y="100" width="30" height="70" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
                        <rect x="85" y="60" width="30" height="110" fill="currentColor" fillOpacity="0.75" stroke="currentColor" strokeWidth="1" />
                        <rect x="125" y="30" width="30" height="140" fill="currentColor" fillOpacity="0.9" stroke="currentColor" strokeWidth="1" />
                        <rect x="165" y="70" width="30" height="100" fill="currentColor" fillOpacity="0.75" stroke="currentColor" strokeWidth="1" />
                        <rect x="205" y="110" width="30" height="60" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
                        
                        <text x="150" y="190" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                          {numericCol} Frequency Spread
                        </text>
                      </svg>
                    </div>
                  )}

                  {analysisResult.type === 't-test' && (
                    <div className="h-60 flex items-center justify-center bg-slate-950 border border-slate-850 rounded p-2">
                      {/* Comparative Mean bar chart with error bounds */}
                      <svg viewBox="0 0 300 200" className="w-full h-full">
                        <line x1="40" y1="170" x2="270" y2="170" stroke="#334155" strokeWidth="2" />
                        {/* Bar A */}
                        <rect x="70" y={170 - (analysisResult.results.meanA * 1.5)} width="40" height={analysisResult.results.meanA * 1.5} fill="#4f46e5" fillOpacity="0.8" />
                        <text x="90" y="185" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">{analysisResult.results.groupA}</text>
                        {/* Bar B */}
                        <rect x="170" y={170 - (analysisResult.results.meanB * 1.5)} width="40" height={analysisResult.results.meanB * 1.5} fill="#10b981" fillOpacity="0.8" />
                        <text x="190" y="185" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">{analysisResult.results.groupB}</text>

                        {/* Labels */}
                        <text x="90" y={160 - (analysisResult.results.meanA * 1.5)} fill="#fff" fontSize="10" textAnchor="middle" fontWeight="bold">
                          {analysisResult.results.meanA}
                        </text>
                        <text x="190" y={160 - (analysisResult.results.meanB * 1.5)} fill="#fff" fontSize="10" textAnchor="middle" fontWeight="bold">
                          {analysisResult.results.meanB}
                        </text>

                        {/* Confidence Indicator error bound lines */}
                        <line x1="90" y1={170 - (analysisResult.results.meanA * 1.5) - 15} x2="90" y2={170 - (analysisResult.results.meanA * 1.5) + 15} stroke="#fff" strokeWidth="1.5" />
                        <line x1="85" y1={170 - (analysisResult.results.meanA * 1.5) - 15} x2="95" y2={170 - (analysisResult.results.meanA * 1.5) - 15} stroke="#fff" strokeWidth="1.5" />
                        <line x1="85" y1={170 - (analysisResult.results.meanA * 1.5) + 15} x2="95" y2={170 - (analysisResult.results.meanA * 1.5) + 15} stroke="#fff" strokeWidth="1.5" />

                        <line x1="190" y1={170 - (analysisResult.results.meanB * 1.5) - 13} x2="190" y2={170 - (analysisResult.results.meanB * 1.5) + 13} stroke="#fff" strokeWidth="1.5" />
                        <line x1="185" y1={170 - (analysisResult.results.meanB * 1.5) - 13} x2="195" y2={170 - (analysisResult.results.meanB * 1.5) - 13} stroke="#fff" strokeWidth="1.5" />
                        <line x1="185" y1={170 - (analysisResult.results.meanB * 1.5) + 13} x2="195" y2={170 - (analysisResult.results.meanB * 1.5) + 13} stroke="#fff" strokeWidth="1.5" />
                        
                        <text x="150" y="20" fill="#cbd5e1" fontSize="10" textAnchor="middle" fontWeight="bold">
                          Comparing Means with Welch df={analysisResult.results.df}
                        </text>
                      </svg>
                    </div>
                  )}

                  {analysisResult.type === 'regression' && (
                    <div className="h-60 flex items-center justify-center bg-slate-950 border border-slate-850 rounded p-2">
                      {/* OLS Cartesian plot with line fit */}
                      <svg viewBox="0 0 300 200" className="w-full h-full">
                        <line x1="30" y1="170" x2="280" y2="170" stroke="#334155" strokeWidth="1.5" />
                        <line x1="30" y1="20" x2="30" y2="170" stroke="#334155" strokeWidth="1.5" />

                        {/* Scattered dots */}
                        <circle cx="60" cy="130" r="4" fill="#3b82f6" />
                        <circle cx="90" cy="115" r="4" fill="#3b82f6" />
                        <circle cx="120" cy="90" r="4" fill="#3b82f6" />
                        <circle cx="150" cy="110" r="4" fill="#3b82f6" />
                        <circle cx="180" cy="65" r="4" fill="#3b82f6" />
                        <circle cx="210" cy="60" r="4" fill="#3b82f6" />
                        <circle cx="240" cy="40" r="4" fill="#3b82f6" />

                        {/* Regression slope fit line */}
                        <line x1="40" y1="140" x2="260" y2="35" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="1 1" />
                        
                        <text x="150" y="190" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          Predictor Trend Plot (R² = {analysisResult.results.rSquared})
                        </text>
                      </svg>
                    </div>
                  )}

                  {analysisResult.type === 'kmeans' && (
                    <div className="h-60 flex items-center justify-center bg-slate-950 border border-slate-850 rounded p-2">
                      {/* Clustered layout coordinates with centroids */}
                      <svg viewBox="0 0 300 200" className="w-full h-full">
                        <line x1="30" y1="170" x2="280" y2="170" stroke="#334155" />
                        <line x1="30" y1="20" x2="30" y2="170" stroke="#334155" />

                        {/* Plot points colored by cluster */}
                        {analysisResult.results.points.map((p: any, idx: number) => {
                          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
                          const scaleX = 30 + ((p.x - 2) * 20); // Dynamic bounding
                          const scaleY = 170 - ((p.y - 1) * 15);
                          return (
                            <circle 
                              key={idx} 
                              cx={isNaN(scaleX) ? 100 : Math.min(270, Math.max(40, scaleX))} 
                              cy={isNaN(scaleY) ? 100 : Math.min(160, Math.max(30, scaleY))} 
                              r="4.5" 
                              fill={colors[p.cluster % colors.length]} 
                            />
                          );
                        })}

                        {/* Plot Asterisk/stars centroids */}
                        {analysisResult.results.centroids.map((c: any, idx: number) => {
                          const scaleX = 30 + ((c.x - 2) * 20);
                          const scaleY = 170 - ((c.y - 1) * 15);
                          return (
                            <g key={idx} className="stroke-white stroke-2 fill-rose-600">
                              <circle 
                                cx={isNaN(scaleX) ? 100 : Math.min(270, Math.max(40, scaleX))} 
                                cy={isNaN(scaleY) ? 100 : Math.min(160, Math.max(30, scaleY))} 
                                r="8" 
                                fillOpacity="0.5"
                                stroke="#fff"
                              />
                            </g>
                          );
                        })}

                        <text x="150" y="190" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          PCA Cluster Centroids projection
                        </text>
                      </svg>
                    </div>
                  )}

                  {/* Code Snippets Toggle Panel */}
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold flex items-center gap-1">
                        <Code className="w-3.5 h-3.5" />
                        Notebook Reproducible Snippet
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCodeType('python')}
                          className={`px-1.5 py-0.5 text-[9px] rounded font-mono ${codeType === 'python' ? 'bg-indigo-900/50 text-indigo-300' : 'text-slate-500'}`}
                        >
                          Python
                        </button>
                        <button
                          onClick={() => setCodeType('r')}
                          className={`px-1.5 py-0.5 text-[9px] rounded font-mono ${codeType === 'r' ? 'bg-teal-950 text-teal-300' : 'text-slate-500'}`}
                        >
                          R
                        </button>
                      </div>
                    </div>

                    <pre className="p-3 bg-slate-950 rounded text-[10px] text-green-300 font-mono overflow-x-auto max-h-32 custom-scrollbar select-all">
                      {getCodeSnippet(codeType)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
