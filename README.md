# fridge（冷蔵庫在庫アプリ・モバイル）

家族向けの在庫管理。MVP は手入力。将来的にドア連動の映像収集と画像認識を追加する想定。

## 構成

| パス | 役割 |
|------|------|
| `apps/mobile` | Expo（React Native）アプリ |
| `packages/shared` | 共有型・定数（在庫モデルなど） |
| `edge/` | 将来：ドアセンサ・カメラ・録画・アップロード |
| `ml/` | 将来：データセット定義・学習・評価 |

## 要件

- **Node.js 20.18 以上**（Expo SDK 54 向け。`nvm` / `nodebrew` などで切り替えてください）
- ルートに `.nvmrc` があります

## 開発

リポジトリルートで依存関係を入れてから起動します。

```bash
git clone https://github.com/Kento-Kubo/fridge.git
cd fridge
npm install
npm run build:shared
npm run mobile
```

または:

```bash
cd apps/mobile
npx expo start
```

## データ（MVP）

Google スプレッドシート連携を想定。認証情報はリポジトリに含めず、`.env` またはローカル設定で管理してください。

## ライセンス

（必要に応じて追記）
