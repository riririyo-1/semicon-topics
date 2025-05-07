"use client";

import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, CircularProgress, Alert, Stack, Checkbox, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, useTheme,
  Tabs, Tab, TextField, Card, CardContent
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale/ja";

const RSS_SOURCES = [
  { key: "eetimes", label: "EE Times Japan" },
  { key: "itmedia", label: "IT media" },
  { key: "nhk", label: "NHK" },
  { key: "mynavi_techplus", label: "マイナビ Tech＋" },
];

type Article = {
  id: number;
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  labels: string[];
};

export default function CrawlPage() {
  const [tabValue, setTabValue] = useState(0);
  
  // RSS収集関連の状態
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>(RSS_SOURCES.map(s => s.key));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // AIバッチ
  const [batchLoading, setBatchLoading] = useState<"summarize" | null>(null);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  // 記事一覧
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetching, setFetching] = useState(false);

  // 手動追加関連の状態
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualPublished, setManualPublished] = useState<Date | null>(new Date());
  const [manualSource, setManualSource] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<{ success?: string; error?: string } | null>(null);

  const theme = useTheme();
  const chipBg = theme.palette.secondary.main;
  const chipColor = theme.palette.getContrastText(theme.palette.secondary.main);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // タブ切り替え時に結果メッセージをクリア
    setResult(null);
    setError(null);
    setManualResult(null);
  };

  const fetchArticles = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/articles?limit=100");
      const data = await res.json();
      // APIレスポンスは { items: [...], total: number, ... } 形式になったため
      // items プロパティから記事の配列を取得する
      setArticles(data.items || []);
    } catch (error) {
      console.error("記事取得エラー:", error);
      setArticles([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCrawl = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate?.toISOString().slice(0, 10),
          end_date: endDate ? endDate.toISOString().slice(0, 10) : undefined,
          sources: selectedSources,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        fetchArticles();
      } else {
        setError(data.error || "APIエラー");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualUrl) {
      setManualResult({ error: "タイトルとURLは必須です" });
      return;
    }
    
    setManualLoading(true);
    setManualResult(null);
    
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle,
          url: manualUrl,
          published: manualPublished?.toISOString(),
          source: manualSource
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setManualResult({ success: "記事が追加されました" });
        // フォームをリセット
        setManualTitle("");
        setManualUrl("");
        setManualSource("");
        fetchArticles();
      } else {
        setManualResult({ error: data.error || "APIエラー" });
      }
    } catch (e: any) {
      setManualResult({ error: e.message });
    } finally {
      setManualLoading(false);
    }
  };

  const handleBatch = async () => {
    setBatchLoading("summarize");
    setBatchResult(null);
    try {
      const res = await fetch(`/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 20 }),
      });
      const data = await res.json();
      if (res.ok) {
        setBatchResult(JSON.stringify(data));
        fetchArticles();
      } else {
        setBatchResult(data.error || "APIエラー");
      }
    } catch (e: any) {
      setBatchResult(e.message);
    } finally {
      setBatchLoading(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom color="text.primary">記事収集</Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="RSS収集" />
        <Tab label="手動追加" />
      </Tabs>

      {/* RSS収集タブ */}
      {tabValue === 0 && (
        <Box>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Stack direction="row" spacing={2} mb={2}>
              <DatePicker
                label="開始日"
                value={startDate}
                onChange={setStartDate}
                format="yyyy-MM-dd"
              />
              <DatePicker
                label="終了日（省略可）"
                value={endDate}
                onChange={setEndDate}
                format="yyyy-MM-dd"
              />
            </Stack>
          </LocalizationProvider>
          <Stack direction="row" spacing={2} mb={2}>
            {RSS_SOURCES.map(src => (
              <FormControlLabel
                key={src.key}
                control={
                  <Checkbox
                    checked={selectedSources.includes(src.key)}
                    onChange={() =>
                      setSelectedSources(prev =>
                        prev.includes(src.key)
                          ? prev.filter(k => k !== src.key)
                          : [...prev, src.key]
                      )
                    }
                  />
                }
                label={src.label}
                sx={{ color: theme.palette.text.primary }}
              />
            ))}
          </Stack>
          <Button
            variant="contained"
            onClick={handleCrawl}
            disabled={loading || !startDate || selectedSources.length === 0}
            fullWidth
            sx={{ fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={24} /> : "記事収集"}
          </Button>
          {result && (
            <Alert severity="success" sx={{ mt: 2 }}>
              収集完了: {result.inserted}件追加, {result.skipped}件スキップ
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      )}

      {/* 手動追加タブ */}
      {tabValue === 1 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <form onSubmit={handleManualSubmit}>
              <Stack spacing={3}>
                <TextField 
                  label="タイトル *"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                />
                <TextField 
                  label="URL *"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                />
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
                  <DatePicker
                    label="公開日（省略可）"
                    value={manualPublished}
                    onChange={setManualPublished}
                    format="yyyy-MM-dd"
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
                <TextField 
                  label="出典元（省略可）"
                  value={manualSource}
                  onChange={(e) => setManualSource(e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="未入力の場合は「手動追加」となります"
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={manualLoading}
                  fullWidth
                  sx={{ fontWeight: 600 }}
                >
                  {manualLoading ? <CircularProgress size={24} /> : "記事を追加"}
                </Button>
              </Stack>
            </form>
            {manualResult?.success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {manualResult.success}
              </Alert>
            )}
            {manualResult?.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {manualResult.error}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Stack direction="row" spacing={2} mt={4} mb={2}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleBatch}
          disabled={batchLoading !== null}
          sx={{ fontWeight: 600 }}
        >
          {batchLoading === "summarize" ? <CircularProgress size={20} /> : "要約・ラベル付け"}
        </Button>
        {batchResult && <Alert severity="info" sx={{ ml: 2 }}>{batchResult}</Alert>}
      </Stack>

      <Typography variant="h6" mt={4} mb={1} color="text.primary">記事一覧</Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: theme.palette.text.primary }}>日付</TableCell>
              <TableCell sx={{ color: theme.palette.text.primary }}>タイトル</TableCell>
              <TableCell sx={{ color: theme.palette.text.primary }}>出展元</TableCell>
              <TableCell sx={{ color: theme.palette.text.primary }}>要約</TableCell>
              <TableCell sx={{ color: theme.palette.text.primary }}>ラベル</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fetching ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ color: theme.palette.text.primary }}><CircularProgress size={24} /></TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ color: theme.palette.text.primary }}>記事がありません</TableCell>
              </TableRow>
            ) : (
              articles.map((a) => (
                <TableRow key={a.id}>
                  <TableCell sx={{ color: theme.palette.text.primary }}>{a.published ? new Date(a.published).toLocaleDateString() : ""}</TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main }}>{a.title}</a>
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>{a.source}</TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    {a.summary ? a.summary.slice(0, 40) + (a.summary.length > 40 ? "..." : "") : ""}
                  </TableCell>
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
    </Box>
  );
}
