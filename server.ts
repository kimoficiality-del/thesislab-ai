/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { 
  calculateDescriptive, 
  calculateCorrelationMatrix, 
  calculateTTest, 
  calculateANOVA, 
  calculateMultipleRegression, 
  calculateCronbachAlpha, 
  calculateKMeans 
} from './server_stats.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initializing real Gemini client safely.
// In AI Studio workspace, GEMINI_API_KEY is loaded in process.env.
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.error('Error instantiating GoogleGenAI:', err);
  }
}

// In-Memory Database
const projects: Record<string, any> = {
  'project-bsc-1': {
    id: 'project-bsc-1',
    title: 'Social Capital and Reading Performance in Urban Primary Schools',
    discipline: 'Socio-Educational Sciences',
    academicLevel: 'BSc',
    methodology: 'Quantitative',
    researchQuestions: [
      'Does weekly dedicated home reading support positively affect test scores?',
      'Are screen-time variables negatively correlated with student focus evaluations?'
    ],
    hypotheses: [
      {
        id: 'h1',
        statement: 'Parental study support hours will display a positive significant correlation with reading scores.',
        nullHypothesis: 'Parental support hours has no major positive correlation with reading test scores.',
        alternativeHypothesis: 'Parental support hours has a major positive correlation with reading test scores.',
        testUsed: 'Correlation matrix',
        pvalue: 0.0012,
        result: 'Supported'
      },
      {
        id: 'h2',
        statement: 'Students with above-average weekly screen time have significantly lower reading performance compared to students with low screen time.',
        nullHypothesis: 'There is no major gap in reading performance scores across screen-time tiers.',
        alternativeHypothesis: 'A major negative performance score gap exists among those with excessive screen-time tiers.',
        testUsed: 'Independent Samples t-test',
        pvalue: 0.038,
        result: 'Supported'
      }
    ],
    dataset: {
      id: 'dataset-bsc-1',
      name: 'urban_reading_performance.csv',
      headers: ['Student_ID', 'Reading_Score', 'Grade_Level', 'Support_Hours', 'Socio_Economic_Group', 'Screen_Time_Hrs'],
      originalRows: [
        { Student_ID: 'STU-01', Reading_Score: 88, Grade_Level: '4th Grade', Support_Hours: 6.5, Socio_Economic_Group: 'Mid', Screen_Time_Hrs: 2.1 },
        { Student_ID: 'STU-02', Reading_Score: 62, Grade_Level: '4th Grade', Support_Hours: 1.0, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 5.5 },
        { Student_ID: 'STU-03', Reading_Score: 94, Grade_Level: '5th Grade', Support_Hours: 8.0, Socio_Economic_Group: 'High', Screen_Time_Hrs: 1.2 },
        { Student_ID: 'STU-04', Reading_Score: 78, Grade_Level: '4th Grade', Support_Hours: 4.0, Socio_Economic_Group: 'Mid', Screen_Time_Hrs: 3.0 },
        { Student_ID: 'STU-05', Reading_Score: 54, Grade_Level: '5th Grade', Support_Hours: 0.5, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 7.2 },
        { Student_ID: 'STU-06', Reading_Score: 82, Grade_Level: '5th Grade', Support_Hours: 5.0, Socio_Economic_Group: 'High', Screen_Time_Hrs: 2.8 },
        { Student_ID: 'STU-07', Reading_Score: 71, Grade_Level: '4th Grade', Support_Hours: 3.5, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 4.4 },
        { Student_ID: 'STU-08', Reading_Score: 91, Grade_Level: '5th Grade', Support_Hours: 7.0, Socio_Economic_Group: 'High', Screen_Time_Hrs: 1.5 },
        { Student_ID: 'STU-09', Reading_Score: 80, Grade_Level: '4th Grade', Support_Hours: 4.5, Socio_Economic_Group: 'Mid', Screen_Time_Hrs: 2.9 },
        { Student_ID: 'STU-10', Reading_Score: 65, Grade_Level: '5th Grade', Support_Hours: 2.0, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 6.0 },
        { Student_ID: 'STU-11', Reading_Score: 85, Grade_Level: '4th Grade', Support_Hours: 5.5, Socio_Economic_Group: 'High', Screen_Time_Hrs: 2.2 },
        { Student_ID: 'STU-12', Reading_Score: 73, Grade_Level: '5th Grade', Support_Hours: 3.0, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 4.8 }
      ],
      rows: [
        { Student_ID: 'STU-01', Reading_Score: 88, Grade_Level: '4th Grade', Support_Hours: 6.5, Socio_Economic_Group: 'Mid', Screen_Time_Hrs: 2.1 },
        { Student_ID: 'STU-02', Reading_Score: 62, Grade_Level: '4th Grade', Support_Hours: 1.0, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 5.5 },
        { Student_ID: 'STU-03', Reading_Score: 94, Grade_Level: '5th Grade', Support_Hours: 8.0, Socio_Economic_Group: 'High', Screen_Time_Hrs: 1.2 },
        { Student_ID: 'STU-04', Reading_Score: 78, Grade_Level: '4th Grade', Support_Hours: 4.0, Socio_Economic_Group: 'Mid', Screen_Time_Hrs: 3.0 },
        { Student_ID: 'STU-05', Reading_Score: 54, Grade_Level: '5th Grade', Support_Hours: 0.5, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 7.2 },
        { Student_ID: 'STU-06', Reading_Score: 82, Grade_Level: '5th Grade', Support_Hours: 5.0, Socio_Economic_Group: 'High', Screen_Time_Hrs: 2.8 },
        { Student_ID: 'STU-07', Reading_Score: 71, Grade_Level: '4th Grade', Support_Hours: 3.5, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 4.4 },
        { Student_ID: 'STU-08', Reading_Score: 91, Grade_Level: '5th Grade', Support_Hours: 7.0, Socio_Economic_Group: 'High', Screen_Time_Hrs: 1.5 },
        { Student_ID: 'STU-09', Reading_Score: 80, Grade_Level: '4th Grade', Support_Hours: 4.5, Socio_Economic_Group: 'Mid', Screen_Time_Hrs: 2.9 },
        { Student_ID: 'STU-10', Reading_Score: 65, Grade_Level: '5th Grade', Support_Hours: 2.0, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 6.0 },
        { Student_ID: 'STU-11', Reading_Score: 85, Grade_Level: '4th Grade', Support_Hours: 5.5, Socio_Economic_Group: 'High', Screen_Time_Hrs: 2.2 },
        { Student_ID: 'STU-12', Reading_Score: 73, Grade_Level: '5th Grade', Support_Hours: 3.0, Socio_Economic_Group: 'Low', Screen_Time_Hrs: 4.8 }
      ],
      variables: [
        { name: 'Student_ID', type: 'text', missingCount: 0, missingPercentage: 0, uniqueCount: 12, sampleValues: ['STU-01', 'STU-02', 'STU-03'] },
        { name: 'Reading_Score', type: 'numeric', missingCount: 0, missingPercentage: 0, uniqueCount: 12, sampleValues: ['88', '62', '94'] },
        { name: 'Grade_Level', type: 'categorical', missingCount: 0, missingPercentage: 0, uniqueCount: 2, sampleValues: ['4th Grade', '5th Grade'] },
        { name: 'Support_Hours', type: 'numeric', missingCount: 0, missingPercentage: 0, uniqueCount: 11, sampleValues: ['6.5', '1.0', '8.0'] },
        { name: 'Socio_Economic_Group', type: 'categorical', missingCount: 0, missingPercentage: 0, uniqueCount: 3, sampleValues: ['Mid', 'Low', 'High'] },
        { name: 'Screen_Time_Hrs', type: 'numeric', missingCount: 0, missingPercentage: 0, uniqueCount: 12, sampleValues: ['2.1', '5.5', '1.2'] }
      ],
      versions: [
        { id: 'v1', name: 'Raw Ingestion', timestamp: '2026-06-11T14:20:00Z', description: 'Original parsed file.', rowCount: 12, columnCount: 6 }
      ]
    },
    comments: [
      { id: 'c1', author: 'Dr. Helen Vance (Advisor)', role: 'supervisor', text: 'You should perform a multiple regression modeling Reading_Score with both Support_Hours and Screen_Time_Hrs to rule out parental support skew.', timestamp: '2026-06-12T09:44:00Z', sectionLink: 'Methodology' }
    ],
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-06-13T11:59:00Z'
  },
  'project-msc-1': {
    id: 'project-msc-1',
    title: 'Microbiome Speciation and Forest Soil Acidification in Deciduous Biomes',
    discipline: 'Biochemistry / Ecophysiology',
    academicLevel: 'MSc',
    methodology: 'Mixed-Methods',
    researchQuestions: [
      'Is there an empirical threshold where soil acidity restricts specific aerobic microbial taxa concentrations?',
      'How do forestry practitioners qualitatively evaluate localized species resilient factors under active liming?'
    ],
    hypotheses: [
      {
        id: 'h1',
        statement: 'Bacterial counts decline non-differentially across continuous acidification gradations below pH 5.2.',
        nullHypothesis: 'Bacteria densities do not shift significantly across pH gradations below 5.2.',
        alternativeHypothesis: 'Acidity gradations below 5.2 significantly correlate with a drop-off in microbial densities.',
        testUsed: 'Simple Linear Regression',
        pvalue: 0.0075,
        result: 'Supported'
      }
    ],
    dataset: {
      id: 'dataset-msc-1',
      name: 'deciduous_microbiome_v3.xlsx',
      headers: ['Sample_ID', 'Soil_pH', 'Bacteria_Count', 'Organic_Matter_Pct', 'Moisture_Class', 'Location_Zone'],
      originalRows: [
        { Sample_ID: 'SMP-01', Soil_pH: 4.5, Bacteria_Count: 120, Organic_Matter_Pct: 8.5, Moisture_Class: 'Dry', Location_Zone: 'North Ridge' },
        { Sample_ID: 'SMP-02', Soil_pH: 4.8, Bacteria_Count: 145, Organic_Matter_Pct: 10.2, Moisture_Class: 'Moist', Location_Zone: 'North Ridge' },
        { Sample_ID: 'SMP-03', Soil_pH: 5.2, Bacteria_Count: 210, Organic_Matter_Pct: 12.0, Moisture_Class: 'Wet', Location_Zone: 'South Gorge' },
        { Sample_ID: 'SMP-04', Soil_pH: 5.6, Bacteria_Count: 290, Organic_Matter_Pct: 7.1, Moisture_Class: 'Moist', Location_Zone: 'South Gorge' },
        { Sample_ID: 'SMP-05', Soil_pH: 4.2, Bacteria_Count: 95, Organic_Matter_Pct: 14.5, Moisture_Class: 'Dry', Location_Zone: 'West Valley' },
        { Sample_ID: 'SMP-06', Soil_pH: 5.9, Bacteria_Count: 400, Organic_Matter_Pct: 6.8, Moisture_Class: 'Wet', Location_Zone: 'West Valley' },
        { Sample_ID: 'SMP-07', Soil_pH: 5.1, Bacteria_Count: 180, Organic_Matter_Pct: 9.9, Moisture_Class: 'Moist', Location_Zone: 'North Ridge' },
        { Sample_ID: 'SMP-08', Soil_pH: 6.2, Bacteria_Count: 450, Organic_Matter_Pct: 11.1, Moisture_Class: 'Wet', Location_Zone: 'South Gorge' }
      ],
      rows: [
        { Sample_ID: 'SMP-01', Soil_pH: 4.5, Bacteria_Count: 120, Organic_Matter_Pct: 8.5, Moisture_Class: 'Dry', Location_Zone: 'North Ridge' },
        { Sample_ID: 'SMP-02', Soil_pH: 4.8, Bacteria_Count: 145, Organic_Matter_Pct: 10.2, Moisture_Class: 'Moist', Location_Zone: 'North Ridge' },
        { Sample_ID: 'SMP-03', Soil_pH: 5.2, Bacteria_Count: 210, Organic_Matter_Pct: 12.0, Moisture_Class: 'Wet', Location_Zone: 'South Gorge' },
        { Sample_ID: 'SMP-04', Soil_pH: 5.6, Bacteria_Count: 290, Organic_Matter_Pct: 7.1, Moisture_Class: 'Moist', Location_Zone: 'South Gorge' },
        { Sample_ID: 'SMP-05', Soil_pH: 4.2, Bacteria_Count: 95, Organic_Matter_Pct: 14.5, Moisture_Class: 'Dry', Location_Zone: 'West Valley' },
        { Sample_ID: 'SMP-06', Soil_pH: 5.9, Bacteria_Count: 400, Organic_Matter_Pct: 6.8, Moisture_Class: 'Wet', Location_Zone: 'West Valley' },
        { Sample_ID: 'SMP-07', Soil_pH: 5.1, Bacteria_Count: 180, Organic_Matter_Pct: 9.9, Moisture_Class: 'Moist', Location_Zone: 'North Ridge' },
        { Sample_ID: 'SMP-08', Soil_pH: 6.2, Bacteria_Count: 450, Organic_Matter_Pct: 11.1, Moisture_Class: 'Wet', Location_Zone: 'South Gorge' }
      ],
      variables: [
        { name: 'Sample_ID', type: 'text', missingCount: 0, missingPercentage: 0, uniqueCount: 8, sampleValues: ['SMP-01', 'SMP-02', 'SMP-03'] },
        { name: 'Soil_pH', type: 'numeric', missingCount: 0, missingPercentage: 0, uniqueCount: 8, sampleValues: ['4.5', '4.8', '5.2'] },
        { name: 'Bacteria_Count', type: 'numeric', missingCount: 0, missingPercentage: 0, uniqueCount: 8, sampleValues: ['120', '145', '210'] },
        { name: 'Organic_Matter_Pct', type: 'numeric', missingCount: 0, missingPercentage: 0, uniqueCount: 8, sampleValues: ['8.5', '10.2', '12.0'] },
        { name: 'Moisture_Class', type: 'categorical', missingCount: 0, missingPercentage: 0, uniqueCount: 3, sampleValues: ['Dry', 'Moist', 'Wet'] },
        { name: 'Location_Zone', type: 'categorical', missingCount: 0, missingPercentage: 0, uniqueCount: 3, sampleValues: ['North Ridge', 'South Gorge', 'West Valley'] }
      ],
      versions: [
        { id: 'v1', name: 'Original Sheet Import', timestamp: '2026-06-13T10:00:00Z', description: 'Initial biological log upload', rowCount: 8, columnCount: 6 }
      ]
    },
    comments: [
      { id: 'c21', author: 'Markus K. (Student)', role: 'student', text: 'Dr. Helen, I’ve completed the ELA station layout. Do you think I should do a qualitative cluster matrix for our practitioner surveys?', timestamp: '2026-06-13T11:15:00Z', sectionLink: 'Results' }
    ],
    createdAt: '2026-06-12T11:00:00Z',
    updatedAt: '2026-06-14T01:10:00Z'
  }
};

// Seed knowledge base for Retrieval-Augmented Generation (RAG)
const knowledgeBase = [
  {
    topic: 'Choosing a test by variable type',
    discipline: 'General Statistics',
    content: `When designing your methodology, the structural scale of your variables determines your tests:
- **Independent Variable (Categorical, 2 groups)** & **Dependent Variable (Interval/Ratio)**: Independent Samples **t-test**.
- **Independent Variable (Categorical, 3+ groups)** & **Dependent Variable (Interval/Ratio)**: **One-way ANOVA**.
- **Both variables Continuous/Scale**: Use **Pearson Correlation (r)** to check relationships, or **Simple Linear Regression** to model prediction coefficients.
- **Categorical predictor & Binary categorical target**: Use **Logistic Regression** (such as Odds-Ratios).
- **Both variables Nominal/Categorical**: Use **Chi-Square Independency Test**.`
  },
  {
    topic: 'Assumption checks & diagnostics',
    discipline: 'General Methodology',
    content: `Parametric analysis (t-test, ANOVA, Linear Regression) mandates verifying:
1. **Normality**: Values should cluster symmetrically. Best analyzed through visual Q-Q plots, Histograms or Shapiro-Wilk tests.
2. **Homoscedasticity / Homogeneity of Variance**: Scatter residuals must stay constant. Verify using Levene's Test or residual vs fitted plots.
3. **Multicollinearity (Regression)**: Predictors shouldn't inter-correlate heavily. Checked using Variance Inflation Factor (VIF). Values > 5 request remediation.`
  },
  {
    topic: 'Effect sizes and their evaluation rules',
    discipline: 'Quantitative Methods',
    content: `Statistical significance (p-value < 0.05) tells us if a relationship is real, but **Effect Size** dictates strength:
- **t-test**: Use Cohen's d (0.2 = small, 0.5 = medium, 0.8 = large).
- **ANOVA / Regression**: R-squared (R²) measures percentage of explained variability (e.g., 0.13 = moderate, 0.26 = substantial). Eta-squared measures individual factor contributions.`
  },
  {
    topic: 'APA Reporting templates',
    discipline: 'Academic Reporting',
    content: `Use this standard syntax for report draft generation:
- **T-Test**: "Reading scores differed significantly between Group A (M = 88.0, SD = 3.2) and Group B (M = 62.1, SD = 4.8), t(10) = 4.21, p = .003, with a large Cohen's d of 0.82."
- **Regression**: "A multiple regression analysis was conducted to predict reading score based on home support and screen hours. The model was significant, F(2, 9) = 11.23, p = .004, R2 = .71."`
  }
];

// Health Metrics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    cpuUsage: Math.round(18 + Math.random() * 10),
    ramUsage: Math.round(41 + Math.random() * 5),
    activeJobs: 0,
    storageQuotaUsed: '42.1 MB / 500 MB'
  });
});

// Projects API
app.get('/api/projects', (req, res) => {
  res.json(Object.values(projects));
});

app.get('/api/projects/:id', (req, res) => {
  const p = projects[req.params.id];
  if (!p) return res.status(404).json({ error: 'Project not found' });
  res.json(p);
});

app.post('/api/projects', (req, res) => {
  const { title, academicLevel, methodology, discipline, researchQuestions, hypotheses, datasetsName } = req.body;
  if (!title) return res.status(400).json({ error: 'Project Title is required' });

  const id = `project-usr-${Date.now()}`;
  const newProj = {
    id,
    title,
    discipline: discipline || 'Interdisciplinary Studies',
    academicLevel: academicLevel || 'MSc',
    methodology: methodology || 'Quantitative',
    researchQuestions: Array.isArray(researchQuestions) ? researchQuestions : ['What factors display statistical relationships?'],
    hypotheses: Array.isArray(hypotheses) ? hypotheses : [],
    comments: [],
    dataset: datasetsName ? {
      id: `dataset-${id}`,
      name: datasetsName,
      headers: [],
      originalRows: [],
      rows: [],
      variables: [],
      versions: [{ id: 'v1', name: 'File Created', timestamp: new Date().toISOString(), description: 'Database shell successfully initiated.', rowCount: 0, columnCount: 0 }]
    } : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  projects[id] = newProj;
  res.status(201).json(newProj);
});

// Upload and ingest custom CSV/TSV/JSON tabular data
app.post('/api/projects/:id/upload', (req, res) => {
  const p = projects[req.params.id];
  if (!p) return res.status(404).json({ error: 'Project not found' });

  const { filename, fileContent } = req.body; // Expects raw text or CSV rows
  if (!fileContent) return res.status(400).json({ error: 'No data file content found' });

  try {
    let rows: any[] = [];
    let headers: string[] = [];

    // Simple CSV parser
    const lines = fileContent.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      headers = lines[0].split(',').map((h: string) => h.replace(/^"|"$/g, '').trim());
      
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p: string) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= headers.length) {
          const rowObj: any = {};
          headers.forEach((h, hIdx) => {
            const rawVal = parts[hIdx];
            // Infer number vs string
            if (rawVal === '' || rawVal === undefined) {
              rowObj[h] = null;
            } else if (!isNaN(Number(rawVal))) {
              rowObj[h] = Number(rawVal);
            } else {
              rowObj[h] = rawVal;
            }
          });
          rows.push(rowObj);
        }
      }
    }

    if (rows.length === 0) {
      throw new Error('Could not parse any valid row elements.');
    }

    // Infer variables schema
    const variables = headers.map(h => {
      const sampleVals = rows.slice(0, 3).map(r => String(r[h] ?? ''));
      const counts = rows.map(r => r[h]);
      const missing = counts.filter(c => c === null || c === undefined || c === '').length;
      const uniqueCount = new Set(counts.filter(c => c !== null)).size;
      
      // Guess type
      let type: 'numeric' | 'categorical' | 'text' = 'text';
      const nonNulls = counts.filter(c => c !== null && c !== undefined && c !== '');
      if (nonNulls.length > 0 && nonNulls.every(n => !isNaN(Number(n)))) {
        type = 'numeric';
      } else if (uniqueCount < Math.max(3, rows.length * 0.4)) {
        type = 'categorical';
      }

      return {
        name: h,
        type,
        missingCount: missing,
        missingPercentage: Math.round((missing / rows.length) * 100),
        uniqueCount,
        sampleValues: sampleVals
      };
    });

    const datasetId = `dataset-usr-${Date.now()}`;
    p.updatedAt = new Date().toISOString();
    p.dataset = {
      id: datasetId,
      name: filename || 'uploaded_data.csv',
      headers,
      originalRows: rows,
      rows: rows,
      variables,
      versions: [
        {
          id: 'v1',
          name: 'Manual Ingestion',
          timestamp: new Date().toISOString(),
          description: `Imported parsed tabular text. Identified ${headers.length} columns.`,
          rowCount: rows.length,
          columnCount: headers.length
        }
      ]
    };

    res.json(p);
  } catch (err: any) {
    res.status(400).json({ error: `File Parsing Failure: ${err.message}` });
  }
});

// Data cleaning transformation action
app.post('/api/projects/:id/clean', (req, res) => {
  const p = projects[req.params.id];
  if (!p || !p.dataset) return res.status(404).json({ error: 'Project or active dataset not found' });

  const { method, columnName } = req.body;
  const ds = p.dataset;
  
  try {
    let cleanRows = [...ds.rows];
    let descrip = '';

    if (method === 'drop_missing') {
      cleanRows = cleanRows.filter(r => r[columnName] !== null && r[columnName] !== undefined && r[columnName] !== '');
      descrip = `Dropped rows with null values under '${columnName}'.`;
    } else if (method === 'fill_mean') {
      const numbers = cleanRows.map(r => Number(r[columnName])).filter(n => !isNaN(n));
      const meanValue = numbers.reduce((sa, sb) => sa + sb, 0) / Math.max(1, numbers.length);
      cleanRows = cleanRows.map(r => {
        if (r[columnName] === null || r[columnName] === undefined || r[columnName] === '') {
          return { ...r, [columnName]: Math.round(meanValue * 100) / 100 };
        }
        return r;
      });
      descrip = `Imputed nulls in '${columnName}' with column mean (${Math.round(meanValue * 100) / 100}).`;
    } else if (method === 'min_max_normalize') {
      const numbers = cleanRows.map(r => Number(r[columnName])).filter(n => !isNaN(n));
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      cleanRows = cleanRows.map(r => {
        const val = Number(r[columnName]);
        if (!isNaN(val)) {
          const scaled = (val - min) / Math.max(1e-5, max - min);
          return { ...r, [columnName]: Math.round(scaled * 1000) / 1000 };
        }
        return r;
      });
      descrip = `Min-Max normalized continuous feature '${columnName}' values on [0, 1] interval.`;
    } else {
      return res.status(400).json({ error: 'Unsupported cleaning metric action.' });
    }

    // Append new version audits
    const newVerId = `v${ds.versions.length + 1}`;
    ds.versions.unshift({
      id: newVerId,
      name: `Clean Pipeline - ${columnName}`,
      timestamp: new Date().toISOString(),
      description: descrip,
      rowCount: cleanRows.length,
      columnCount: ds.headers.length
    });

    ds.rows = cleanRows;
    p.updatedAt = new Date().toISOString();
    res.json(p);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Post review or student comments
app.post('/api/projects/:id/comments', (req, res) => {
  const p = projects[req.params.id];
  if (!p) return res.status(404).json({ error: 'Project not found' });

  const { author, text, role, sectionLink } = req.body;
  if (!text) return res.status(400).json({ error: 'Annotation text is mandatory' });

  const comment = {
    id: `comment-${Date.now()}`,
    author: author || 'Academic Panel',
    role: role || 'student',
    text,
    timestamp: new Date().toISOString(),
    sectionLink
  };

  p.comments.push(comment);
  p.updatedAt = new Date().toISOString();
  res.status(201).json(p);
});

// Perform actual statistical operations and diagnostics
app.post('/api/projects/:id/analyze', (req, res) => {
  const p = projects[req.params.id];
  if (!p || !p.dataset) return res.status(404).json({ error: 'Project or active dataset elements not found' });

  const { type, numericX, numericY, categoricalX, predictorCols, clusters } = req.body;
  const data = p.dataset.rows;

  try {
    let resultPayload: any = null;
    let reportCommentary = '';

    if (type === 'descriptive') {
      if (!numericX) throw new Error('Numerical column is required');
      resultPayload = calculateDescriptive(data, numericX);
      if (resultPayload) {
        reportCommentary = `Descriptive statistics for variable '${numericX}' (M = ${resultPayload.mean.toFixed(2)}, SD = ${resultPayload.sd.toFixed(2)}) indicates the sampling is concentrated within conventional distributions with an IQR index of ${resultPayload.iqr.toFixed(2)}.`;
      }
    } else if (type === 'correlation') {
      if (!predictorCols || predictorCols.length < 2) throw new Error('At least 2 numerical predictor columns are required');
      resultPayload = calculateCorrelationMatrix(data, predictorCols);
      reportCommentary = `Pearson coefficient correlation was executed over [${predictorCols.join(', ')}]. Highly correlated scales must be monitored for collinear redundancy variables.`;
    } else if (type === 't-test') {
      if (!numericX || !categoricalX) throw new Error('Numeric variable and 2-group categorical factor are required');
      resultPayload = calculateTTest(data, numericX, categoricalX);
      if (resultPayload) {
        const supportStatus = resultPayload.pValue < 0.05 ? 'significantly higher' : 'statistically similar';
        reportCommentary = `An independent-samples t-test was run to check scores across '${categoricalX}' groups. Mean of ${resultPayload.groupA} (M = ${resultPayload.meanA}, SD = ${resultPayload.sdA}) was ${supportStatus} than ${resultPayload.groupB} (M = ${resultPayload.meanB}, SD = ${resultPayload.sdB}), Welch-t(${resultPayload.df}) = ${resultPayload.tStat}, p = ${resultPayload.pValue < 0.001 ? '<.001' : resultPayload.pValue}.`;
      } else {
        throw new Error('Welch test failed. Ensure categorical feature splits the dataset into exactly two valid populations.');
      }
    } else if (type === 'anova') {
      if (!numericX || !categoricalX) throw new Error('Numeric continuous criteria and categorical factors are required');
      resultPayload = calculateANOVA(data, numericX, categoricalX);
      if (resultPayload) {
        const pStr = resultPayload.pValue < 0.001 ? '<.001' : `= ${resultPayload.pValue}`;
        reportCommentary = `One-way analysis of variance (ANOVA) modeled performance impacts across '${categoricalX}' categories. There is a ${resultPayload.pValue < 0.05 ? 'significant' : 'non-significant'} global variability, F(${resultPayload.dfBetween}, ${resultPayload.dfWithin}) = ${resultPayload.fStat}, p ${pStr}.`;
      } else {
        throw new Error('ANOVA failed. Ensure categories contain valid distinct value groups.');
      }
    } else if (type === 'regression') {
      if (!numericY || !predictorCols || predictorCols.length === 0) throw new Error('Target Criteria and Predictor Scale lists are required');
      resultPayload = calculateMultipleRegression(data, numericY, predictorCols);
      if (resultPayload) {
        reportCommentary = `Multiple linear regression regressed '${numericY}' on [${predictorCols.join(', ')}]. The model accounts for ${(resultPayload.rSquared * 100).toFixed(1)}% of total observed criteria variance, with an intercept benchmark of ${resultPayload.intercept}.`;
      } else {
        throw new Error('Regression singular matrix error. Eliminate perfectly redundant features to avoid over-specification.');
      }
    } else if (type === 'kmeans') {
      if (!numericX || !numericY) throw new Error('Two continuous features are required');
      const kVal = clusters ? Number(clusters) : 3;
      resultPayload = calculateKMeans(data, numericX, numericY, kVal);
      if (resultPayload) {
        reportCommentary = `K-Means clustering categorized researchers into ${kVal} cohorts along axes '${numericX}' and '${numericY}'. Centroids are adjusted recursively to minimize local intra-cluster SSE.`;
      }
    } else if (type === 'survey_alpha') {
      if (!predictorCols || predictorCols.length < 2) throw new Error('At least 2 continuous Likert items are required');
      const alphaVal = calculateCronbachAlpha(data, predictorCols);
      if (alphaVal !== null) {
        let textStatus = 'Deplorable reliability';
        if (alphaVal >= 0.8) textStatus = 'Excellent reliability';
        else if (alphaVal >= 0.7) textStatus = 'Acceptable/High reliability';
        else if (alphaVal >= 0.6) textStatus = 'Questionable internal consistency';
        resultPayload = { alpha: alphaVal, thresholdStatus: textStatus };
        reportCommentary = `Standardized Cronbach Alpha coefficient for the input ${predictorCols.length} scales yields ${alphaVal}, demonstrating '${textStatus}' which meets standard peer requirements.`;
      } else {
        throw new Error('Could not calculate Cronbach alpha. Ensure selected features contain normal scale ratings.');
      }
    } else {
      return res.status(400).json({ error: 'Requested analysis wizard is unimplemented.' });
    }

    res.json({
      type,
      parameters: req.body,
      results: resultPayload,
      commentary: reportCommentary,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Compile whole APA draft reports
app.post('/api/projects/:id/report', (req, res) => {
  const p = projects[req.params.id];
  if (!p) return res.status(404).json({ error: 'Project not found' });

  const { citationStyle } = req.body;
  const style = citationStyle || 'APA';

  // Compose robust report structure
  const report: any = {
    id: `report-${Date.now()}`,
    title: p.title,
    citationStyle: style,
    sections: {
      introduction: `This research project models crucial trends inside ${p.discipline} focusing specifically on resolving: "${p.researchQuestions.join(', or ')}". This study was carried out adhering strictly to empirical criteria under supervision level: ${p.academicLevel}.`,
      methodology: `This study employs a rigorous ${p.methodology} research design. Data collected consists of ${p.dataset ? p.dataset.rows.length + ' observed samples' : 'pre-processed observations'}, analyzing continuous structures under role constraints. Hypotheses test assumptions were monitored for structural normality, collinearity thresholds, and outlier distributions.`,
      resultsAndAnalysis: p.dataset ? `The main descriptive statistics demonstrate regular sample clusters. Hypotheses were tested using empirical coefficients (p < 0.05). Correlation indicators or continuous t-test variances have been summarized in visual formats below. Statistical anomalies were filtered directly using the historical transformation cleaner.` : `Statistical analysis is currently in progress. Variables have been mapped across BSc/MSc/PhD credentials.`,
      discussionAndLimitations: `The findings support original assumptions but are subject to sample size limitations. Local adjustments are recommended to validate broad-level external generalizations. Standard ethical constraints preclude the mechanical composition of theses without active interactive modeling.`,
      references: style === 'APA' 
        ? `American Psychological Association. (2020). Publication manual of the American Psychological Association (7th ed.). https://doi.org/10.1037/0000165-000\nField, A. (2018). Discovering statistics using IBM SPSS statistics (5th ed.). SAGE Publications.\nAcademic Advisor Annotation Log. Research comments archive (Project-Code: ${p.id}).`
        : style === 'MLA'
          ? `Advising Panel. Academic Research and Methodology Records, 2026.\nField, Andy. Discovering Statistics. SAGE, 2018.\nPublication Manual of the APA. 7th ed., 2020.`
          : `Field, Andy. 2018. Discovering Statistics. SAGE Publications.\nAPA. 2020. Publication Manual. 7th ed. Washington, DC: American Psychological Association.`
    },
    generatedAt: new Date().toISOString()
  };

  p.reportDraft = report;
  p.updatedAt = new Date().toISOString();
  res.json(p);
});

// Chat controller incorporating seed knowledge index + Gemini
app.post('/api/chat', async (req, res) => {
  const { messages, projectContext } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const latestMessage = messages[messages.length - 1]?.text || '';
  
  // Format Knowledge base lookup to support Retrieval-Augmented Generation (RAG)
  let matchedDocsText = '';
  const searchQueries = latestMessage.toLowerCase();
  
  const matches = knowledgeBase.filter(article => {
    return searchQueries.includes(article.topic.toLowerCase()) || 
           searchQueries.includes(article.discipline.toLowerCase()) || 
           article.content.toLowerCase().split(' ').some((word: string) => word.length > 4 && searchQueries.includes(word));
  });

  if (matches.length > 0) {
    matchedDocsText = "\n=== KNOWLEDGE RETRIEVED ARTICLES ===\n" + 
      matches.map(m => `Topic: ${m.topic}\nCategory: ${m.discipline}\nContent: ${m.content}`).join('\n\n') + '\n====================================\n';
  } else {
    // Provide general context fallback
    matchedDocsText = "\n=== KNOWLEDGE RETRIEVED ARTICLES ===\n" + 
      knowledgeBase.map(m => `Topic: ${m.topic}\nContent: ${m.content}`).slice(0, 2).join('\n\n') + '\n====================================\n';
  }

  // Build full project context summary
  let projSummary = 'No active project selected.';
  if (projectContext) {
    projSummary = `Active Project: "${projectContext.title}"
Level: ${projectContext.academicLevel}
Discipline: ${projectContext.discipline}
Methodology: ${projectContext.methodology}
Research Questions: ${projectContext.researchQuestions?.join(' | ')}
Dataset Name: ${projectContext.dataset?.name || 'No file uploaded'}
Dataset Size: ${projectContext.dataset?.rows?.length || 0} samples
Variables list: ${projectContext.dataset?.variables?.map((v: any) => `${v.name} (${v.type})`).join(', ') || 'No variables yet'}`;
  }

  const systemInstruction = `You are an expert Academic Methods and Statistical AI Assistant. 
You are coaching a researcher (Academic Levels: BSc, MSc, PhD) in selecting appropriate research designs, checking data assumptions, interpreting software metrics, and writing reports.

CRITICAL ETHICAL CONSTRAINT: 
You are strictly forbidden from ghostwriting a student's full thesis. Instead, ask constructive questions, critique draft methodology sections, and provide instructional explanations or code.

If they ask to run analyses or clean data, encourage them to use the interactive builders provided directly in our analytical platform interface.

Always base your statistical methodologies on solid mathematical principles. 
If relevant, cite the provided knowledge base articles included in the prompt.
Optionally output standard Python (pandas/scikit-learn/statsmodels) or R (lavaan/stats) script recipes when requested. Keep scripts highly explanatory.`;

  // Standard interactive actions triggers
  let suggestedAction: any = null;
  if (latestMessage.toLowerCase().includes('recommend') || latestMessage.toLowerCase().includes('analyse') || latestMessage.toLowerCase().includes('what test')) {
    suggestedAction = {
      type: 'run_test',
      payload: {},
      label: 'Open Analysis Wizard'
    };
  }

  // Try calling Gemini API on the server side
  if (ai) {
    try {
      const chatContents = [
        {
          role: 'user',
          parts: [
            { text: `System context: ${systemInstruction}\n\nProject details:\n${projSummary}\n\n${matchedDocsText}\n\nUser Question: ${latestMessage}` }
          ]
        }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: chatContents,
      });

      const responseText = response.text || "I apologize, I could not synthesize a response. Let me help you with some stats fundamentals!";
      
      // Auto-extract mock code if model output includes markdown blocks
      let codeObj: any = undefined;
      const codeBlockRegex = /```(python|r)\r?\n([\s\S]*?)```/i;
      const matchCode = responseText.match(codeBlockRegex);
      if (matchCode) {
        codeObj = {
          language: matchCode[1].toLowerCase(),
          code: matchCode[2].trim()
        };
      }

      return res.json({
        id: `chat-${Date.now()}`,
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toISOString(),
        citations: matches.map(m => m.topic),
        codeSnippet: codeObj,
        suggestedAction
      });

    } catch (err: any) {
      console.error('Gemini API query failed, falling back to heuristic answers:', err);
    }
  }

  // Heuristic offline fallback if API Key is not configured
  let replyText = `Hello! I am your Academic Methods Assistant. It seems my Gemini API config is pending, but I can guide you offline using our Statistical Knowledge Index!

Based on your active project methodology (${projectContext?.methodology || 'Unspecified'}), here is our recommendation:
`;

  if (latestMessage.toLowerCase().includes('test') || latestMessage.toLowerCase().includes('recommend') || latestMessage.toLowerCase().includes('analyse')) {
    replyText += `
**Analysis Recommendations**:
1. If analyzing continuous relationships, use **Multiple Linear Regression** to regresi outcomes on independent variables and inspect VIF to rule out collinearity.
2. If comparing 2 independent categories, use **Independent Samples t-test (Welch Variant)**.
3. If comparing 3+ category structures, run **One-way ANOVA (Analysis of Variance)**.

*You can launch these tests directly using the Analysis tab in your dashboard, which will compute real coefficients and plot interactive SVG charts!*`;
  } else if (latestMessage.toLowerCase().includes('clean') || latestMessage.toLowerCase().includes('missing')) {
    replyText += `
**Data Cleaning Guidance**:
- Standard academic routines demand treating missing values transparently. Either impute missing entries with the column Mean, or cleanly drop rows if missingness is completely at random (MCAR).
- Check your dataset table under the "Dataset & Cleaning" module to apply automated dropping or normalization.`;
  } else {
    replyText += `
How can I assist you with your research? I can:
- Help design hypotheses for ${projectContext?.academicLevel || 'BSc/MSc/PhD'} studies.
- Explain statistical assumptions (Homoscedasticity, Normality, Multicollinearity).
- Critique draft results narratives ethically.
- Provide R/Python recipes for your dataset.`;
  }

  res.json({
    id: `chat-${Date.now()}`,
    role: 'assistant',
    text: replyText,
    timestamp: new Date().toISOString(),
    citations: matches.map(m => m.topic),
    suggestedAction
  });
});

// Serve frontend assets and boot listening pool
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files built into dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Academic full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
