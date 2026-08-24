import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Navigation } from '../components/Navigation';
import { Language, type AppState } from '../types';
import { authUser } from './fixtures/auth';

const baseState: AppState = {
  language: Language.EN,
  activeLayers: new Set(),
  incidents: [],
  view: 'map' as const,
  isReporting: false,
  isDarkMode: true,
};

function renderNavigation(overrides: Partial<React.ComponentProps<typeof Navigation>> = {}) {
  const props: React.ComponentProps<typeof Navigation> = {
    state: baseState,
    onSetView: vi.fn(),
    onSetLang: vi.fn(),
    onOpenReport: vi.fn(),
    onOpenLayers: vi.fn(),
    isLayersOpen: false,
    user: authUser(),
    canViewReports: true,
    canCreateReports: true,
    canViewLayers: true,
    onLogout: vi.fn(),
    ...overrides,
  };
  render(<Navigation {...props} />);
  return props;
}

describe('role-aware navigation', () => {
  it('renders and invokes allowed report, statistics, layer, language, and logout actions', async () => {
    const interaction = userEvent.setup();
    const props = renderNavigation();

    expect(screen.getAllByText('Reports').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Statistics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Layers').length).toBeGreaterThan(0);
    await interaction.click(screen.getByTitle('Report Incident'));
    expect(props.onOpenReport).toHaveBeenCalledOnce();
    await interaction.click(screen.getByTitle('Sign out tester'));
    expect(props.onLogout).toHaveBeenCalledOnce();
  });

  it('removes forbidden commands for a view-only role', () => {
    renderNavigation({ canViewReports: false, canCreateReports: false, canViewLayers: true });
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();
    expect(screen.queryByText('Statistics')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Report Incident')).not.toBeInTheDocument();
    expect(screen.getAllByText('Layers').length).toBeGreaterThan(0);
  });

  it('removes layer controls when the module is forbidden', () => {
    renderNavigation({ canViewLayers: false });
    expect(screen.queryByText('Layers')).not.toBeInTheDocument();
  });
});
