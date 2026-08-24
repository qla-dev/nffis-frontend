import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('../services/api', () => ({ apiRequest }));

import { analyzeIncidentUrgency, getForestRiskAssessment } from '../services/geminiService';

describe('AI assessment service', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

  it('requests incident urgency and forest risk from backend AI routes', async () => {
    apiRequest
      .mockResolvedValueOnce({ urgency: 'high', reason: 'Rapid spread' })
      .mockResolvedValueOnce({ riskLevel: 0.84, summary: 'Dry and windy' });

    await expect(analyzeIncidentUrgency('Large flames', 'fire')).resolves.toEqual({ urgency: 'high', reason: 'Rapid spread' });
    await expect(getForestRiskAssessment('Herzegovina')).resolves.toEqual({ riskLevel: 0.84, summary: 'Dry and windy' });
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/ai/incident-urgency', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ description: 'Large flames', type: 'fire' }),
    }));
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/ai/forest-risk', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ region: 'Herzegovina' }),
    }));
  });

  it('returns deterministic fallbacks when AI is unavailable', async () => {
    apiRequest.mockRejectedValue(new Error('offline'));
    await expect(analyzeIncidentUrgency('Smoke', 'fire')).resolves.toEqual({
      urgency: 'medium', reason: 'Automated fallback due to API error',
    });
    await expect(getForestRiskAssessment('BiH')).resolves.toEqual({
      riskLevel: 0.5, summary: 'Standard seasonal monitoring required.',
    });
  });
});
