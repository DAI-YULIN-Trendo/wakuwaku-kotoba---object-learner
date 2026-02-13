# わくわくことば — 物体あて

画像をアップロードすると、主な物体の名前をひらがなで表示し、ブラウザの読み上げで発音します。

- **識図**: Agentify Open API（画像 → ひらがな単語）
- **読み上げ**: ブラウザの Web Speech API（iOS Safari / デスクトップ対応）
- **デプロイ**: GitHub Actions で GitHub Pages に公開

## ローカルで動かす

1. 依存関係を入れる: `npm install`
2. 起動: `npm run dev`

初回表示時にパスワード入力が必要。AuthKey の 32 文字 hex のほか、**Base64 にした 22 文字の短い形**（例: `yCfXeF0tRoudkT+Foj5/TQ`）も使える。
（Agentify の設定はコード内デフォルトでそのまま利用可能。差し替えたい場合は `.env.local` に `VITE_AGENTIFY_HOST` / `VITE_AGENTIFY_AGENT_ID` 等を指定。）

## GitHub Pages にデプロイ

1. リポジトリの **Settings → Pages** で、Source を **GitHub Actions** に設定
2. `main` に push すると自動でビルド・デプロイ
3. 公開 URL: `https://<username>.github.io/<repo-name>/`

## 開発

- `npm run build` — 本番ビルド（`dist/`）
- `npm run preview` — ビルドのプレビュー
