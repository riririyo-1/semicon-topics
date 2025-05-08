"use client";

import React from 'react';
import { Box, Typography, Alert, CircularProgress, Stack, useTheme } from '@mui/material';
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
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
  const { data: topics, error, isLoading } = useSWR<Topic[]>(`/api/topics${searchParam}`, fetcher);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  return (
    <Box sx={{ my: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.text.primary }}>
          TOPICS配信管理
        </Typography>
        <CreateTopicButton />
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <TopicSearch inputValue={searchInput} onInputChange={setSearchInput} onSearch={handleSearch} />
        </Box>
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
  );
}