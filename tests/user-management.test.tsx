import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Language } from '../types';
import UserManagement from '../components/Admin/UserManagement';
import * as service from '../services/userAdminService';

const roles = [{ id: 1, name: 'Super Admin', slug: 'super-admin', level: 1 }, { id: 7, name: 'Civil Protection', slug: 'civil-protection', level: 7 }];
const users = [
  { id: 1, name: 'Admin', username: 'admin', email: 'admin@test.local', role_id: 1, disabled_at: null, created_at: '' },
  { id: 2, name: 'Dispatcher', username: 'dispatcher', email: 'd@test.local', role_id: 7, disabled_at: null, created_at: '' },
];

describe('UserManagement', () => {
  it('lists users and disables another account but never the current one', async () => {
    vi.spyOn(service, 'listUsers').mockResolvedValue({ data: users, total: 2, roles });
    const disable = vi.spyOn(service, 'setUserDisabled').mockResolvedValue({ data: { ...users[1], disabled_at: '2026-10-20T00:00:00Z' } });

    render(<UserManagement language={Language.EN} isDarkMode={false} currentUserId={1} canCreate canUpdate />);

    const dispatcherRow = (await screen.findByText('dispatcher')).closest('tr')!;
    const adminRow = screen.getByText('admin@test.local').closest('tr')!;
    expect(within(adminRow).queryByRole('button', { name: /Disable/ })).toBeNull();
    expect(within(adminRow).getByRole('combobox')).toBeDisabled();

    await userEvent.click(within(dispatcherRow).getByRole('button', { name: /Disable/ }));
    await waitFor(() => expect(disable).toHaveBeenCalledWith(2, true));
  });

  it('creates an account with the selected role', async () => {
    vi.spyOn(service, 'listUsers').mockResolvedValue({ data: users, total: 2, roles });
    const create = vi.spyOn(service, 'createUser').mockResolvedValue({ data: users[1] });

    render(<UserManagement language={Language.BS} isDarkMode currentUserId={1} canCreate canUpdate />);
    await userEvent.click(await screen.findByRole('button', { name: /Novi korisnik/ }));
    await userEvent.type(document.querySelector('input[name=name]')!, 'Operater');
    await userEvent.type(document.querySelector('input[name=username]')!, 'operater');
    await userEvent.type(document.querySelector('input[name=email]')!, 'o@test.local');
    await userEvent.selectOptions(document.querySelector('select[name=role_id]')!, '7');
    await userEvent.type(document.querySelector('input[name=password]')!, 'Lozinka2026xyz');
    await userEvent.click(screen.getByRole('button', { name: /Kreiraj nalog/ }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Operater', username: 'operater', email: 'o@test.local', role_id: 7, password: 'Lozinka2026xyz' }));
  });
});
