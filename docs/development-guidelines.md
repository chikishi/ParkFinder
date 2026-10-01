# 開発ガイドライン

本書はコーディング規約、命名規則、スタイリング規約、テスト規約、Git 規約を定義する。
ディレクトリ構成とファイル名のルールは `docs/repository-structure.md`、ドメイン用語の英語表記は `docs/glossary.md` に従う。

## 1. コーディング規約

### 1.1 TypeScript

- `tsconfig.json` で `strict: true` を有効にする。あわせて `noUncheckedIndexedAccess: true` も有効にする
- `any` は使わない。型が分からない外部データは `unknown` で受け取り、型ガードで検証してから使う
- 型アサーション（`as`）は原則使わない。使う場合は、安全だと言える理由をコメントに書く
- 非 null アサーション（`!`）は使わない
- オブジェクトの形は `type` で定義する。`interface` は、プロバイダのように「実装されること」を前提とした契約にだけ使う
- `enum` は使わず、文字列リテラルのユニオン型を使う（例：`'surface' | 'multi-storey'`）
- 関数の引数と戻り値には型を明示する。ただし React コンポーネントの戻り値は型推論に任せてよい
- 定数は `as const` で読み取り専用にする
- `export default` は使わず、名前付き export だけを使う

```ts
// 良い例：外部データは unknown で受け取り、型ガードで検証する
function isOverpassElement(value: unknown): value is OverpassElement {
  return typeof value === 'object' && value !== null && 'type' in value && 'id' in value;
}

// 悪い例
const elements = json.elements as OverpassElement[];
```

### 1.2 React

- 関数コンポーネントとフックだけを使う
- props の型はコンポーネントと同じファイルに `{コンポーネント名}Props` として定義する
- 画面コンポーネントは表示に専念する。データの取得・保存はカスタムフックに任せる（`docs/repository-structure.md` 4 章）
- `useEffect` は外部システムとの同期（地図、位置情報、通信）にだけ使う。props から計算できる値は、描画中に計算する
- 通信を伴う `useEffect` では、クリーンアップ関数で `AbortController` の `abort()` を呼ぶ
- リストの `key` にはデータの ID（`ParkingLot.id` など）を使う。配列の添字は使わない
- `dangerouslySetInnerHTML` は使用禁止とする

### 1.3 エラー処理

- プロバイダ層は、失敗したときに `ProviderError` を投げる。`ProviderError` は失敗の種類を `kind` に持つ

| kind | 状況 |
|---|---|
| `network` | 通信できない |
| `timeout` | タイムアウト |
| `rate-limit` | HTTP 429、または混雑による拒否 |
| `invalid-response` | 応答の形式が想定外 |
| `aborted` | 利用者の新しい操作によって中断された |

- フックは失敗の種類（`kind`）だけを返す。利用者に見せるメッセージへの変換は、コンポーネントで `src/components/messages.ts` を使って行う（`docs/functional-design.md` 4.5 節の文言を使う）
  - 文言はコンポーネント層の関心事であり、フックから `components/` を参照すると依存の向きが逆になるため
- `aborted` はエラーとして表示しない
- エラーを握りつぶさない。`catch` した場合は、処理し直すか、上位へ投げ直す

### 1.4 コメント

- コメントは日本語で書く
- 「何をしているか」ではなく「なぜそうしているか」を書く（例：利用ポリシーによる制約、外部 API の癖）
- 他のレイヤーから使われる関数・型には、JSDoc（`/** */`）で概要を書く
- `TODO` を残す場合は、対応する予定の内容を具体的に書く（例：`// TODO: 1km を超える半径に対応する場合はクラスタリングを検討`）

### 1.5 セキュリティ

`docs/architecture.md` 5 章の対策を守る。特に次の点をコードレビューで確認する。

- 外部データや利用者の入力を HTML として解釈させていない
- Leaflet のポップアップやツールチップに HTML 文字列を渡していない（React コンポーネントで描画する）
- URL に埋め込む値を検証・エンコードしている
- 外部 API の応答を型ガードで検証している

## 2. 命名規則

### 2.1 識別子

| 対象 | 形式 | 例 |
|---|---|---|
| 変数・関数 | キャメルケース | `searchCenter`、`calcDistance` |
| React コンポーネント・型 | パスカルケース | `ParkingList`、`ParkingLot` |
| カスタムフック | `use` ＋ パスカルケース | `useParkingSearch` |
| 定数（モジュール直下の固定値） | 大文字スネークケース | `DEFAULT_RADIUS_M`、`CACHE_TTL_MS` |
| 真偽値 | `is` / `has` / `can` で始める | `isLoading`、`hasError` |
| イベントを受け取る props | `on` ＋ 動詞 | `onMapClick`、`onSelect` |
| イベントを処理する関数 | `handle` ＋ 動詞 | `handleMapClick` |
| プロバイダの実装 | 提供元名 ＋ 役割 | `OverpassParkingProvider`、`NominatimGeocodingProvider` |

### 2.2 単位を名前に含める

数値の単位を取り違えないよう、変数名の末尾に単位を付ける。

| 単位 | 接尾辞 | 例 |
|---|---|---|
| メートル | `M` | `radiusM`、`distanceM` |
| ミリ秒 | `Ms` | `timeoutMs` |
| 秒 | `Sec` | `retryAfterSec` |

### 2.3 用語

- ドメイン用語の英語表記は `docs/glossary.md` に従い、同じ概念に別の単語を使わない（例：駐車場は型名 `ParkingLot`、変数名 `parkingLot` / `parkingLots` に統一し、`carPark` や `lot` 単体と混在させない）
- 略語は一般的なもの（`id`、`url`、`api`）だけを使う。単語の途中を省略しない（`dist` ではなく `distance`）

## 3. スタイリング規約

### 3.1 基本方針

- スタイルはすべて Tailwind CSS のユーティリティクラスで書く
- 独自の CSS は `src/index.css` の中の次の用途に限る
  - Tailwind の読み込みとテーマ（色などのデザイントークン）の定義
  - Leaflet 標準の CSS の読み込みと、その上書き
- インラインの `style` 属性は、動的に計算した値（ボトムシートの高さなど）にだけ使う
- 任意値（`w-[123px]` など）は極力避け、テーマで定義した値を使う

### 3.2 デザイントークン

色は用途ごとに名前を付けてテーマに定義し、コンポーネントでは用途名で指定する（例：`bg-primary`）。
具体的な色の値は初回実装時に決め、`src/index.css` だけで管理する。

| トークン | 用途 |
|---|---|
| `primary` | 主要ボタン（ナビ開始など）、選択中のマーカー・項目 |
| `surface` | ボトムシートや検索バーの背景 |
| `muted` | 補足情報の文字色（距離、種別など） |
| `danger` | エラーメッセージ |
| `favorite` | お気に入りの星 |

### 3.3 レスポンシブ・スマホ対応

- **モバイルファーストで書く。** プレフィックスなしのクラスをスマホ向けとし、PC 向けの調整は `md:` 以降で上書きする
- タップできる要素は 44×44px 以上にする（`min-h-11 min-w-11`）
- iPhone の画面下部のホームバーに隠れないよう、画面下端に配置する要素にはセーフエリアの余白（`env(safe-area-inset-bottom)`）を確保する
- 主要な操作は画面の下半分に配置する（`docs/functional-design.md` 5.3 節）

### 3.4 アクセシビリティ

- アイコンだけのボタン（現在地、お気に入り等）には `aria-label` を付ける
- ボタンには `<button>`、リンクには `<a>` を使う。`<div>` にクリック処理を付けない
- 読み込み中とエラーの表示には `role="status"` / `role="alert"` を付ける

## 4. テスト規約

### 4.1 テストの種類と対象

| 種類 | ツール | 主な対象 | 配置場所 |
|---|---|---|---|
| 単体テスト | Vitest | `utils/`、`services/`、`storage/`、`providers/` の変換処理 | `tests/unit/` |
| コンポーネントテスト | Vitest ＋ Testing Library | `components/`、`hooks/` | `tests/unit/` |
| E2E テスト | Playwright | 主要な利用シナリオ（地点検索、現在地検索、お気に入り登録） | `tests/e2e/` |

### 4.2 書き方のルール

- テスト名は日本語で、「〜の場合、〜になる」という形で期待する動作を書く

```ts
describe('parkingSearchService', () => {
  it('結果が距離の昇順に並ぶ', () => { /* ... */ });
  it('access=private の駐車場は除外される', () => { /* ... */ });
});
```

- 1 つのテストでは 1 つの動作だけを検証する
- テストは「準備・実行・検証」の順に書き、空行で区切る
- コンポーネントテストでは、利用者から見える情報（表示されている文字、ロール、ラベル）で要素を取得する。CSS クラスや内部の状態に依存しない
- **テストから実際の外部 API を呼び出さない。** 通信は MSW でモックし、応答データは `tests/fixtures/` に置く
- 位置情報、時刻、localStorage など環境に依存するものは、テストごとにモックして初期化する
- E2E テストは、スマホの画面サイズ（Playwright の iPhone 系の端末設定）で実行する

### 4.3 カバレッジの目標

| 対象 | 行カバレッジの目標 |
|---|---|
| `utils/`、`services/`、`storage/`、`providers/osm/`（地図コンポーネントを除く） | 80% 以上 |
| `components/`、`hooks/` | 目標値は設けない。主要な操作と、エラー表示の分岐をテストする |

### 4.4 必ずテストを書くもの

- 距離計算、フィルタ、並べ替え
- OSM タグから `ParkingLot` への変換（タグの欠落や、想定外の値を含むケース）
- キャッシュの有効期限と、連続リクエストの抑制
- localStorage が壊れているときの初期値への復帰
- ナビ用 URL の生成と、座標の検証

## 5. 品質チェック

### 5.1 npm スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動する |
| `npm run build` | 本番用にビルドする（型チェックを含む） |
| `npm run preview` | ビルド結果をローカルで確認する |
| `npm run lint` | ESLint を実行する |
| `npm run format` | Prettier で整形する |
| `npm run typecheck` | `tsc --noEmit` を実行する |
| `npm run test` | 単体テストを実行する |
| `npm run test:coverage` | カバレッジ付きで単体テストを実行する |
| `npm run test:e2e` | E2E テストを実行する |
| `npm run check` | `lint`・`typecheck`・`test` をまとめて実行する |

### 5.2 実施タイミング

- **コードを変更したら、必ず `npm run check` を実行し、すべて通ることを確認する**（CLAUDE.md の方針）
- 画面の操作に関わる変更をしたら、`npm run test:e2e` も実行する
- CI（GitHub Actions）でもプッシュのたびに同じチェックを実行する。失敗したままマージしない

## 6. Git 規約

### 6.1 ブランチ

| ブランチ | 用途 |
|---|---|
| `main` | 常にデプロイできる状態を保つ。マージすると GitHub Pages に自動デプロイされる |
| `feature/{内容}` | 機能の追加（例：`feature/favorite-memo`） |
| `fix/{内容}` | 不具合の修正（例：`fix/overpass-timeout`） |
| `docs/{内容}` | ドキュメントだけの変更 |
| `chore/{内容}` | 設定、依存関係の更新など |

- ブランチ名は英小文字とハイフンで書く
- 1 つのステアリングディレクトリ（`.steering/[YYYYMMDD]-[開発タイトル]/`）の作業を、1 つのブランチで行うことを基本とする

### 6.2 コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/ja/) の形式を使い、要約は日本語で書く。

```
<type>: <要約>

<本文（任意）：変更の理由や背景>
```

| type | 用途 |
|---|---|
| `feat` | 機能の追加 |
| `fix` | 不具合の修正 |
| `docs` | ドキュメントの変更 |
| `style` | 動作に影響しない整形 |
| `refactor` | 動作を変えないコードの整理 |
| `test` | テストの追加・修正 |
| `chore` | ビルド設定、依存関係の更新など |

例：

```
feat: 地図タップ地点の周辺駐車場を検索する機能を追加
fix: Overpass のタイムアウト時に再試行ボタンが表示されない問題を修正
```

- 1 つのコミットには 1 つの目的の変更だけを含める
- コミットする前に `npm run check` を通す

### 6.3 プルリクエスト

- `main` への変更は、プルリクエストを経由してマージする（個人開発でも、CI の結果を確認するため）
- 説明欄には、対応するステアリングディレクトリへのパスと、変更内容の概要を書く
- CI がすべて成功していることを確認してからマージする
- マージ方法はスカッシュマージとし、マージ後のコミットメッセージも 6.2 節の形式にする

### 6.4 コミットしてはいけないもの

- `.env`、`.env.local` などのローカルの設定ファイル
- API キーなどの秘密情報（将来、Google に切り替える場合も含む）
- ビルド成果物（`dist/`）とテストの出力
