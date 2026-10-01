# タスクリスト：初回実装

`design.md` 1.1 節の順序で進める。
各フェーズの終わりに `npm run check` を実行し、すべて通ることを確認してから次のフェーズに進む（フェーズ 1 の完了以降）。

**進捗の記号：** `[ ]` 未着手 / `[~]` 作業中 / `[x]` 完了

## フェーズ 1：環境構築

- [x] 1-1. Vite ＋ React ＋ TypeScript のプロジェクトを作成する（`strict`、`noUncheckedIndexedAccess`、パスエイリアス `@/`）
- [x] 1-2. Tailwind CSS を導入し、`src/index.css` にデザイントークン（`primary`・`surface`・`muted`・`danger`・`favorite`）を定義する
- [x] 1-3. ESLint を設定する（typescript-eslint、react-hooks、`no-restricted-imports` による依存ルール）
- [x] 1-4. Prettier を設定する（prettier-plugin-tailwindcss）
- [x] 1-5. Vitest ＋ Testing Library ＋ jsdom ＋ MSW を設定する（`tests/setup.ts`、`tests/unit/` だけを対象にする）
- [x] 1-6. Playwright を設定する（`tests/e2e/` を対象、`vite preview` を起動して実行、iPhone 13 の端末設定）
- [x] 1-7. npm スクリプトを定義する（`docs/development-guidelines.md` 5.1 節の一覧）
- [x] 1-8. `.env.example`、`.gitignore`、`src/config.ts`（環境変数の読み込みと既定値）を作成する

**完了条件：** `npm run dev` で空の画面が表示され、`npm run check` と `npm run build` が成功する。試しに `src/services/` から `react` を import すると ESLint がエラーを出す。

## フェーズ 2：型・utils

- [x] 2-1. `src/types/domain.ts` に共通の型を定義する（`LatLng`、`ParkingLot`、`ParkingSearchResult`、`Favorite`、`GeocodeResult`、`AppSettings`）
- [x] 2-2. `src/utils/distance.ts`：ハーバーサイン式による距離計算と、そのテスト
- [x] 2-3. `src/utils/validation.ts`：座標・半径・入力文字列の検証と、そのテスト
- [x] 2-4. `src/utils/navigation.ts`：ナビ用 URL の生成と、そのテスト

**完了条件：** 各関数のテストが成功し、境界値（緯度・経度の範囲外、空文字、上限文字数）を検証している。

## フェーズ 3：プロバイダ層

- [x] 3-1. `src/providers/types.ts`：`ParkingProvider`・`GeocodingProvider`・`MapViewProps`・`ProviderError` を定義する
- [x] 3-2. `tests/fixtures/` に Overpass と Nominatim の応答例を用意する（正常、0 件、不正な要素を含むもの）
- [x] 3-3. `tests/mocks/handlers.ts` に MSW のハンドラを作成する
- [x] 3-4. `src/providers/osm/overpassMapper.ts`：OSM タグから `ParkingLot` への変換と、そのテスト
- [x] 3-5. `src/providers/osm/overpassParkingProvider.ts`：クエリの生成、通信、エラー変換、タイムアウトと、そのテスト
- [x] 3-6. `src/providers/osm/nominatimGeocodingProvider.ts`：地名検索と、そのテスト
- [x] 3-7. `src/providers/index.ts`：提供元を選ぶファクトリ

**完了条件：** プロバイダのテストで、正常な応答・0 件・不正な要素・HTTP 429・タイムアウト・中断の各ケースが検証されている。

## フェーズ 4：サービス層

- [x] 4-1. `src/services/searchCache.ts`：有効期間と件数上限のあるキャッシュと、そのテスト
- [x] 4-2. `src/services/requestThrottle.ts`：呼び出し間隔の制御（中断への対応を含む）と、そのテスト
- [x] 4-3. `src/services/parkingSearchService.ts`：検索、フィルタ、距離計算、並べ替えと、そのテスト

**完了条件：** `access=private` の除外、距離順の並べ替え、キャッシュの利用と期限切れ、1 秒の間隔制御がテストで検証されている。

## フェーズ 5：ストレージ

- [x] 5-1. `src/storage/storage.ts`：`readJson`・`writeJson` の共通関数と、そのテスト（壊れた JSON、書き込みの失敗を含む）
- [x] 5-2. `src/storage/favoritesStorage.ts` と、そのテスト
- [x] 5-3. `src/storage/settingsStorage.ts` と、そのテスト

**完了条件：** localStorage のデータが壊れていても、初期値が返り、例外が発生しない。

## フェーズ 6：フック・Context

- [x] 6-1. `src/contexts/ServicesContext.tsx`：サービスとプロバイダを提供する Context
- [x] 6-2. `src/hooks/useParkingSearch.ts` と、そのテスト
- [x] 6-3. `src/hooks/useGeocoding.ts` と、そのテスト
- [x] 6-4. `src/hooks/useGeolocation.ts` と、そのテスト（拒否・タイムアウトを含む）
- [x] 6-5. `src/hooks/useFavorites.ts` と、そのテスト
- [x] 6-6. `src/hooks/useSettings.ts` と、そのテスト
- [x] 6-7. `src/hooks/useOnlineStatus.ts` と、そのテスト

**完了条件：** 各フックの状態遷移（読み込み中 → 成功 / 失敗）と、新しい検索による前の検索の中断がテストで検証されている。

## フェーズ 7：地図

- [x] 7-1. `src/providers/osm/LeafletMapView.tsx`：地図の表示、帰属表示、タップの通知
- [x] 7-2. 中心マーカー、検索範囲の円、駐車場マーカー（`CircleMarker`）、選択中の強調表示
- [x] 7-3. `center` の props の変化による地図の移動（利用者の操作による移動とは区別する）

**完了条件：** 開発サーバーで萩駅を中心に地図が表示され、タップした位置が通知される。

## フェーズ 8：画面

### 8-A. 一覧表示まで
- [x] 8-1. `src/components/messages.ts`：画面の文言の定数
- [x] 8-2. `App.tsx`：全体のレイアウトと状態管理、`MapView` の遅延読み込み
- [x] 8-3. `BottomSheet.tsx`：3 段階の開閉（ドラッグとタップ）、地図との操作の分離
- [x] 8-4. `RadiusSelector.tsx`
- [x] 8-5. `ParkingList.tsx`・`ParkingListItem.tsx`（地図のマーカーとの選択の同期を含む）
- [x] 8-6. `ErrorMessage.tsx`（再試行、範囲を広げる、オフラインの表示）
- [x] 8-7. `LocateButton.tsx`

### 8-B. 詳細・ナビ
- [x] 8-8. `ParkingDetail.tsx`
- [x] 8-9. `NavigateButton.tsx`

### 8-C. 地名検索
- [x] 8-10. `SearchBar.tsx`（検索ボタンを押したときだけ検索、候補の表示と選択）

### 8-D. お気に入り・メモ
- [x] 8-11. `FavoriteToggle.tsx`
- [x] 8-12. `MemoEditor.tsx`（フォーカスが外れたときに保存、500 文字の上限）
- [x] 8-13. `FavoriteList.tsx`

### 8-E. 仕上げ
- [x] 8-14. 各コンポーネントのテスト（主要な操作とエラー表示）
- [x] 8-15. スマホの画面サイズでの表示確認（セーフエリア、タップ領域 44px 以上、`aria-label`）

**完了条件：** 開発サーバーで、F-01〜F-10 のすべての機能を手動で操作できる。

## フェーズ 9：PWA・CSP

- [x] 9-1. `public/icon.svg` を作成し、PNG アイコンを生成する
- [x] 9-2. `vite-plugin-pwa` の設定（マニフェスト、アプリ本体だけのキャッシュ、`VITE_BASE_PATH` への対応）
- [x] 9-3. 本番ビルドにだけ CSP の meta タグを挿入する Vite プラグイン

**完了条件：** `npm run build` → `npm run preview` の状態で、コンソールに CSP 違反が出ず、ブラウザの開発者ツールで PWA としてインストールできると判定される。

## フェーズ 10：E2E テスト

- [x] 10-1. 外部通信の差し替え（Overpass、Nominatim、地図タイル）の共通処理
- [x] 10-2. シナリオ 1：地図をタップすると周辺の駐車場が表示される
- [x] 10-3. シナリオ 2：検索半径の変更で再検索される
- [x] 10-4. シナリオ 3：詳細が表示され、ナビのリンクに正しい座標が入っている
- [x] 10-5. シナリオ 4：現在地の周辺が検索される
- [x] 10-6. シナリオ 5：地名検索で候補を選ぶと周辺が検索される
- [x] 10-7. シナリオ 6：お気に入りとメモが再読み込み後も残る

**完了条件：** `npm run test:e2e` がすべて成功する。

## フェーズ 11：CI/CD・ドキュメント

- [x] 11-1. `.github/workflows/ci.yml`
- [x] 11-2. `.github/workflows/deploy.yml`
- [x] 11-3. `README.md`：概要、起動方法、npm スクリプト、環境変数、GitHub Pages の公開手順
- [x] 11-4. `docs/repository-structure.md` に、新規追加したファイル（`useOnlineStatus.ts`、`messages.ts`、`contexts/`）を追記する

**完了条件：** README の手順だけで、第三者がローカルで起動できる内容になっている。

## フェーズ 12：品質チェック・公開

- [x] 12-1. `npm run check` と `npm run test:e2e` がすべて成功する
- [x] 12-2. `npm run test:coverage` で、ロジック部分の行カバレッジが 80% 以上
- [x] 12-3. ビルド結果で、初回に読み込む JavaScript が gzip 圧縮後 200KB 以下
- [ ] 12-4. **（開発者本人）** GitHub リポジトリを作成し、Pages を有効にする
- [ ] 12-5. GitHub Actions でデプロイし、HTTPS で公開されたことを確認する
- [ ] 12-6. **（開発者本人）** スマホでの実機確認（ホーム画面への追加、現在地検索、よく行く目的地での表示）
- [~] 12-7. `requirements.md` 6 章の判断事項（OSM データの網羅性、Overpass の応答速度）を評価して記録する

**完了条件：** `requirements.md` 4 章の受け入れ条件をすべて満たしている。

## 作業メモ

（実装中の判断や、設計から変更した点をここに記録する）

### 設計から変更した点

| 項目 | 設計 | 実装 | 理由 |
|---|---|---|---|
| TypeScript のバージョン | 最新の安定版 | 6.0 系 | typescript-eslint の対応範囲が 6.1 未満のため（7.0 系は未対応） |
| エラー文言への変換 | フック層で変換（development-guidelines 1.3 節） | フックは `ProviderErrorKind` を返し、コンポーネントが `messages.ts` で変換 | `messages.ts` は `components/` にあり、フックから参照すると依存の向き（components → hooks）が逆になるため |
| タイムアウトの実装 | `AbortSignal.any()` で合成 | `AbortController` とタイマーで実装（`src/providers/fetchJson.ts`） | 対応ブラウザ・テスト環境の差を避け、中断とタイムアウトを確実に区別するため |
| `AppSettings` の形 | `lastLat`・`lastLng` | `lastCenter: LatLng` | 他の座標と同じ型で扱うため |
| ボトムシートの開閉 | CSS の `transform` | `height` の変更 | 中身のスクロール領域を開き具合に合わせるため。アニメーションは 200ms と短く、性能上の問題は見られない |
| 表示用の関数 | 記載なし | `src/utils/parkingDisplay.ts` を追加 | 名称不明の表示・種別・料金の日本語表記を、フックとコンポーネントの両方で使うため |
| アイコン | 記載なし | `src/components/icons.tsx` を追加 | SVG アイコンを 1 か所にまとめるため |
| 共通の通信処理 | 記載なし | `src/providers/fetchJson.ts` を追加 | Overpass と Nominatim でタイムアウト・エラー変換を共通化するため |
| テスト用の補助 | 記載なし | `tests/helpers/` を追加 | モックのサービスで描画する処理を共通化するため |
| Vitest の実行環境 | jsdom | DOM が不要なテストは node、必要なテストは jsdom（`vite.config.ts` の `projects`） | jsdom の起動が遅く、テスト時間が長くなるため |

### 実装中に気づいた点

- react-leaflet では、`pathOptions` で渡した `className` がマーカー作成時に反映されない。`className` はコンポーネントに直接渡す（`LeafletMapView.tsx` にコメントあり）
- 開発環境のリポジトリが Windows 側のドライブ（9p 経由）にあり、ファイル読み込みが非常に遅い。Vitest のワーカー起動が 90 秒でタイムアウトすることがあったため、`maxWorkers: 3` に制限した

### 品質チェックの結果（2026-09-30）

| 項目 | 結果 |
|---|---|
| `npm run check` | 成功（リント・型チェック・単体テスト 170 件） |
| `npm run test:e2e` | 成功（8 件：必須シナリオ 6 件＋エラー時・0 件時） |
| 行カバレッジ（ロジック部分） | `utils/` 100%、`services/` 98.3%、`storage/` 90.9%、`providers/osm/`（地図を除く）94〜100%。`vite.config.ts` に閾値 80% を設定済み |
| 初回に読み込む JavaScript | gzip 圧縮後 79.7KB（Leaflet は遅延読み込みの別ファイルで 45.7KB） |
| PWA | Chromium の判定でインストール可能（installabilityErrors なし）。Service Worker の有効化を確認 |
| CSP | 本番ビルドでコンソールに違反なし |

### 12-7 の予備評価（公開前・開発環境から実施）

萩駅周辺（半径 500m）を実際の公開 Overpass API に問い合わせたところ、すべて失敗した。

| エンドポイント | 結果 |
|---|---|
| overpass-api.de | HTTP 504（9.0 秒）、20 秒後の再試行も HTTP 504（14.3 秒） |
| overpass.private.coffee | 30 秒でタイムアウト |
| overpass.kumi.systems | 30 秒でタイムアウト |

- 同じ環境から Nominatim には接続できたため、Overpass 側の混雑と考えられる
- アプリは「サーバーが混雑しています」と再試行ボタンを表示するため、停止はしない
- 公開 Overpass の混雑が常態化している場合、`requirements.md` 6 章の「応答速度 3 秒以内」を満たせない。公開後に時間帯を変えて実機で評価し、改善しなければ Google への切り替え（F-12）を次の作業の候補にする
- OSM データの網羅性は、Overpass から応答が得られなかったため未評価
