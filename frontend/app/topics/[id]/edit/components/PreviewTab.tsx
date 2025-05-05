'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Divider,
  Button,
  Card,
  CardContent,
  Link,
  Chip,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useTopicStore } from '@/stores/topicStore';

export default function PreviewTab() {
  // Zustand storeから状態と関数を取得
  const {
    title,
    summary,
    articles,
    createdAt,
    updatedAt,
    setActiveTab
  } = useTopicStore(state => ({
    title: state.title,
    summary: state.summary,
    articles: state.articles,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    setActiveTab: state.setActiveTab
  }));

  // 記事が1つもない場合の表示
  if (articles.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        「記事選択」タブで記事を選択してください。
      </Alert>
    );
  }

  // 記事を大カテゴリでグループ化
  const articlesByCategory = articles.reduce((acc, article) => {
    const category = article.categoryMajor || 'その他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(article);
    return acc;
  }, {} as Record<string, typeof articles>);

  // カテゴリごとにソート
  const sortedCategories = Object.keys(articlesByCategory).sort((a, b) => {
    // '世の中の動き'を最初に
    if (a === '世の中の動き') return -1;
    if (b === '世の中の動き') return 1;
    // '半導体/電子部品業界の動き'を次に
    if (a === '半導体/電子部品業界の動き') return -1;
    if (b === '半導体/電子部品業界の動き') return 1;
    // '半導体製造装置業界の動き'をその次に
    if (a === '半導体製造装置業界の動き') return -1;
    if (b === '半導体製造装置業界の動き') return 1;
    // 'その他'を最後に
    if (a === 'その他') return 1;
    if (b === 'その他') return -1;
    // その他の場合はアルファベット順
    return a.localeCompare(b);
  });

  // テンプレート出力タブに戻るハンドラー
  const handleEditClick = () => {
    setActiveTab('templateOutput');
  };

  // 日付のフォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <Box>
      {/* タイトルと日付情報 */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {title || 'TOPICSプレビュー'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', mb: 2 }}>
          <Typography variant="body2">
            作成日: {formatDate(createdAt)}
          </Typography>
          <Typography variant="body2">
            更新日: {formatDate(updatedAt)}
          </Typography>
        </Box>

        {/* まとめ表示 */}
        {summary && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              まとめ
            </Typography>
            <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
              {summary}
            </Typography>
          </Box>
        )}

        {!summary && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            まとめが未設定です。「テンプレート出力」タブで設定してください。
          </Alert>
        )}
      </Paper>

      {/* カテゴリ別記事一覧 */}
      {sortedCategories.map(category => (
        <Box key={category} sx={{ mb: 5 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            pl: 2,
            py: 1
          }}>
            {category}
          </Typography>

          <Grid container spacing={3}>
            {articlesByCategory[category]
              .slice()
              .sort((a, b) => {
                // まず小カテゴリでソート
                if (a.categoryMinor && b.categoryMinor) {
                  const categoryCompare = a.categoryMinor.localeCompare(b.categoryMinor);
                  if (categoryCompare !== 0) return categoryCompare;
                }
                // 次に表示順でソート
                return a.displayOrder - b.displayOrder;
              })
              .map(article => (
                <Grid item xs={12} md={6} key={article.id}>
                  <Card variant="outlined">
                    <CardContent>
                      {/* 小カテゴリタグ */}
                      {article.categoryMinor && (
                        <Chip 
                          label={article.categoryMinor} 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      )}
                      
                      {/* 記事タイトル */}
                      <Typography variant="h6" gutterBottom>
                        {article.title}
                      </Typography>
                      
                      {/* 記事メタ情報 */}
                      <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                        <Box component="span" sx={{ mr: 2 }}>
                          出典: {article.source || '不明'}
                        </Box>
                        <Box component="span">
                          公開日: {article.published ? new Date(article.published).toLocaleDateString('ja-JP') : '日付不明'}
                        </Box>
                      </Box>
                      
                      {/* 記事URL */}
                      <Link 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ display: 'block', mb: 1, fontSize: '0.875rem', wordBreak: 'break-all' }}
                      >
                        {article.url}
                      </Link>
                      
                      {/* 記事要約（あれば表示） */}
                      {article.summary && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {article.summary}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      ))}

      {/* 編集ボタン */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleEditClick}
          startIcon={<EditIcon />}
        >
          テンプレート出力に戻る
        </Button>
      </Box>
    </Box>
  );
}