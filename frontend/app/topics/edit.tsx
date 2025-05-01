"use client";

import React, { useState } from "react";
import {
  Box, Typography, TextField, Button, Stack, Chip, Paper, Divider, CircularProgress
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale/ja";

export default function TopicsEditPage() {
  // 編集用state
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState<Date | null>(new Date());
  const [selectedArticles, setSelectedArticles] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // 記事絞り込み・選択モーダルは後で実装
  const handleOpenArticleFilter = () => {};

  // 月次まとめ自動生成API呼び出し（ダミー）
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setTimeout(() => {
      setMonthlySummary("（ここに自動生成された月次まとめが入ります）");
      setSummaryLoading(false);
    }, 1200);
  };

  // 保存・出力ボタンのハンドラは後で実装
  const handleSave = () => {};
  const handleExport = () => {};

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>TOPICS編集</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="タイトル"
            value={title}
            onChange={e => setTitle(e.target.value)}
            fullWidth
          />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <DatePicker
              label="月"
              views={["year", "month"]}
              value={month}
              onChange={setMonth}
              format="yyyy/MM"
              slotProps={{
                textField: { fullWidth: true }
              }}
            />
          </LocalizationProvider>
          <Button variant="outlined" onClick={handleOpenArticleFilter}>
            記事絞り込み・選択
          </Button>
          <Divider />
          <Typography variant="subtitle1" fontWeight={700}>選択済み記事</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {selectedArticles.length === 0 ? (
              <Typography color="text.secondary">記事が選択されていません</Typography>
            ) : (
              selectedArticles.map(a => (
                <Chip key={a.id} label={a.title} sx={{ mb: 1 }} />
              ))
            )}
          </Stack>
        </Stack>
      </Paper>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>月次まとめ</Typography>
            <Button variant="contained" onClick={handleGenerateSummary} disabled={summaryLoading}>
              {summaryLoading ? <CircularProgress size={20} /> : "自動生成"}
            </Button>
          </Stack>
          <TextField
            label="月次まとめ（200~500文字）"
            value={monthlySummary}
            onChange={e => setMonthlySummary(e.target.value)}
            multiline
            minRows={4}
            fullWidth
            inputProps={{ maxLength: 500 }}
            helperText={`${monthlySummary.length}/500`}
          />
        </Stack>
      </Paper>
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="outlined" onClick={handleExport}>配信テンプレート出力</Button>
        <Button variant="contained" onClick={handleSave}>保存</Button>
      </Stack>
    </Box>
  );
}