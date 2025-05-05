'use client';

import React from 'react';
import { TextField, Button, Alert, Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useTopicStore } from '../../../../../stores/topicStore';

const SummaryEditor: React.FC = () => {
  const { 
    summary, 
    setSummary, 
    generateSummary, 
    isGeneratingSummary, 
    error 
  } = useTopicStore();
  
  return (
    <Box>
      {error && error.includes('summary') && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TextField
        label="月次まとめ"
        multiline
        rows={6}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="今月の半導体業界の動向をまとめた文章を入力してください。"
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
      />
      
      <LoadingButton
        variant="outlined"
        color="primary"
        loading={isGeneratingSummary}
        startIcon={<AutoFixHighIcon />}
        onClick={generateSummary}
      >
        LLM自動まとめ文章生成
      </LoadingButton>
    </Box>
  );
};

export default SummaryEditor;