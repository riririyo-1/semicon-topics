"use client";

import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress, Alert, Stack } from "@mui/material";

type BatchType = "summarize";

export default function SummarizePage() {
  const [loading, setLoading] = useState<BatchType | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBatch = async () => {
    setLoading("summarize");
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 20 }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(JSON.stringify(data));
      } else {
        setError(data.error || "APIエラー");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>AIバッチ実行</Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <Button
          variant="contained"
          color="primary"
          disabled={loading !== null}
          onClick={handleBatch}
        >
          要約生成
        </Button>
        {loading && <CircularProgress size={24} />}
      </Stack>
      {result && <Alert severity="success" sx={{ whiteSpace: "pre-wrap" }}>{result}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
}