# タスクリスト：駐車場検索で結果が得られない不具合の修正

`design.md` の方針に沿って進める。
各フェーズの終わりに `npm run check` を実行し、すべて通ることを確認してから次のフェーズに進む。

**進捗の記号：** `[ ]` 未着手 / `[~]` 作業中 / `[x]` 完了

## フェーズ 1：タイムアウトの整合（design.md 2.1）

- [x] 1-1. `overpassParkingProvider.ts` に `QUERY_TIMEOUT_S = 20` と `TIMEOUT_MS`（サーバーの上限＋5 秒）を定義し、`buildOverpassQuery` の `[timeout:N]` に使う
- [x] 1-2. テストを追加する：`TIMEOUT_MS > QUERY_TIMEOUT_S * 1000`、クエリに `[timeout:20]` が入る
- [x] 1-3. 既存の「15 秒以内に応答が無い場合」のテストを、`TIMEOUT_MS` を使う形に直す

**完了条件：** クエリのタイムアウトとアプリのタイムアウトが 1 つの定数から決まり、テストで関係を確かめている。

## フェーズ 2：混雑時のステータスの扱い（design.md 2.3）

- [x] 2-1. `fetchJson.ts` で 502・503 を `rate-limit` として扱う（コメントも更新する）
- [x] 2-2. 既存のステータスのテスト（`it.each([429, 504])`）を 429・502・503・504 に広げ、406 が `network` になるテストを追加する

**完了条件：** 429・502・503・504 が `rate-limit`、406 が `network` になることをテストで確かめている。

## フェーズ 3：複数の検索先への対応（design.md 2.2、2.4）

- [x] 3-1. `config.ts`：`overpassUrl` を `overpassUrls: string[]` に変え、カンマ区切りを解析する（前後の空白の除去、不正な URL の除外、重複の除去、最大 3 件、全部不正なら既定値）
- [x] 3-2. `config.test.ts` に 3-1 のテストを追加し、既存のテストを `overpassUrls` に合わせる
- [x] 3-3. `OverpassParkingProvider`：URL の配列を受け取り、`rate-limit`・`network` のときだけ次の検索先を試す。`timeout`・`aborted`・`invalid-response` のときと、すべて失敗したときは、そのエラーを投げる
- [x] 3-4. 3-3 のテストを追加する（1 か所目が 504・502・406 のときに 2 か所目の結果を返す、timeout・aborted・invalid-response のときは 2 か所目を試さない、全部失敗したら最後のエラーを投げる、中断されたら残りを試さない）
- [x] 3-5. `providers/index.ts` で `config.overpassUrls` を渡す
- [x] 3-6. `vite.config.ts` の CSP の `connect-src` に、すべての検索先のオリジンを含める
- [x] 3-7. `.env.example` に複数指定の書き方を説明するコメントを追加する

**完了条件：** `npm run check` と `npm run build` が成功する。2 件の URL を指定してビルドすると、`dist/index.html` の CSP に両方のオリジンが含まれている。

## フェーズ 4：動作確認

- [x] 4-1. `npm run test:e2e` が成功する
- [x] 4-2. 【ユーザー確認】ローカル環境で萩駅周辺を半径 500m で検索する。→ overpass-api.de が応答せずタイムアウトすることが多いと分かり、設計を変更した（design.md 1.1 節の変更 A〜C）。変更後の確認は 4-7 で行う
- [x] 4-3. 【ユーザー確認】代替の検索先の候補を、ブラウザから確かめる。→ `maps.mail.ru` が使えた。`overpass.private.coffee`・`overpass.kumi.systems` は使えなかった
- [x] 4-4. 【ユーザー確認】`maps.mail.ru` の利用規約を確かめる（公開前まで）。→ 調べた範囲では無料で、課金の仕組みはない（正式な利用規約は見つからなかった）
- [x] 4-8. 【変更 D】NextGIS の検索先を設定する
  - [x] 4-8-1. `.env.example` と README に、API キーが必要な検索先を加える例を書く（キーは書かない）
  - [x] 4-8-2. 【ユーザー作業】ローカルの `.env` に `VITE_OVERPASS_URL=https://overpass.nextgis.com/<APIキー>/api/interpreter,https://maps.mail.ru/osm/tools/overpass/api/interpreter,https://overpass-api.de/api/interpreter` を書く
  - [x] 4-8-3. ビルドした `dist/index.html` の CSP に `overpass.nextgis.com` が含まれ、ローカルで検索すると NextGIS から結果が返ることを確かめる
  - [x] 4-8-4. 【ユーザー作業】GitHub リポジトリの Variables の `VITE_OVERPASS_URL` に、4-8-2 と同じ値を設定する（マージ前まで）
- [x] 4-5. 設計の変更 A〜C を実装する
  - [x] 4-5-1. 【変更 A】`QUERY_TIMEOUT_S` を 10 に変える（`TIMEOUT_MS` は 15 秒になる）。`timeout` のときも次の検索先を試す
  - [x] 4-5-2. 【変更 A】テストを直す：クエリに `[timeout:10]` が入る、1 か所目がタイムアウトしたときは 2 か所目の結果を返す
  - [x] 4-5-3. 【変更 B】`messages.ts` にタイムアウトの文言を追加し、`searchErrorMessage` で `timeout` を分ける。`ParkingList` のテストで、失敗の種類ごとの文言を確かめる
  - [x] 4-5-4. 【変更 C】既定の検索先を `maps.mail.ru`、`overpass-api.de` の順の 2 件にする（`config.ts`・`vite.config.ts`・`.env.example`）。`config.test.ts` の既定値のテストを直す
  - [x] 4-5-5. E2E テストのモック（`tests/e2e/support/mockExternalApis.ts`）が、既定の 1 か所目（`maps.mail.ru`）への通信も差し替えるように直す
- [x] 4-6. lint・型チェック・単体テスト・ビルド・E2E テストが成功する。ビルドした `dist/index.html` の CSP に、既定の 2 件のオリジンが含まれる
- [x] 4-7. 【ユーザー確認】ローカル環境で萩駅周辺を半径 500m で検索し、駐車場が表示されることを確かめる

**完了条件：** requirements.md 4 章の受け入れ条件のうち、GitHub Pages での確認を除くすべてを満たしている。

## フェーズ 5：ドキュメントの更新と仕上げ

- [x] 5-1. `docs/functional-design.md` のタイムアウト（検索先 1 か所あたり 15 秒）、画面の文言と検索先の切り替えの規則を更新する（design.md 6.1）
- [x] 5-2. `docs/architecture.md` の Overpass の制約（混雑として扱うステータス、複数の検索先）を更新する
- [x] 5-3. `docs/product-requirements.md` のリスクへの対策を更新する
- [x] 5-4. 最終確認として `npm run check`、`npm run build`、`npm run test:e2e` を実行する
- [x] 5-5. 【ユーザー確認】コミットし、プルリクエストを作成する
- [x] 5-6. 【ユーザー確認】マージ後に GitHub Pages で検索し、駐車場が表示されることを確かめる

**完了条件：** requirements.md 4 章の受け入れ条件をすべて満たしている。

## 作業メモ

- 2026-11-26：フェーズ 1〜3 のコードとテストを作成した（`[~]`）。Windows 側の Node が v16 のため、ESLint・Vitest・`vite build` は実行できなかった（Node 20 以上が必要。CI は Node 24）。型チェック（`tsc`）と Prettier の整形は通っている。devcontainer で `npm run check` と `npm run build` を実行し、通ったら `[x]` にする
- 2026-11-26：Docker（node:24-bookworm）と、Windows（Volta の Node 24.22.3）の両方で、lint・型チェック・テスト（27 ファイル・187 件）・ビルドが成功した。`VITE_OVERPASS_URL` に 2 件指定してビルドすると、CSP の `connect-src` に両方のオリジンが含まれることも確かめた。フェーズ 1〜3 を `[x]` にした
  - Windows で実行するときは、Linux 用の `node_modules` に Windows 用のネイティブモジュール 4 つ（rolldown・rollup・tailwind oxide・lightningcss）を追加で展開している。`.bin` のシンボリックリンクは Windows の Node からたどれないため、各ツールを `volta run --node 24 node node_modules/<ツール>/...` で直接呼ぶ
- 2026-11-26：Windows で Playwright の Chromium をダウンロードし、E2E テスト 8 件が成功した（4-1）。`playwright.config.ts` の `webServer` は npm スクリプトを使うため Windows では起動できない。先に `vite preview --port 4173` を起動し、`reuseExistingServer` で使い回した。Git Bash では `VITE_BASE_PATH=/` が `C:/Program Files/Git/` に書き換えられるため、`MSYS2_ENV_CONV_EXCL=VITE_BASE_PATH` を指定してビルドする
- 2026-11-26：4-2 のブラウザでの確認（ユーザーの環境と、Playwright の Chromium の両方）
  - 3 回のうち 1 回は HTTP 502 が返った（CORS のヘッダーあり）。修正どおり「サーバーが混雑しています」と再試行ボタンが表示された
  - 残りの 2 回は、overpass-api.de が 25 秒間まったく応答せず、アプリのタイムアウトで打ち切った（`net::ERR_ABORTED`、ステータスなし）。画面には「駐車場情報を取得できませんでした」が表示された。ユーザーの環境で起きた「ステータスもヘッダーも無い」状態と同じ
  - クエリの `[timeout:20]` があっても応答が返らないため、サーバーは処理を始める前の段階（受付の待ち行列）で止まっていると考えられる。タイムアウトの見直しだけでは直らず、代替の検索先（4-3）が必要
- 2026-11-26：設計の変更 A〜C を実装した（4-5）。lint・型チェック・単体テスト（189 件）・ビルド・E2E テスト（8 件）が成功し、CSP に既定の 2 件（maps.mail.ru、overpass-api.de）のオリジンが含まれることを確かめた（4-6）
  - E2E のモックは、失敗させる場合に最初の検索で 2 件の検索先をすべて失敗させるように変えた（検索先を順に試すようになったため）
  - Playwright の Chromium から実際のサーバーに 2 回検索すると、2 回とも maps.mail.ru → overpass-api.de の順にそれぞれ 15 秒でタイムアウトした。画面には、タイムアウトの文言と再試行ボタンが表示された（変更 A・B は設計どおりに動いている）
  - ユーザーのブラウザ（`about:blank` から node だけを検索するクエリ）では、maps.mail.ru から応答があった。アプリのクエリ（node・way・relation、`out center tags`、`[timeout:10]`）との違いか、ブラウザや時間帯による違いかは未確認（4-7 で確かめる）
- 2026-11-26：4-7 のユーザー確認。ユーザーのブラウザで、福岡 SRP センタービル付近を検索すると駐車場が表示された。修正後のアプリで、実際のサーバーから結果を受け取れることを確かめた。この PC のヘッドレス Chromium からのタイムアウトは、PC 側の要因と考えられる
- 2026-11-26：4-7 のユーザー確認（続き）。萩駅周辺でも駐車場が表示された。応答した検索先は maps.mail.ru だった
- 2026-11-26：フェーズ 5 の 5-1〜5-4 を完了した。docs/ の 3 ファイルに加え、README の環境変数の表（VITE_OVERPASS_URL の既定値）も更新した。Prettier の整形チェック・lint・型チェック・単体テスト（189 件）・E2E テスト（8 件）が成功した
- 2026-11-26：変更 D（4-8）。ユーザーが .env に NextGIS → maps.mail.ru → overpass-api.de の 3 件を設定した。ビルドした CSP に 3 件のオリジンが含まれ、Playwright の Chromium から萩駅周辺を検索すると、NextGIS から 4.3 秒で HTTP 200 が返り、2 件の駐車場が表示された
- 2026-11-26：4-8-4。ユーザーが GitHub リポジトリの Variables に VITE_OVERPASS_URL を登録した（gh variable list で名前だけを確認した）
- 2026-11-26：4-4 はユーザーの判断で完了とした。5-5 でコミットし、プルリクエストを作成した
- 2026-11-26：ユーザーの依頼で、Windows 用のネイティブモジュールを追加するスクリプトを `scripts/add-win32-bindings.sh` としてリポジトリに置いた。README に Windows での開発手順を、`docs/repository-structure.md` に `scripts/` を追記した。スクリプトは、展開済みのモジュールを飛ばす動きと、ダウンロードして展開する動きの両方を確かめ、展開後にビルドが成功した
- 2026-11-26：GitHub の Variables の `VITE_OVERPASS_URL` を、NextGIS → maps.mail.ru → overpass-api.de の 3 件に設定し直した（当初は API キーだけが入っていた）。#2 のマージで始まったデプロイのあと、公開ページの CSP に 3 件のオリジンが含まれることを確かめた。ユーザーが公開ページで検索し、駐車場が表示された（5-6）。すべてのタスクが完了した
