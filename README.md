# すきまっぷ

複数人の空き時間を指やマウスで塗り、重なりをヒートマップで確認する、ログイン不要の日程調整Webアプリです。

## 主な機能

- 最大14日・15/30分単位のイベント作成と共有URL発行
- UUIDと編集トークンによる匿名参加者の安全な回答編集
- Pointer Events / Pointer Captureによる範囲の追加・解除
- 回答の一括保存、人数ヒートマップ、時間帯詳細
- 決定的アルゴリズムによる上位3候補と幹事による日時確定
- 15秒ポーリングによる更新、PWA manifest、モバイル対応

## 技術構成

Next.js 15、React 19、TypeScript、Tailwind CSS 4、Prisma、PostgreSQL（Supabase推奨）、Zod、Vitest、Playwright。日時はMVPでは `Asia/Tokyo` 固定です。

## ローカル環境構築

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

`http://localhost:3000` を開きます。PostgreSQLが必要です。Supabaseの場合は Project Settings > Database の接続文字列を `DATABASE_URL`（pooler）と `DIRECT_URL`（direct connection）へ設定してください。

## 環境変数

- `DATABASE_URL`: 実行時PostgreSQL接続
- `DIRECT_URL`: Prisma migration用直接接続
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Realtime拡張用（現MVPでは任意）
- `SUPABASE_SERVICE_ROLE_KEY`: サーバー専用（現MVPでは任意・公開禁止）
- `EDIT_TOKEN_SECRET`: 32文字以上のランダムな秘密値

## テスト

```bash
npm test
npx playwright install chromium
npm run test:e2e
npm run lint
npm run build
```

E2EのDBフローを試す場合は、テスト用DBを用意してmigrationを適用してください。

## Vercelデプロイ

1. SupabaseでPostgreSQLプロジェクトを作成してmigrationを適用
2. GitHubリポジトリをVercelへImport
3. `.env.example` の各環境変数をVercelへ登録
4. Build Commandを `prisma generate && next build` にしてデプロイ

## 現在の制限

- タイムゾーンはAsia/Tokyo固定
- Realtime購読は未接続時にも確実に動く15秒ポーリングを採用
- アカウント、通知、カレンダー連携、回答締切は対象外
- 幹事トークンを保存したブラウザだけが開催日時を確定可能

## 今後の拡張

Supabase RealtimeのDB change購読、Google Calendar/LINE共有、回答締切、二段階の参加可否、CSV出力、多言語・複数タイムゾーン対応。
