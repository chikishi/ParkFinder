# ユビキタス言語定義

本書はプロジェクト内で使う用語と、その英語表記・コード上の名前を定義する。
ドキュメント・画面の文言・コードで、同じ概念には必ず同じ用語を使う。

## 1. ドメイン用語

### 1.1 駐車場と検索

| 日本語 | 英語 | コード上の名前 | 定義 |
|---|---|---|---|
| 駐車場 | parking lot | `ParkingLot`（型）/ `parkingLot`・`parkingLots`（変数） | 自動車を駐車できる場所。本アプリでは OSM の `amenity=parking` が付いた地物を指す |
| 周辺検索 | nearby search | `searchNearby` | 検索中心から検索半径以内にある駐車場を探すこと |
| 検索中心 | search center | `searchCenter` | 周辺検索の基準となる地点。地図のタップ、現在地、地名検索の結果から決まる |
| 検索半径 | search radius | `radiusM` | 検索中心から、検索対象とする範囲までの距離（メートル）。300m / 500m / 1km から選ぶ |
| 検索結果 | search result | `ParkingSearchResult` / `results` | 周辺検索で見つかった駐車場に、検索中心からの距離を加えたもの |
| 距離 | distance | `distanceM` | 検索中心から駐車場までの直線距離（メートル）。道のりの距離ではない |
| 現在地 | current location | `userLocation` | 端末の位置情報から取得した利用者の位置 |
| 目的地 | destination | `destination` | 利用者が車で向かう先。本アプリでは、地図上では検索中心として扱う |

### 1.2 駐車場の属性

| 日本語 | 英語 | コード上の名前 | 定義 |
|---|---|---|---|
| 駐車場名 | name | `name` | 駐車場の名称。データに無い場合は「名称不明の駐車場」と表示する |
| 収容台数 | capacity | `capacity` | 駐車できる台数 |
| 駐車場種別 | parking type | `parkingType` | 駐車場の構造（下表） |
| 料金区分 | fee | `fee` | 有料か無料か。`yes`（有料）/ `no`（無料）/ `unknown`（不明） |
| 利用制限 | access | `access` | 誰が利用できるか。`private`・`no` は一般利用不可として検索結果から除外する |
| 運営者 | operator | `operator` | 駐車場を運営する会社・団体 |
| 営業時間 | opening hours | `openingHours` | 利用できる時間帯。OSM の `opening_hours` の書式のまま扱う |

**駐車場種別の値**

| 値 | 画面表示 | 意味 |
|---|---|---|
| `surface` | 平面 | 地上の平面駐車場（コインパーキングを含む） |
| `multi-storey` | 立体 | 立体駐車場 |
| `underground` | 地下 | 地下駐車場 |
| `rooftop` | 屋上 | 建物の屋上の駐車場 |
| `unknown` | 種別不明 | データが無い、または上記以外 |

### 1.3 利用者のデータ

| 日本語 | 英語 | コード上の名前 | 定義 |
|---|---|---|---|
| お気に入り | favorite | `Favorite` / `favorites` | 利用者が保存した駐車場。登録時点の名称と座標を持つ |
| メモ | memo | `memo` | お気に入りに付ける自由記述のテキスト（最大 500 文字） |
| 設定 | settings | `AppSettings` / `settings` | 検索半径、最後に表示していた地図の位置など、次回起動時に引き継ぐ値 |

### 1.4 利用者の操作

| 日本語 | 英語 | コード上の名前 | 定義 |
|---|---|---|---|
| 地点指定検索 | map tap search | `onMapClick` | 地図をタップした地点を検索中心として周辺検索すること |
| 現在地検索 | location search | `LocateButton` | 現在地を検索中心として周辺検索すること |
| 地名検索 | place search | `useGeocoding` / `GeocodingProvider` | 地名・住所を入力し、候補地点へ地図を移動すること。コード上はジオコーディング（geocoding）と呼ぶ |
| 候補地点 | geocode result | `GeocodeResult` | 地名検索で見つかった地点。表示名と座標を持つ |
| ナビ連携 | navigation | `NavigateButton` / `buildNavigationUrl` | 選んだ駐車場を目的地として、外部の地図アプリでナビを開始すること |

## 2. UI 用語

| 日本語 | 英語 | コード上の名前 | 定義 |
|---|---|---|---|
| 地図 | map | `MapView` | 画面全体に常に表示する地図 |
| 駐車場マーカー | parking marker | `MapMarker` / `markers` | 地図上で駐車場の位置を示す印 |
| 中心マーカー | center marker | `searchCenter` | 地図上で検索中心を示す印 |
| 検索範囲の円 | radius circle | `searchRadiusM` | 地図上で検索半径を示す円 |
| 選択中 | selected | `selectedId` | 利用者が一覧またはマーカーで選んだ駐車場。地図と一覧の両方で強調表示する |
| 検索バー | search bar | `SearchBar` | 画面上部の地名検索の入力欄 |
| 現在地ボタン | locate button | `LocateButton` | 現在地検索を開始するボタン |
| ボトムシート | bottom sheet | `BottomSheet` | 画面下部からせり上がるパネル。一覧・詳細・お気に入り一覧を表示する |
| シートの高さ | sheet state | `sheetState` | ボトムシートの開き具合。`collapsed`（折りたたみ）/ `half`（半分）/ `full`（全画面） |
| 半径切替 | radius selector | `RadiusSelector` | 検索半径を選ぶボタン群 |
| 駐車場一覧 | parking list | `ParkingList` | 検索結果を距離順に並べた一覧 |
| 駐車場詳細 | parking detail | `ParkingDetail` | 選択中の駐車場の属性、お気に入り、メモ、ナビを表示する画面 |
| お気に入り一覧 | favorite list | `FavoriteList` | 保存したお気に入りの一覧 |

## 3. 技術用語

### 3.1 アーキテクチャ

| 日本語 | 英語 | コード上の名前 | 定義 |
|---|---|---|---|
| 提供元 | provider | `VITE_PROVIDER` の値（`osm` / `google`） | 地図・駐車場データ・地名検索のデータを提供する外部サービスの系統 |
| データ出典 | source | `ParkingLot.source` | 個々の駐車場データがどの提供元から来たか |
| プロバイダ | provider | `ParkingProvider` / `GeocodingProvider` | 提供元の違いを隠し、共通のデータモデルで結果を返す部品 |
| プロバイダのファクトリ | provider factory | `providers/index.ts` | 設定値に応じて、使うプロバイダを選ぶ処理 |
| サービス層 | service layer | `services/` | 検索の実行・距離計算・フィルタ・並べ替え・キャッシュなどの業務ロジック |
| キャッシュ | cache | `searchCache` | 同じ条件の検索結果を一時的に保持し、外部 API への再リクエストを省く仕組み |
| 中断 | abort | `AbortController` / `signal` | 新しい操作が来たときに、実行中の通信を取り消すこと |
| プロバイダエラー | provider error | `ProviderError` | プロバイダ層が投げるエラー。失敗の種類を `kind` に持つ |

### 3.2 外部サービス・OSM

| 用語 | 定義 |
|---|---|
| OSM（OpenStreetMap） | 誰でも編集できる、オープンな地図データ。本アプリの地図と駐車場データの元になる |
| 地物 | 地図上の個々の要素（建物、道路、駐車場など）。OSM では node・way・relation のいずれかで表す |
| node | 1 つの座標で表す地物（点） |
| way | 複数の node をつないだ線や領域。駐車場の多くは領域として way で表される |
| relation | 複数の地物の組み合わせ |
| タグ | 地物の属性を表すキーと値の組（例：`amenity=parking`、`capacity=50`） |
| Overpass API | 条件を指定して OSM データを検索できる API。本アプリでは駐車場の周辺検索に使う |
| Overpass QL | Overpass API に送る問い合わせの言語 |
| Nominatim | OSM データを使ったジオコーディングサービス。本アプリでは地名検索に使う |
| ジオコーディング | 地名・住所を座標に変換すること |
| タイル | 地図を細かく分割した画像。地図は表示範囲のタイルを並べて描画する |
| 帰属表示 | 「© OpenStreetMap contributors」のような、データの出典の表示。OSM の利用条件で必須 |
| 利用ポリシー | 外部サービスの利用条件（リクエスト頻度の上限など） |

### 3.3 Web・端末

| 用語 | 定義 |
|---|---|
| PWA | Progressive Web App。ホーム画面に追加でき、アプリのように起動できる Web アプリ |
| Service Worker | ブラウザの裏側で動き、ファイルをキャッシュしてオフライン起動を可能にする仕組み |
| Geolocation API | ブラウザから端末の位置情報を取得する仕組み。HTTPS でのみ使える |
| localStorage | ブラウザ内にデータを保存する仕組み。お気に入りと設定の保存に使う |
| セーフエリア | iPhone のホームバーやノッチに隠れない、画面の表示領域 |

## 4. 使い分けの注意

| 使う表記 | 使わない表記 | 理由 |
|---|---|---|
| 駐車場（`parkingLot`） | パーキング、`carPark`、`lot` 単体 | 表記を 1 つに統一する。「○○パーキング」のような固有名詞はそのまま使う |
| 検索中心 | 目的地（地図上の点を指す場合） | 検索中心は必ずしも目的地ではない（現在地の場合もある） |
| 距離（直線距離） | 徒歩○分、道のり | 本アプリは直線距離しか計算しないため、所要時間や道のりと誤解させない |
| 提供元 | ベンダー、データソース | 用語を統一する |
| 地名検索 | 住所検索、場所検索 | 地名と住所の両方を扱うため、画面上は「地名・住所で検索」と表示し、用語としては「地名検索」に統一する |
| お気に入り | ブックマーク、保存済み | 用語を統一する |
