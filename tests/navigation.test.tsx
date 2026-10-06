import { render, screen, within } from '@testing-library/react';
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
  it('renders and invokes allowed report creation, statistics, layer, language, and logout actions', async () => {
    const interaction = userEvent.setup();
    const props = renderNavigation();

    expect(within(document.querySelectorAll('nav')[0] as HTMLElement).queryByText('Reports')).not.toBeInTheDocument();
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

  it('keeps five mobile positions with fire monitoring but no recent reports', async () => {
    const interaction = userEvent.setup();
    const props = renderNavigation({ canViewFireMonitoring: true });
    const mobileNav = document.querySelectorAll('nav')[1];
    expect(mobileNav.children).toHaveLength(5);
    expect(within(mobileNav as HTMLElement).queryByRole('button', { name: 'Reports' })).not.toBeInTheDocument();
    await interaction.click(within(mobileNav as HTMLElement).getByRole('button', { name: 'Fire monitoring' }));
    expect(props.onSetView).toHaveBeenCalledWith('fires');
    expect(props.onSetView).not.toHaveBeenCalledWith('reports');
  });

  it('shows the desktop AWS upload only for authorized roles', () => {
    renderNavigation({ user: authUser({ slug: 'hydrometeorological-institute' }) });
    expect(screen.getByText('Upload AWS data')).toBeInTheDocument();
  });
});
