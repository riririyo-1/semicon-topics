"use client";

import { Box, Typography, List, ListItem, ListItemText, Link, useTheme } from "@mui/material";

export default function HomePage() {
  const theme = useTheme();
  return (
    <Box sx={{ mt: 6, color: theme.palette.text.primary }}>
      <Typography variant="h4" gutterBottom color="text.primary">
        半導体トピックス ダッシュボード
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.primary }}>
        最新の半導体業界ニュース・分析・AI要約・PESTトピックをワンストップで。
      </Typography>
      <List>
        <ListItem component={Link} href="/articles">
          <ListItemText primary="記事一覧・TOPIX" sx={{ color: theme.palette.text.primary }} />
        </ListItem>
        <ListItem component={Link} href="/crawl">
          <ListItemText primary="記事収集" sx={{ color: theme.palette.text.primary }} />
        </ListItem>
        <ListItem component={Link} href="/summarize">
          <ListItemText primary="AIバッチ（要約・タグ付け）" sx={{ color: theme.palette.text.primary }} />
        </ListItem>
        <ListItem component={Link} href="/topics">
          <ListItemText primary="PEST分析・トピック一覧" sx={{ color: theme.palette.text.primary }} />
        </ListItem>
      </List>
      <Typography variant="caption" color="text.secondary">
        Powered by Next.js App Router / MUI / TypeScript
      </Typography>
    </Box>
  );
}
