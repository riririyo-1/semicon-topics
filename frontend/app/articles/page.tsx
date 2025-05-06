"use client";

import React, { useEffect, useState } from "react";
import {
  Box, TextField, Chip, CircularProgress, Typography, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, FormControlLabel, useTheme
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Link from "next/link";

type Article = {
  id: number;
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  labels: string[];
  thumbnailUrl?: string;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tableView, setTableView] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const theme = useTheme();

  const fetchArticles = () => {
    setLoading(true);
    fetch("/api/articles")
      .then(res => res.json())
      .then(data => {
        // APIレスポンスは { items: [...], total: number, ... } 形式になったため
        // items プロパティから記事の配列を取得する
        setArticles(data.items || []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // キーワード検索のみでフィルタリング
  const filtered = Array.isArray(articles) 
    ? articles.filter(a => !keyword || a.title.includes(keyword) || a.summary?.includes(keyword))
    : [];

  const cardBg = theme.palette.background.paper;
  const cardShadow = theme.palette.mode === "dark"
    ? "0 2px 8px #2226, 0 1.5px 4px #0002"
    : "0 2px 8px #eee";
  const cardTitleColor = theme.palette.primary.main;
  const chipBg = theme.palette.secondary.main;
  const chipColor = theme.palette.getContrastText(theme.palette.secondary.main);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom color="text.primary">記事一覧</Typography>

      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <TextField
          label="キーワード"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          size="small"
          InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
        />
        <FormControlLabel
          control={<Switch checked={tableView} onChange={e => setTableView(e.target.checked)} />}
          label="表で表示"
          sx={{ color: theme.palette.text.primary }}
        />
      </Stack>
      {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : (
        <>
          {tableView && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <Button
                variant="outlined"
                color="error"
                disabled={selectedIds.length === 0}
                onClick={async () => {
                  if (!confirm("選択した記事を削除します。よろしいですか？")) return;
                  try {
                    const res = await fetch("/api/articles", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ids: selectedIds }),
                    });
                    if (!res.ok) throw new Error("削除に失敗しました");
                    setSelectedIds([]);
                    fetchArticles();
                  } catch (e) {
                    alert(e.message);
                  }
                }}
              >
                ゴミ箱
              </Button>
            </Box>
          )}
          {tableView ? (
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedIds(filtered.map(a => a.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>日付</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>タイトル</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>出展元</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>要約</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>ラベル</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ color: theme.palette.text.primary }}>記事がありません</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((a) => (
                      <TableRow key={a.id} selected={selectedIds.includes(a.id)}>
                        <TableCell padding="checkbox">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(a.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedIds(prev => [...prev, a.id]);
                              } else {
                                setSelectedIds(prev => prev.filter(id => id !== a.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>{a.published ? new Date(a.published).toLocaleDateString() : ""}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main }}>{a.title}</a>
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>{a.source}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>{a.summary ? a.summary.slice(0, 40) + (a.summary.length > 40 ? "..." : "") : ""}</TableCell>
                        <TableCell>
                          {a.labels && a.labels.map((label) => (
                            <Chip key={label} label={label} size="small" sx={{ mr: 0.5, mb: 0.5, bgcolor: chipBg, color: chipColor }} />
                          ))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 2,
            }}>
              {filtered.length === 0 ? <Typography color="text.primary">記事がありません</Typography> : (
                filtered.map(a => (
                  <Box key={a.id} sx={{
                    border: "1px solid #ddd",
                    borderRadius: 3,
                    p: 0,
                    mb: 2,
                    background: cardBg,
                    boxShadow: cardShadow,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 240,
                    maxWidth: 320,
                    transition: "box-shadow 0.2s, border-color 0.2s",
                    "&:hover": {
                      boxShadow: "0 4px 16px #22d3ee55, 0 2px 8px #0002",
                      borderColor: "#22d3ee"
                    }
                  }}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                      <Box sx={{
                        width: "100%", height: 120, borderTopLeftRadius: 12, borderTopRightRadius: 12,
                        background: "#f3f3f3", borderBottom: "1px solid #e5e7eb", mb: 1, overflow: "hidden"
                      }}>
                        <img
                          src={a.thumbnailUrl || "https://placehold.co/320x120?text=No+Image"}
                          alt={a.thumbnailUrl ? `${a.title}のサムネイル画像` : "No Image"}
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12, display: "block" }}
                        />
                      </Box>
                      <Box sx={{ p: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ color: cardTitleColor, mb: 0.5, fontWeight: 700, fontSize: 16 }}>{a.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                          [{a.source}] {a.published ? new Date(a.published).toLocaleDateString() : ""}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.primary, fontSize: 13 }}>{a.summary}</Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={0.5}>
                          {a.labels && a.labels.map(label => (
                            <Chip key={label} label={label} size="small" sx={{ bgcolor: chipBg, color: chipColor, fontSize: 12, height: 22, mr: 0.5, mb: 0.5 }} />
                          ))}
                        </Stack>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        </Stack>
                        <Stack direction="row" spacing={1} mt={1}>
                          <Link href={`/articles/${a.id}`} passHref legacyBehavior>
                            <Button
                              variant="outlined"
                              size="small"
                              color="primary"
                              startIcon={<InfoOutlinedIcon />}
                              sx={{ fontWeight: 600 }}
                            >
                              <span style={{ color: theme.palette.text.primary }}>詳細</span>
                            </Button>
                          </Link>
                          <Button
                            variant="contained"
                            size="small"
                            color="secondary"
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<OpenInNewIcon />}
                            sx={{ fontWeight: 600, color: theme.palette.getContrastText(theme.palette.secondary.main) }}
                          >
                            元記事
                          </Button>
                        </Stack>
                      </Box>
                    </a>
                  </Box>
                ))
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

