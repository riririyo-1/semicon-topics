"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Chip, Stack, CircularProgress, Alert } from "@mui/material";

type PestTags = { P: string[]; E: string[]; S: string[]; T: string[]; };
type Article = {
  id: number;
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  labels: string[];
  pest_tags: PestTags;
};

export default function TopicsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/articles")
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // PESTカテゴリごとの集計
  const pestStats = { P: new Map<string, number>(), E: new Map(), S: new Map(), T: new Map() };
  articles.forEach(a => {
    if (a.pest_tags) {
      Object.entries(a.pest_tags).forEach(([cat, tags]) => {
        tags.forEach(tag => {
          pestStats[cat as keyof PestTags].set(tag, (pestStats[cat as keyof PestTags].get(tag) || 0) + 1);
        });
      });
    }
  });

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>PEST分析・トピック一覧</Typography>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <Box>
          {["P", "E", "S", "T"].map(cat => (
            <Box key={cat} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {cat === "P" ? "P: 政治" : cat === "E" ? "E: 経済" : cat === "S" ? "S: 社会" : "T: 技術"}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Array.from(pestStats[cat as keyof PestTags].entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 20)
                  .map(([tag, count]) => (
                    <Chip
                      key={tag}
                      label={`${tag} (${count})`}
                      size="small"
                      sx={{
                        bgcolor: cat === "P" ? "#fee2e2"
                          : cat === "E" ? "#fef9c3"
                          : cat === "S" ? "#d1fae5"
                          : "#e0e7ff",
                        color: cat === "P" ? "#b91c1c"
                          : cat === "E" ? "#b45309"
                          : cat === "S" ? "#047857"
                          : "#3730a3",
                        fontWeight: 700,
                        mr: 0.5, mb: 0.5
                      }}
                    />
                  ))}
              </Stack>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}