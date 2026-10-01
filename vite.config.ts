import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

function toOrigin(url: string | undefined, fallback: string): string {
  try {
    return new URL(url || fallback).origin;
  } catch {
    return new URL(fallback).origin;
  }
}

/**
 * 本番ビルドの index.html にだけ CSP の meta タグを挿入する。
 * 開発サーバーは即時反映の仕組みがインラインスクリプトを使うため対象外とする。
 * GitHub Pages ではレスポンスヘッダーを設定できないため、meta タグで指定する。
 */
function contentSecurityPolicy(env: Record<string, string>): Plugin {
  const connectOrigins = [
    toOrigin(env.VITE_OVERPASS_URL, DEFAULT_OVERPASS_URL),
    toOrigin(env.VITE_NOMINATIM_URL, DEFAULT_NOMINATIM_URL),
  ];
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    // Leaflet が地図要素の位置を style 属性で設定するため 'unsafe-inline' が必要
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://tile.openstreetmap.org",
    `connect-src 'self' ${connectOrigins.join(' ')}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  return {
    name: 'parkfinder:csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_BASE_PATH || '/';

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // CSP でインラインスクリプトを禁止しているため、登録処理は外部ファイルとして読み込む
        injectRegister: 'script',
        includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
        manifest: {
          name: 'ParkFinder',
          short_name: 'ParkFinder',
          description: '地図上で指定した地点の周辺にある駐車場を探せるツール',
          lang: 'ja',
          display: 'standalone',
          start_url: base,
          scope: base,
          theme_color: '#1d4ed8',
          background_color: '#ffffff',
          icons: [
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // アプリ本体だけをキャッシュする。地図タイルと API の応答は OSM の利用ポリシーに配慮してキャッシュしない
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: 'index.html',
        },
      }),
      contentSecurityPolicy(env),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      setupFiles: ['tests/setup.ts'],
      // ファイル読み込みが遅い環境（WSL から Windows 側のドライブを使う場合など）で、
      // 多数のワーカーが同時に起動して起動待ちがタイムアウトしないよう、同時実行数を抑える
      maxWorkers: 3,
      // jsdom は起動に時間がかかるため、DOM やブラウザの API が必要なテストだけで使う
      projects: [
        {
          extends: true,
          test: {
            name: 'node',
            environment: 'node',
            include: ['tests/unit/**/*.test.ts'],
            exclude: ['tests/unit/hooks/**', 'tests/unit/storage/**'],
          },
        },
        {
          extends: true,
          test: {
            name: 'dom',
            environment: 'jsdom',
            // ファイルごとに jsdom を作り直すと非常に遅いため、同じワーカー内で使い回す。
            // テスト間の状態は tests/setup.ts の afterEach で初期化する
            isolate: false,
            include: [
              'tests/unit/**/*.test.tsx',
              'tests/unit/hooks/**/*.test.ts',
              'tests/unit/storage/**/*.test.ts',
            ],
          },
        },
      ],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/**/*.d.ts'],
        reporter: ['text', 'html'],
        // ロジック部分の行カバレッジ 80% 以上を目標とする（docs/development-guidelines.md 4.3 節）。
        // 地図コンポーネント（LeafletMapView.tsx）は jsdom で描画できないため E2E テストで確認する
        thresholds: {
          'src/utils/**': { lines: 80 },
          'src/services/**': { lines: 80 },
          'src/storage/**': { lines: 80 },
          'src/providers/osm/**/*.ts': { lines: 80 },
        },
      },
    },
  };
});
