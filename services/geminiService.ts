
import { apiRequest } from './api';

interface IncidentUrgencyResult {
  urgency: 'low' | 'medium' | 'high';
  reason: string;
}

interface ForestRiskResult {
  riskLevel: number;
  summary: string;
}

export async function analyzeIncidentUrgency(
  description: string,
  type: string,
): Promise<IncidentUrgencyResult> {
  try {
    return await apiRequest<IncidentUrgencyResult>('/ai/incident-urgency', {
      method: 'POST',
      body: JSON.stringify({ description, type }),
    });
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    return { urgency: 'medium', reason: 'Automated fallback due to API error' };
  }
}

export async function getForestRiskAssessment(regionName: string): Promise<ForestRiskResult> {
  try {
    return await apiRequest<ForestRiskResult>('/ai/forest-risk', {
      method: 'POST',
      body: JSON.stringify({ region: regionName }),
    });
  } catch {
    return { riskLevel: 0.5, summary: 'Standard seasonal monitoring required.' };
  }
}
