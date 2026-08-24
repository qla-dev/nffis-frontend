import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { authUser } from './fixtures/auth';

const { login } = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ login }));

import { SessionLoginGate } from '../components/Auth/SessionLoginGate';

describe('SessionLoginGate', () => {
  it('shows session checking state and disappears for authenticated users', () => {
    const { rerender } = render(<SessionLoginGate user={null} checking onAuthenticated={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Checking session' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();

    rerender(<SessionLoginGate user={authUser()} checking={false} onAuthenticated={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submits credentials, clears the password, and returns the user', async () => {
    const user = authUser({ slug: 'super-admin', name: 'Super Admin', level: 1 });
    const onAuthenticated = vi.fn();
    login.mockResolvedValue(user);
    const interaction = userEvent.setup();
    render(<SessionLoginGate user={null} checking={false} onAuthenticated={onAuthenticated} />);

    await interaction.type(screen.getByLabelText('Username or e-mail'), 'qla.dev');
    await interaction.type(screen.getByLabelText('Password'), 'password123');
    await interaction.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('qla.dev', 'password123'));
    expect(onAuthenticated).toHaveBeenCalledWith(user);
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('shows login errors and clears a rejected password', async () => {
    login.mockRejectedValue(new Error('Invalid credentials.'));
    const interaction = userEvent.setup();
    render(<SessionLoginGate user={null} checking={false} onAuthenticated={vi.fn()} />);
    await interaction.type(screen.getByLabelText('Username or e-mail'), 'bad');
    await interaction.type(screen.getByLabelText('Password'), 'bad');
    await interaction.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });
});
