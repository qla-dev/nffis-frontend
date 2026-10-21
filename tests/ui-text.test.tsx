import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Language } from '../types';
import { setUiLanguage, tr } from '../lib/i18n/uiText';
import { ResponseReadinessPanel } from '../components/FireMonitoring/ResponseReadinessPanel';

afterEach(() => setUiLanguage(Language.EN));

describe('tr', () => {
  it('translates known English literals to Bosnian and falls back otherwise', () => {
    expect(tr('Active events')).toBe('Active events');
    setUiLanguage(Language.BS);
    expect(tr('Active events')).toBe('Aktivni događaji');
    expect(tr('Not in the dictionary')).toBe('Not in the dictionary');
    setUiLanguage(Language.JA);
    expect(tr('Active events')).toBe('Active events');
  });

  it('renders fire-monitoring panels in Bosnian when the UI language is BS', () => {
    setUiLanguage(Language.BS);
    render(<ResponseReadinessPanel eventId={1} canManage={false} />);
    expect(screen.getByText(/Priprema pregleda spremnosti za odgovor/)).toBeInTheDocument();
  });
});
