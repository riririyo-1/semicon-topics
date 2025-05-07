"use client";

import { Box, Typography, List, ListItem, ListItemText, Link, useTheme } from "@mui/material";

export default function HomePage() {
  const theme = useTheme();
  return (
    <Box sx={{ mt: 6, color: theme.palette.text.primary }}>
      <Typography variant="h4" gutterBottom color="text.primary">
        半導体TOPICS ダッシュボード
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.primary }}>
        最新の半導体業界ニュース・分析・AI要約・カテゴリ分けをワンストップで。
      </Typography>
      <Typography variant="h6" sx={{ mt: 4 }}>
        ■ 起動方法
      </Typography>
      <Typography variant="body1" component="div" sx={{ mt: 1, whiteSpace: "pre-line" }}>
        {`1. env作成
        2. docker compose up --build
        3. localhost:3000でアプリページ`}
      </Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        ■ API仕様
      </Typography>

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        ❑ Node/Express側
      </Typography>
      <Typography variant="body2" component="div" sx={{ whiteSpace: "pre-line", mb: 2 }}>
        {`Swagger UI を用意。（外部向けのポート番号は4001にずらしているため注意）

        - `}
        <Link href="http://localhost:4001" target="_blank" rel="noopener">
          http://localhost:4001 （Swagger UI）
        </Link>
      </Typography>

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        ❑ Fast API側
      </Typography>
      <Typography variant="body2" component="div" sx={{ whiteSpace: "pre-line" }}>
        {`FastAPI（pipeline側）は標準でSwagger UI（/docs）とReDoc（/redoc）、OpenAPI JSON（/openapi.json）を自動で提供する。

        - `}
        <Link href="http://localhost:8000/docs" target="_blank" rel="noopener">
          http://localhost:8000/docs （Swagger UI）
        </Link>
        {`
        - `}
        <Link href="http://localhost:8000/redoc" target="_blank" rel="noopener">
          http://localhost:8000/redoc （ReDoc）
        </Link>
        {`
        - `}
        <Link href="http://localhost:8000/openapi.json" target="_blank" rel="noopener">
          http://localhost:8000/openapi.json （OpenAPI仕様JSON）
        </Link>
      </Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        ■ DB
      </Typography>
      
      <Typography variant="subtitle1" sx={{ mt: 4 }}>
        ❑ テーブル参照 
      </Typography>

      <Typography variant="body2" component="div" sx={{ whiteSpace: "pre-line", mb: 2 }}>
        {`docker compose exec db psql -U semicon_topics -d semicon_topics
        \dt
        `}
      </Typography>

    </Box>
  );
}
