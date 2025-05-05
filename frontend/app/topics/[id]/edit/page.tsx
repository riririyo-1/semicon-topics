'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useTopicStore } from '@/stores/topicStore';
import EditTabs from './components/EditTabs';

export default function TopicEditPage() {
  const params = useParams();
  const topicIdParam = params?.id; // id は string または string[] の可能性がある

  // ストアのアクションと状態を取得
  const { loadTopic, resetState, isLoading, error, title, id: storeId } = useTopicStore((state) => ({
    loadTopic: state.loadTopic,
    resetState: state.resetState,
    isLoading: state.isLoading,
    error: state.error,
    title: state.title,
    id: state.id,
  }));

  const isNew = topicIdParam === 'new';

  useEffect(() => {
    // マウント時に初期化またはデータ読み込み
    if (isNew) {
      console.log("Initializing for new topic...");
      resetState(); // 新規作成時は状態をリセット
    } else if (topicIdParam && typeof topicIdParam === 'string') {
      const topicId = parseInt(topicIdParam, 10);
      if (!isNaN(topicId)) {
        console.log(`Loading topic with ID: ${topicId}`);
        loadTopic(topicId);
      } else {
        // 不正なIDの場合のエラーハンドリング（必要に応じて）
        console.error("Invalid topic ID parameter:", topicIdParam);
      }
    }

    // アンマウント時に状態をリセット
    return () => {
      console.log("Resetting state on unmount...");
      resetState();
    };
    // isNew, topicIdParam, loadTopic, resetState を依存配列に追加
  }, [isNew, topicIdParam, loadTopic, resetState]);

  const pageTitle = isNew ? '新規TOPICS作成' : (isLoading ? '読み込み中...' : (title || `TOPICS編集 (ID: ${storeId})`));

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {pageTitle}
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !isLoading && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {/* データロード完了後、または新規作成時にタブを表示 */}
        {(!isLoading || isNew) && !error && <EditTabs />}
      </Box>
    </Container>
  );
}