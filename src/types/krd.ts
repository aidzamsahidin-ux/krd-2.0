export type InteractionMode = 'learn' | 'guided' | 'speed';

export type WorkspaceTab = 'wheel' | 'records' | 'lcd' | 'synergy';

export interface Student {
  name: string;
  kls: string;
}

export interface AssessmentRecord {
  id?: string;
  name: string;
  kls: string;
  sifir: number;
  score: number; // out of 10 (or 80 for full paper sheet)
  maxScore?: number;
  time: number; // in seconds
  date: string;
  mode?: 'guided' | 'speed' | 'paper' | 'manual';
}

export interface SifirDiagnosticStat {
  sifir: number;
  attempts: number;
  bestScore: number;
  bestTime: number | null;
  saErrors: number;
  puluhErrors: number;
  weakMultipliers: number[]; // e.g. [6, 7, 8]
  badge: 'none' | 'bronze' | 'silver' | 'gold';
}

export type MasteryStore = Record<string, Record<number, {
  saErrors: number;
  puluhErrors: number;
  weakMultipliers: Record<number, number>;
}>>;

export interface StudentMasterySummary {
  studentKey: string;
  sifirStats: Record<number, SifirDiagnosticStat>;
  masteredCount: number; // count of silver or gold badges (1..9)
  goldCount: number;
  tahapPenguasaan: 1 | 2 | 3 | 4 | 5 | 6;
  tpLabel: string;
  recommendedSifir: number;
  recommendationReason: string;
}

export interface KRDActionRule {
  sifir: number;
  val: number;
  type: 'plus' | 'minus' | 'both';
  display: string;
  description: string;
}

export interface KRDStepAnalysis {
  sifir: number;
  multiplier: number;
  prevMultiplier: number;
  prevResult: number;
  currResult: number;
  prevSa: number;
  currSa: number;
  prevPuluh: number;
  currPuluh: number;
  action: KRDActionRule;
  isSaDecreasing: boolean;
  puluhDelta: 0 | 1;
  puluhRuleCode: 'A' | 'B';
  puluhRuleTitle: string;
  puluhRuleExplanation: string;
  saWrapExplanation: string;
  saCycleSteps: number[];
}

export interface SynergyScanPayload {
  name: string;
  kls: string;
  sifir: number;
  score: number;
  maxScore: number;
  timeSec?: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  kls: string;
  sifir: number;
  score: number;
  maxScore: number;
  timeStr: string;
  timestamp: number;
}
