interface ImportMetaEnv {
  readonly VITE_NFFIS_API_BACKEND?: 'local' | 'production';
  readonly VITE_NFFIS_API_URL?: string;
  readonly VITE_NFFIS_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
