"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Chip, Stack, CircularProgress, Alert, Button, Paper, Divider } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

type Article = {
  id: number;
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  labels: string[];
  content: string;
  thumbnailUrl: string;
};

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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

  const handleBack = () => {
    router.push('/articles');
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
  
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!article) return <Typography>記事が見つかりません</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, mb: 6, px: 2 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        記事一覧に戻る
      </Button>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            ID: {article.id}
          </Typography>
        </Box>
        
        <Typography variant="h5" gutterBottom fontWeight="bold">{article.title}</Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          [{article.source}] {article.published ? new Date(article.published).toLocaleDateString() : ""}
        </Typography>
        
        {article.thumbnailUrl && (
          <Box sx={{ position: 'relative', height: 300, mb: 3, borderRadius: 1, overflow: 'hidden' }}>
            <Image
              src={article.thumbnailUrl}
              alt={article.title}
              fill
              style={{ objectFit: 'cover' }}
            />
          </Box>
        )}
        
        <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>要約</Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>{article.summary}</Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>タグ</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
          {article.labels && article.labels.map(label => (
            <Chip key={label} label={label} size="small" sx={{ bgcolor: "#e0e7ff", color: "#3730a3" }} />
          ))}
        </Stack>
        
        {article.content && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>本文</Typography>
            <Typography variant="body2" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
              {article.content}
            </Typography>
          </>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained"
            color="primary"
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<OpenInNewIcon />}
            sx={{ fontWeight: 600 }}
          >
            元記事を読む
          </Button>
        </Box>
      </Paper>
      
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={handleBack}
      >
        記事一覧に戻る
      </Button>
    </Box>
  );
}