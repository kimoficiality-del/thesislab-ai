/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AcademicLevel = 'BSc' | 'MSc' | 'PhD';

export type MethodologyType = 'Quantitative' | 'Qualitative' | 'Mixed-Methods';

export type VariableType = 'numeric' | 'categorical' | 'datetime' | 'text';

export interface VariableSchema {
  name: string;
  type: VariableType;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  sampleValues: string[];
}

export interface DatasetVersion {
  id: string;
  name: string;
  timestamp: string;
  description: string;
  rowCount: number;
  columnCount: number;
}

export interface Dataset {
  id: string;
  name: string;
  headers: string[];
  originalRows: Record<string, string | number | null>[];
  rows: Record<string, string | number | null>[]; // Currently active rows
  variables: VariableSchema[];
  versions: DatasetVersion[];
}

export interface Hypothesis {
  id: string;
  statement: string;
  nullHypothesis: string;
  alternativeHypothesis: string;
  testUsed?: string;
  pvalue?: number;
  result?: 'Supported' | 'Rejected' | 'Inconclusive';
}

export interface CommentAnnotation {
  id: string;
  author: string;
  role: 'student' | 'supervisor' | 'admin';
  text: string;
  timestamp: string;
  sectionLink?: string; // e.g. "Methodology", "Results"
}

export interface Project {
  id: string;
  title: string;
  discipline: string;
  academicLevel: AcademicLevel;
  methodology: MethodologyType;
  researchQuestions: string[];
  hypotheses: Hypothesis[];
  dataset: Dataset | null;
  comments: CommentAnnotation[];
  createdAt: string;
  updatedAt: string;
  reportDraft?: AcademicReport;
}

export interface AcademicReport {
  id: string;
  title: string;
  citationStyle: 'APA' | 'MLA' | 'Chicago';
  sections: {
    introduction: string;
    methodology: string;
    resultsAndAnalysis: string;
    discussionAndLimitations: string;
    references: string;
  };
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  codeSnippet?: {
    language: 'python' | 'r';
    code: string;
  };
  citations?: string[];
  suggestedAction?: {
    type: 'run_test' | 'clean_data' | 'view_report';
    payload: any;
    label: string;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  cpuUsage: number;
  ramUsage: number;
  activeJobs: number;
  storageQuotaUsed: string;
}
