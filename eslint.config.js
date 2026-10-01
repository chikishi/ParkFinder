import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// レイヤー間の依存ルール（docs/repository-structure.md 5 章）。
// no-restricted-imports は後に書いた設定が前の設定を上書きする（マージされない）ため、
// ディレクトリごとに適用するパターンの組み合わせをすべて列挙する。
const LEAFLET = {
  regex: '^(leaflet|react-leaflet)(/|$)',
  message: 'Leaflet を import してよいのは src/providers/osm/ だけです。',
};
const OSM_IMPL = {
  regex: '(^@/providers/osm(/|$))|(/providers/osm(/|$))',
  message: '提供元の実装は src/providers/index.ts 経由で利用してください。',
};
const TESTS = {
  regex: '(^|/)tests(/|$)',
  message: 'src/ から tests/ を参照してはいけません。',
};
const REACT = {
  regex: '^react(-dom)?(/|$)',
  message: 'このレイヤーは React に依存してはいけません。',
};
const UPPER_LAYERS = {
  regex: '(^@/|^\\.\\./)(components|contexts|hooks|services|providers|storage)(/|$)',
  message: 'types/ と utils/ から他のレイヤーを参照してはいけません。',
};

const restrict = (files, patterns, ignores = []) => ({
  files,
  ignores,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
});

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'dev-dist', 'test-results', 'playwright-report'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'export default は使わず、名前付き export を使ってください。',
        },
        {
          selector: 'TSEnumDeclaration',
          message: 'enum は使わず、文字列リテラルのユニオン型を使ってください。',
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML は使用禁止です。',
        },
      ],
    },
  },
  restrict(['src/**/*.{ts,tsx}'], [LEAFLET, OSM_IMPL, TESTS]),
  restrict(['src/providers/index.ts'], [LEAFLET, TESTS]),
  restrict(['src/providers/osm/**/*.{ts,tsx}'], [TESTS]),
  restrict(['src/services/**/*.ts', 'src/storage/**/*.ts'], [LEAFLET, OSM_IMPL, TESTS, REACT]),
  restrict(
    ['src/utils/**/*.ts', 'src/types/**/*.ts'],
    [LEAFLET, OSM_IMPL, TESTS, REACT, UPPER_LAYERS],
  ),
  // Context のファイルは Provider コンポーネントと、それを使うフック・生成関数をまとめて export する
  {
    files: ['src/contexts/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  // 設定ファイルは Node.js で実行される。export default は各ツールの規約に従う
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-restricted-syntax': 'off' },
  },
);
