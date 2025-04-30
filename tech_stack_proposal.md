# 技術スタック構成案（案1：シンプル分離型）

## 概要

- **Frontend**: Next.js (App Router)
- **Backend API**: Node.js + Express (TypeScript可)
  - **TypeScriptでは`any`型の使用を禁止し、型安全性を重視すること**
- **DB**: PostgreSQL
- **RSSクローラー**: Python + feedparser
- **AI要約/ラベル**: Python (LangChain + OpenAI API)
- **メール配信**: Python (aiosmtplib)
- **スケジューラ**: cronコンテナ

---

## メリット

- 各役割が明確に分離されており、開発・運用・スケールが容易
- サービスごとに言語・ライブラリを最適化できる
- 障害切り分けがしやすい
- **TypeScriptの型安全性を最大限活用し、`any`型の使用を避けることでバグの早期発見・保守性向上が期待できる**

## デメリット

- サービス数が多くなり、docker-compose.ymlが煩雑
- サービス間通信（REST/HTTP）が増え、レイテンシや認証管理が必要

---

## docker-compose.yml サービス構成例

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: appdb
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

  rss_crawler:
    build: ./rss_crawler
    depends_on:
      - db

  ai_summarizer:
    build: ./ai_summarizer
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}

  mailer:
    build: ./mailer

  scheduler:
    image: alpine
    entrypoint: ["crond", "-f"]
    volumes:
      - ./scheduler/crontab:/etc/crontabs/root:ro

volumes:
  db_data:
```

---

## ディレクトリツリーひな形

```
.
├── frontend/         # Next.js (App Router)
│   └── app/
├── backend/          # Node.js + Express（TypeScript、any禁止）
├── db/               # DB用（マイグレーション等）
├── rss_crawler/      # Python + feedparser
├── ai_summarizer/    # Python + LangChain
├── mailer/           # Python aiosmtplib
├── scheduler/        # cron設定
│   └── crontab
└── docker-compose.yml
```

---

## Next.js側の前提

- `frontend/app/` 以下にページを配置する構成です。

---

## 補足

- サービス分割重視で、各役割ごとに最適な技術を選択しています。
- 開発・運用・スケール・障害切り分けのしやすさを重視する場合に最適です。
- **TypeScriptでは`any`型の使用を禁止し、型安全性を徹底します。ESLintやtsconfigで`no-explicit-any`ルールを有効化することを推奨します。**
- ご要望に応じて、CI/CDや監視、開発体制に合わせたカスタマイズも可能です。