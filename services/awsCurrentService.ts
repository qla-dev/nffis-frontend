import { API_BASE_URL } from './api';

export const AWS_DATASET_UPDATED_EVENT = 'nffis:aws-dataset-updated';

export interface CurrentAwsDataset {
  data: Record<string, unknown>;
  history_id: number;
  source_filename: string;
  updated_at: string;
  uploaded_by?: number;
  uploaded_by_name?: string | null;
}

export async function fetchCurrentAwsDataset(): Promise<CurrentAwsDataset | null> {
  const response = await fetch(`${API_BASE_URL}/aws`, {
    credentials: 'include', headers: { Accept: 'application/json' },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`AWS dataset unavailable (${response.status}).`);
  return await response.json() as CurrentAwsDataset;
}
