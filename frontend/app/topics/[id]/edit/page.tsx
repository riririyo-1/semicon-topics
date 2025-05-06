"use client";

import React, { useEffect } from 'react';
import { 
  Container, Box, Typography, CircularProgress, Alert, 
  useTheme 
} from '@mui/material';
import { useParams } from 'next/navigation';
import EditTabs from './components/EditTabs';
import { useTopicStore } from '../../../../stores/topicStore';

export default function EditTopicsPage() {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const { 
    isLoading, 
    error, 
    loadTopic, 
    resetState 
  } = useTopicStore();
  
  // マウント時にTOPICS情報を読み込むか、新規作成の状態に初期化する
  useEffect(() => {
    if (id === 'new') {
      resetState();
    } else {
      loadTopic(Number(id));
    }
    
    // アンマウント時にクリーンアップ
    return () => {
      resetState();
    };
  }, [id, resetState, loadTopic]);
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.text.primary }}>
          {id === 'new' ? '新規TOPICS作成' : 'TOPICS編集'}
        </Typography>
        
        {error && !error.includes('summary') && !error.includes('タイトル') && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <EditTabs />
        )}
      </Box>
    </Container>
  );
}