import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AwsUploadPanel } from '../components/AwsUploadPanel';

describe('AWS upload drop zone', () => {
  it('uses one clickable drop zone without a visible file chooser', async () => {
    const user = userEvent.setup();
    render(<AwsUploadPanel onClose={() => {}} />);
    const input = screen.getByLabelText('AWS JSON, CSV or DAT file') as HTMLInputElement;
    const label = input.closest('label');
    expect(label).toHaveAttribute('for', input.id);
    expect(input).toHaveClass('sr-only');
    expect(screen.queryByText('Choose File')).not.toBeInTheDocument();

    const file = new File(['source,station_type,station,observed_at,tempC\nfbih,meteo,Stolac,2024-11-19T10:00:00+01:00,11.38'], 'stolac.csv', { type: 'text/csv' });
    await user.upload(input, file);
    await waitFor(() => expect(screen.getByText(/1 entries/)).toBeInTheDocument());

    fireEvent.drop(label!, { dataTransfer: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/stolac.csv/)).toBeInTheDocument());
  });
});
