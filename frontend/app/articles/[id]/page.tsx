"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Chip, Stack, CircularProgress, Alert } from "@mui/material";
import { useParams } from "next/navigation";

type Article = {
  id: number;
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  labels: string[];
};

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${id}`)
      .then(res => res.json())
      .then(data => {
        setArticle(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!article) return <Typography>記事が見つかりません</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>{article.title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        [{article.source}] {article.published ? new Date(article.published).toLocaleDateString() : ""}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>{article.summary}</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
        {article.labels && article.labels.map(label => (
          <Chip key={label} label={label} size="small" sx={{ bgcolor: "#e0e7ff", color: "#3730a3" }} />
        ))}
      </Stack>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <a href={article.url} target="_blank" rel="noopener noreferrer">元記事を読む</a>
      </Typography>
    </Box>
  );
}