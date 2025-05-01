"use client";

import React, { useState } from "react";
import {
  Box, Typography, Button, Stack, TextField, Chip, Checkbox, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, InputLabel, Switch, useTheme, Alert
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale/ja";

type Article = {
  id: number;
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  labels: string[];
  thumbnailUrl?: string;
  categories?: { main: string; sub: string[] };
};

const CATEGORY_MAIN = ["政治", "経済", "社会", "技術"];
const CATEGORY_SUB = [
  "買収", "製造技術", "新製品", "国の動き", "企業の動き", "株価"
];

export default function TopicsPage() {
  const [title, setTitle] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingCategories, setEditingCategories] = useState<{ [id: number]: { main: string; sub: string[] } }>({});
  const [loading, setLoading] = useState(false);
  const [tableView, setTableView] = useState(true);
  const [topicsId, setTopicsId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const theme = useTheme();

  // API: 新規TOPICS作成
  const fetchTopicsCreate = async () => {
    if (!title || selectedIds.length === 0) {
      setError("タイトルと記事選択は必須です");
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          articles: articles.filter(a => selectedIds.includes(a.id)),
          categories: editingCategories
        })
      });
      const data = await res.json();
      setTopicsId(data.id);
      alert("TOPICS新規作成: " + data.id);
    } catch (e: any) {
      setError(e.message || "TOPICS作成に失敗しました");
    }
  };

  // API: 記事ごとのカテゴリ編集
  const fetchCategoryEdit = async (articleId: number, main: string, sub: string[]) => {
    if (!topicsId) return;
    try {
      await fetch(`/api/topics/${topicsId}/article/${articleId}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ main, sub })
      });
    } catch (e: any) {
      setError(e.message || "カテゴリ編集に失敗しました");
    }
  };

  // API: LLM自動分類
  const fetchLLMAutoCategorize = async () => {
    if (!topicsId) return;
    try {
      const res = await fetch(`/api/topics/${topicsId}/categorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_ids: selectedIds })
      });
      const data = await res.json();
      setEditingCategories(prev => ({ ...prev, ...data.categories }));
    } catch (e: any) {
      setError(e.message || "LLM自動分類に失敗しました");
    }
  };

  // API: テンプレート出力
  const fetchExportTemplate = async () => {
    if (!topicsId) return;
    try {
      const res = await fetch(`/api/topics/${topicsId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      alert("テンプレート出力: " + (data.html ? "HTML取得" : "失敗"));
    } catch (e: any) {
      setError(e.message || "テンプレート出力に失敗しました");
    }
  };

  // API: 月次まとめ自動生成
  const fetchMonthlySummary = async () => {
    if (!topicsId) return;
    setSummaryLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/topics/${topicsId}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.monthly_summary) {
        setMonthlySummary(data.monthly_summary);
      } else {
        setError(data.error || "月次まとめ生成に失敗しました");
      }
    } catch (e: any) {
      setError(e.message || "月次まとめ生成に失敗しました");
    } finally {
      setSummaryLoading(false);
    }
  };

  // 記事検索
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom.toISOString().slice(0, 10));
    if (dateTo) params.append("date_to", dateTo.toISOString().slice(0, 10));
    if (labels.length > 0) params.append("label", labels.join(","));
    try {
      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();
      setArticles(data);
    } catch (e: any) {
      setError(e.message || "記事取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // ラベル追加
  const handleAddLabel = () => {
    if (labelInput && !labels.includes(labelInput)) {
      setLabels([...labels, labelInput]);
      setLabelInput("");
    }
  };

  // ラベル削除
  const handleDeleteLabel = (label: string) => {
    setLabels(labels.filter(x => x !== label));
  };

  // カテゴリ編集
  const handleCategoryChange = (id: number, main: string, sub: string[]) => {
    setEditingCategories(prev => {
      if (topicsId) fetchCategoryEdit(id, main, sub);
      return {
        ...prev,
        [id]: { main, sub }
      };
    });
  };

  // LLM自動分類（API呼び出し）
  const handleLLMAutoCategorize = () => {
    fetchLLMAutoCategorize();
  };

  // テンプレート出力（API呼び出し）
  const handleExport = () => {
    if (!title || selectedIds.length === 0) {
      setError("タイトルと記事選択は必須です");
      return;
    }
    fetchExportTemplate();
  };

  // ラベル追加時に自動で絞り込み
  React.useEffect(() => {
    if (labels.length > 0) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels]);

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary }}>TOPICS配信作成</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <TextField
          label="TOPICSタイトル"
          value={title}
          onChange={e => setTitle(e.target.value)}
          sx={{ minWidth: 300, color: theme.palette.text.primary }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
          InputLabelProps={{ style: { color: theme.palette.text.primary } }}
        />
        <Button variant="contained" onClick={fetchTopicsCreate} disabled={!title || selectedIds.length === 0}>新規作成</Button>
      </Stack>
      {/* 日付範囲ピッカーの段 */}
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
          <DatePicker
            label="開始日"
            value={dateFrom}
            onChange={setDateFrom}
            format="yyyy-MM-dd"
            slotProps={{ textField: { InputLabelProps: { style: { color: theme.palette.text.primary } }, InputProps: { style: { color: theme.palette.text.primary } } } }}
          />
          <DatePicker
            label="終了日"
            value={dateTo}
            onChange={setDateTo}
            format="yyyy-MM-dd"
            slotProps={{ textField: { InputLabelProps: { style: { color: theme.palette.text.primary } }, InputProps: { style: { color: theme.palette.text.primary } } } }}
          />
        </LocalizationProvider>
      </Stack>
      {/* ラベル追加の段 */}
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <TextField
          label="ラベル追加"
          value={labelInput}
          onChange={e => setLabelInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAddLabel()}
          sx={{ minWidth: 160, color: theme.palette.text.primary }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
          InputLabelProps={{ style: { color: theme.palette.text.primary } }}
        />
        <Button variant="outlined" onClick={handleAddLabel}>追加</Button>
        <Stack direction="row" spacing={1}>
          {labels.map(l => (
            <Chip key={l} label={l} onDelete={() => handleDeleteLabel(l)} sx={{ color: theme.palette.text.primary }} />
          ))}
        </Stack>
      </Stack>
      {/* 絞り込みボタンの段 */}
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <Button variant="contained" onClick={handleSearch} disabled={loading}>記事リスト絞り込み</Button>
        <FormControlLabel
          control={<Switch checked={tableView} onChange={e => setTableView(e.target.checked)} />}
          label={tableView ? "表で表示" : "カードで表示"}
          sx={{ color: theme.palette.text.primary }}
        />
      </Stack>
      <Typography variant="h6" mt={2} mb={1} sx={{ color: theme.palette.text.primary }}>記事リスト</Typography>
      {tableView ? (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell sx={{ color: theme.palette.text.primary }}>日付</TableCell>
                <TableCell sx={{ color: theme.palette.text.primary }}>タイトル</TableCell>
                <TableCell sx={{ color: theme.palette.text.primary }}>出展元</TableCell>
                <TableCell sx={{ color: theme.palette.text.primary }}>要約</TableCell>
                <TableCell sx={{ color: theme.palette.text.primary }}>ラベル</TableCell>
                <TableCell sx={{ color: theme.palette.text.primary }}>カテゴリ編集</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {articles.map(a => (
                <TableRow key={a.id} selected={selectedIds.includes(a.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
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
                    {a.labels && a.labels.map(label => (
                      <Chip key={label} label={label} size="small" sx={{ mr: 0.5, mb: 0.5, color: theme.palette.text.primary }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <InputLabel sx={{ color: theme.palette.text.primary }}>大カテゴリ</InputLabel>
                    <Select
                      value={editingCategories[a.id]?.main || ""}
                      onChange={e => handleCategoryChange(a.id, e.target.value, editingCategories[a.id]?.sub || [])}
                      size="small"
                      sx={{ minWidth: 100, mr: 1, color: theme.palette.text.primary }}
                    >
                      <MenuItem value=""><em>未設定</em></MenuItem>
                      {CATEGORY_MAIN.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                    <InputLabel sx={{ color: theme.palette.text.primary }}>小カテゴリ</InputLabel>
                    <Select
                      multiple
                      value={editingCategories[a.id]?.sub || []}
                      onChange={e => handleCategoryChange(a.id, editingCategories[a.id]?.main || "", Array.isArray(e.target.value) ? e.target.value : [])}
                      size="small"
                      sx={{ minWidth: 120, color: theme.palette.text.primary }}
                    >
                      {CATEGORY_SUB.map(sub => (
                        <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 2,
          width: "100%",
        }}>
          {articles.map(a => (
            <Box key={a.id} sx={{
              border: "1px solid #ddd",
              borderRadius: 3,
              p: 2,
              mb: 2,
              background: theme.palette.background.paper,
              boxShadow: "0 2px 8px #eee",
              display: "flex",
              flexDirection: "column",
              minHeight: 400,
              maxWidth: 400,
              transition: "box-shadow 0.2s, border-color 0.2s",
              "&:hover": {
                boxShadow: "0 4px 16px #22d3ee55, 0 2px 8px #0002",
                borderColor: "#22d3ee"
              }
            }}>
              {/* 画像（上部） */}
              <Box sx={{
                width: "100%",
                height: 140,
                borderRadius: 2,
                background: "#f3f3f3",
                mb: 1,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <img
                  src={a.thumbnailUrl || "https://placehold.co/320x120?text=No+Image"}
                  alt={a.thumbnailUrl ? `${a.title}のサムネイル画像` : "No Image"}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, display: "block" }}
                />
              </Box>
              <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, fontWeight: 700, mb: 0.5 }}>{a.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                [{a.source}] {a.published ? new Date(a.published).toLocaleDateString() : ""}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.primary, fontSize: 13 }}>{a.summary}</Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={0.5}>
                {a.labels && a.labels.map(label => (
                  <Chip key={label} label={label} size="small" sx={{ bgcolor: theme.palette.secondary.main, color: theme.palette.getContrastText(theme.palette.secondary.main), fontSize: 12, height: 22, mr: 0.5, mb: 0.5 }} />
                ))}
              </Stack>
              <Button
                variant="outlined"
                size="small"
                sx={{ my: 1, alignSelf: "flex-start" }}
                onClick={() => {
                  if (selectedIds.includes(a.id)) {
                    setSelectedIds(prev => prev.filter(id => id !== a.id));
                  } else {
                    setSelectedIds(prev => [...prev, a.id]);
                  }
                }}
              >
                {selectedIds.includes(a.id) ? "TOPICSから除外" : "このTOPICSに追加"}
              </Button>
              <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                <InputLabel sx={{ color: theme.palette.text.primary }}>大カテゴリ</InputLabel>
                <Select
                  value={editingCategories[a.id]?.main || ""}
                  onChange={e => handleCategoryChange(a.id, e.target.value, editingCategories[a.id]?.sub || [])}
                  size="small"
                  sx={{ minWidth: 100, mr: 1, color: theme.palette.text.primary }}
                >
                  <MenuItem value=""><em>未設定</em></MenuItem>
                  {CATEGORY_MAIN.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
                <InputLabel sx={{ color: theme.palette.text.primary }}>小カテゴリ</InputLabel>
                <Select
                  multiple
                  value={editingCategories[a.id]?.sub || []}
                  onChange={e => handleCategoryChange(a.id, editingCategories[a.id]?.main || "", Array.isArray(e.target.value) ? e.target.value : [])}
                  size="small"
                  sx={{ minWidth: 120, color: theme.palette.text.primary }}
                >
                  {CATEGORY_SUB.map(sub => (
                    <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                  ))}
                </Select>
              </Stack>
            </Box>
          ))}
        </Box>
      )}
      <Stack direction="row" spacing={2} mt={3} mb={2}>
        <Button variant="outlined" onClick={handleLLMAutoCategorize}>LLM自動分類</Button>
        <Button variant="contained" color="primary" onClick={handleExport}>配信テンプレート出力</Button>
        <Button variant="contained" color="secondary" onClick={fetchMonthlySummary} disabled={!topicsId || summaryLoading}>
          {summaryLoading ? "生成中..." : "月次まとめ自動生成"}
        </Button>
      </Stack>
      {monthlySummary && (
        <Box sx={{ my: 2, p: 2, border: "1px solid #aaa", borderRadius: 2, background: "#f9f9f9" }}>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>月次まとめ（自動生成）</Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.primary, whiteSpace: "pre-line" }}>
            {monthlySummary}
          </Typography>
        </Box>
      )}
    </Box>
  );
}