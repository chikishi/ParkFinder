# ParkFinder

地図上でタップした地点（または現在地・地名検索で選んだ地点）の周辺にある駐車場を、スマホで手早く探せる個人用の Web アプリです。

- 周辺の駐車場を地図のマーカーと距離順の一覧で表示（検索半径 300m / 500m / 1km）
- 駐車場の詳細（種別・料金区分・収容台数など）と、Google マップでのナビ開始
- お気に入り登録とメモ（端末のブラウザ内に保存）
- PWA 対応（スマホのホーム画面に追加して使える）

地図と駐車場データには [OpenStreetMap](https://www.openstreetmap.org/copyright) を使っており、月額 0 円で運用できます。
空き状況と料金は現在のバージョンでは扱いません。

## ドキュメント

| 種類                                   | 場所                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| プロダクト要求・機能設計・技術仕様など | [`docs/`](docs/)                                                                             |
| 作業ごとの要求・設計・タスク           | [`.steering/`](.steering/)                                                                   |
| 開発ルール                             | [`CLAUDE.md`](CLAUDE.md)、[`docs/development-guidelines.md`](docs/development-guidelines.md) |

## 必要なもの

- Node.js 24 系
- npm

## ローカルでの起動

```bash
npm ci
cp .env.example .env   # 必要に応じて値を変更する
npm run dev
```

表示された URL（通常は http://localhost:5173/ ）をブラウザで開きます。

> 現在地の取得（Geolocation API）は HTTPS または localhost でのみ動作します。
> スマホから開発サーバーに接続して確認する場合は、公開後の GitHub Pages で確認してください。

## npm スクリプト

| コマンド                | 内容                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm run dev`           | 開発サーバーを起動する                                                  |
| `npm run build`         | 型チェックのうえ、本番用にビルドする（`dist/`）                         |
| `npm run preview`       | ビルド結果をローカルで確認する                                          |
| `npm run lint`          | ESLint を実行する                                                       |
| `npm run format`        | Prettier で整形する                                                     |
| `npm run typecheck`     | 型チェックを実行する                                                    |
| `npm run test`          | 単体テストを実行する                                                    |
| `npm run test:coverage` | カバレッジ付きで単体テストを実行する（`coverage/`）                     |
| `npm run test:e2e`      | E2E テストを実行する（初回は `npx playwright install chromium` が必要） |
| `npm run check`         | リント・型チェック・単体テストをまとめて実行する                        |

コードを変更したら、`npm run check` がすべて通ることを確認してください。

## 環境変数

`.env` に記載します（`.env.example` を参照）。未設定または不正な値の場合は既定値が使われます。

| 変数                  | 既定値                                    | 内容                                                                          |
| --------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `VITE_PROVIDER`       | `osm`                                     | 地図・駐車場データの提供元（現在は `osm` のみ）                               |
| `VITE_OVERPASS_URL`   | `https://overpass-api.de/api/interpreter` | Overpass API のエンドポイント。混雑時は別の公開インスタンスに変更する         |
| `VITE_NOMINATIM_URL`  | `https://nominatim.openstreetmap.org`     | 地名検索（Nominatim）のエンドポイント                                         |
| `VITE_DEFAULT_CENTER` | `34.393885,131.401059`（萩駅）            | 初回起動時の地図の中心（緯度,経度）                                           |
| `VITE_DEFAULT_ZOOM`   | `15`                                      | 初回起動時のズーム（1〜19）                                                   |
| `VITE_BASE_PATH`      | `/`                                       | 公開 URL のパス。GitHub Pages では `/{リポジトリ名}/`（デプロイ時に自動設定） |

## GitHub Pages での公開

`main` ブランチにプッシュすると、GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルドし、GitHub Pages に公開します。

### 初回のみ必要な設定

1. GitHub にリポジトリを作成し、このリポジトリをプッシュする
   - GitHub の無料プランでは、Pages は**公開リポジトリ**でのみ利用できます
   ```bash
   git remote add origin https://github.com/{ユーザー名}/{リポジトリ名}.git
   git push -u origin main
   ```
2. リポジトリの **Settings > Pages** を開き、**Build and deployment** の **Source** を **GitHub Actions** にする
3. **Actions** タブで「Deploy to GitHub Pages」を実行する（または `main` にプッシュする）
4. 完了すると `https://{ユーザー名}.github.io/{リポジトリ名}/` で公開されます

### 任意：既定値の変更

地図の初期位置などを変えたい場合は、リポジトリの **Settings > Secrets and variables > Actions > Variables** に、
上記の環境変数（`VITE_DEFAULT_CENTER` など）と同じ名前で値を登録してください。次回のデプロイから反映されます。

### スマホのホーム画面に追加する

- **iPhone（Safari）**：共有ボタン → 「ホーム画面に追加」
- **Android（Chrome）**：メニュー → 「ホーム画面に追加」または「アプリをインストール」

## 外部サービスの利用について

本アプリは OpenStreetMap の公開サービスを利用しています。各サービスの利用ポリシーに従い、次のように動作します。

- 地名検索は、検索ボタンを押したときだけ実行します（入力中の自動補完は行いません）
- 外部 API の呼び出しは 1 秒以上の間隔をあけ、同じ条件の検索結果は 10 分間キャッシュします
- 地図タイルや API の応答を、オフライン用に大量に保存することはしません
- 地図上に「© OpenStreetMap contributors」を常に表示します

駐車場データは OpenStreetMap の登録状況に依存するため、実在する駐車場が表示されない場合があります。
