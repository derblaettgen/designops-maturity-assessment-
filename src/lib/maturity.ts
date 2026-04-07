export type MaturityLevel = 'critical' | 'low' | 'mid' | 'good' | 'excellent';

export function maturityLevelKey(score: number): MaturityLevel {
  if (score < 2) return 'critical';
  if (score < 2.5) return 'low';
  if (score < 3.5) return 'mid';
  if (score < 4.5) return 'good';
  return 'excellent';
}

export function maturityLabel(score: number): string {
  if (score < 2) return 'Ad-hoc';
  if (score < 2.5) return 'Emerging';
  if (score < 3.5) return 'Strukturiert';
  if (score < 4.5) return 'Skaliert';
  return 'Optimiert';
}

export function scoreBadgeClass(score: number): string {
  if (score >= 4) return 'badge-blue';
  if (score >= 3.5) return 'badge-green';
  if (score >= 2.5) return 'badge-yellow';
  if (score >= 2) return 'badge-orange';
  return 'badge-red';
}

export interface GapPriority {
  cssClass: string;
  label: string;
}

export function gapPriorityInfo(gapSize: number): GapPriority {
  if (gapSize >= 2.5) return { cssClass: 'badge-red', label: '🔴 Kritisch' };
  if (gapSize >= 1.5) return { cssClass: 'badge-orange', label: '🟠 Hoch' };
  if (gapSize >= 0.8) return { cssClass: 'badge-yellow', label: '🟡 Mittel' };
  if (gapSize >= 0.3) return { cssClass: 'badge-green', label: '🟢 Niedrig' };
  return { cssClass: 'badge-blue', label: '✅ Gut' };
}
