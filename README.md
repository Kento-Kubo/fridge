# fridge（冷蔵庫在庫・PWA）

家族向けの在庫管理。**現状は PWA（スマホブラウザ）** がメインです。手入力 MVP のあと、献立・買い物リスト・自動認識へ拡張する想定です。

## 構想（ロードマップ）

1. **在庫がわかる**（いま）… 手入力で一覧。スーパーでもスマホで確認
2. **献立**… 在庫から参照、提案もあり
3. **献立 → 必要材料リスト**
4. **買い物リスト**… スーパーでスマホから確認

## 構成

| パス | 役割 |
|------|------|
| `apps/web` | **Vite + React の PWA**（在庫 MVP） |
| `apps/mobile` | Expo（以前の試作。現状は未使用でも可） |
| `packages/shared` | 共有型（`InventoryItem` など） |
| `edge/` | 将来：ドア・カメラ・録画 |
| `ml/` | 将来：学習・評価 |

## 要件

- **Node.js 20.18 以上**（ルートに `.nvmrc`）
- 推奨: **20.19+**（Expo を触る場合は特に）

## 開発（PWA）

```bash
git clone https://github.com/Kento-Kubo/fridge.git
cd fridge
npm install
npm run web
```

ブラウザで表示された URL を開きます（スマホなら同一 Wi‑Fi で PC の IP を指定）。

### ログイン（パスワード）

- 本番ビルドでは `VITE_APP_PASSWORD` をビルド時に渡す必要があります（Vite が静的に埋め込みます）。
  - **Vercel**: リポジトリの `vercel.json` の `build.env` で設定済みの例あり（初期値 `prod`）。強い秘密に変える場合は Vercel ダッシュボードの Environment Variables に切り替え、`vercel.json` の平文は削除してください。
  - **ローカル本番ビルド**: `apps/web/.env.production`（gitignore 対象）や `VITE_APP_PASSWORD=… npm run web:build` など（例は `apps/web/.env.example`）。
- **開発モード**（`npm run web`）で `VITE_APP_PASSWORD` が未設定のときは、パスワード **`dev`** でログインできます。
- 認証状態は **タブを閉じるまで** `sessionStorage` に保持されます（端末ロック程度では維持、ブラウザを閉じると再ログイン）。

### 画面構成（MVP）

0. `/login` … パスワードログイン  
1. `/` … コレクション「冷蔵庫」一覧（`locationId` が `fridge` または未設定の行）  
2. `/items/:id` … 商品シングル（編集・削除）、`/items/new` で追加  

画面下フッターは **「在庫」** アイコンのみ（ホーム＝冷蔵庫コレクション）。

## 本番ビルド

```bash
npm run web:build
```

`apps/web/dist` に静的ファイルが出力されます。GitHub Pages・Cloudflare Pages・Vercel などにそのまま載せられます。

## iPhoneに「アプリっぽく」置く

Safari でサイトを開き、**共有 → ホーム画面に追加**。オフライン用に Service Worker が入っています（キャッシュの挙動はビルド内容に依存）。

## データ（MVP）

**この端末のブラウザの localStorage** に保存します。クラウド同期は未実装なので、**別の端末とは自動では共有されません**。将来スプレッドシートや BaaS に差し替えやすいよう、`InventoryRepository` の形は `packages/shared` で共通化してあります。

## ライセンス

（必要に応じて追記）
