"use client";

import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Stack, Card, CardContent, CardActions, Chip, Badge, IconButton, Tooltip, CircularProgress,
  Grid
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import PreviewIcon from "@mui/icons-material/Preview";

type Topic = {
  id: string;
  month: string;
  title: string;
  articleCount: number;
  summary: string;
  createdAt: string;
  updatedAt: string;
  hasTemplate: boolean;
};

export default function TopicsListPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/topics");
        const data = await res.json();
        setTopics(data);
      } catch (e) {
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  // 編集・新規作成・テンプレ履歴・プレビュー等のハンドラは後で実装
  const handleEdit = (id: string) => {};
  const handleCreate = () => {};
  const handleDownload = (id: string) => {};
  const handlePreview = (id: string) => {};

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>TOPICS一覧</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ borderRadius: 3 }}
        >
          新規作成
        </Button>
      </Stack>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {topics.map(topic => (
            // MUI v7では通常のGridを使用し、適切な属性を設定します
            <Grid item xs={12} md={6} lg={4} key={topic.id}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, position: "relative" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Chip label={topic.month} color="primary" size="small" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{topic.title}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {topic.summary && topic.summary.length > 40 ? topic.summary.slice(0, 40) + "..." : topic.summary}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Chip label={`記事数: ${topic.articleCount}`} size="small" />
                    <Chip label={`作成: ${topic.createdAt}`} size="small" />
                    <Chip label={`更新: ${topic.updatedAt}`} size="small" />
                  </Stack>
                  {topic.hasTemplate && (
                    <Badge color="success" badgeContent="出力済" sx={{ mr: 1 }}>
                      <DownloadIcon fontSize="small" />
                    </Badge>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end" }}>
                  <Tooltip title="プレビュー">
                    <IconButton onClick={() => handlePreview(topic.id)}>
                      <PreviewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ダウンロード">
                    <span>
                      <IconButton
                        onClick={() => handleDownload(topic.id)}
                        disabled={!topic.hasTemplate}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="編集">
                    <IconButton onClick={() => handleEdit(topic.id)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}