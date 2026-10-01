interface ImportMetaEnv {
  readonly VITE_PROVIDER?: string;
  readonly VITE_OVERPASS_URL?: string;
  readonly VITE_NOMINATIM_URL?: string;
  readonly VITE_DEFAULT_CENTER?: string;
  readonly VITE_DEFAULT_ZOOM?: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
