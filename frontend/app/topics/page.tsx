"use client";

import React from 'react';
import { Box, Typography, Container, Alert, CircularProgress, Stack, useTheme } from '@mui/material';
import useSWR from 'swr';
import { CreateTopicButton } from './components/CreateTopicButton';
import { TopicsList, Topic } from './components/TopicsList';
import { TopicSearch } from './components/TopicSearch';

// データ取得用フェッチャー関数
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('データの取得に失敗しました');
  return res.json();
});

export default function TopicsPage() {
  const theme = useTheme();
  
  // useSWRでデータ取得
  const { data: topics, error, isLoading } = useSWR<Topic[]>('/api/topics', fetcher);
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.text.primary }}>
          TOPICS配信管理
        </Typography>
        
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ flexGrow: 1 }}>
            <TopicSearch />
          </Box>
          <CreateTopicButton />
        </Stack>
        
        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message || 'TOPICSの取得中にエラーが発生しました'}
          </Alert>
        )}
        
        {/* ローディング表示 */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          topics && <TopicsList topics={topics} />
        )}
      </Box>
    </Container>
  );
}