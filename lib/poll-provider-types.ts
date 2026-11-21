// Poll Provider Types

// Provider configuration status
export type ProviderStatus = "enabled" | "disabled" | "error" | "unknown";

// Provider type definitions
export type ProviderType = 
  | "user_submitted"       // Poll requests from users
  | "rss_poll"             // RSS/Atom feeds with structured polls
  | "external_api"         // External poll provider APIs
  | "manual_import";       // Admin import forms

// Provider configuration
export interface ProviderConfig {
  id: string;
  type: ProviderType;
  name: string;
  enabled: boolean;
  fetchInterval: number; // minutes
  lastFetch: string | null;
  nextFetch: string | null;
  errorCount: number;
  successCount: number;
  attribution: string;
  settings: Record<string, unknown>;
}

// Poll ingestion result
export interface IngestResult {
  success: boolean;
  pollsImported: number;
  pollsSkipped: number;
  duplicatesDetected: number;
  errors: string[];
  source: string;
  fetchedAt: string;
}

// Provider status summary
export interface ProviderStatusSummary {
  id: string;
  type: ProviderType;
  name: string;
  status: ProviderStatus;
  lastFetch: string | null;
  nextFetch: string | null;
  errorCount: number;
  successCount: number;
}

// Normalized question for duplicate detection
export function normalizePollQuestion(questionHi: string, questionEn: string): string {
  return `${questionHi.trim().toLowerCase().replace(/\s+/g, ' ')} ${questionEn.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}
