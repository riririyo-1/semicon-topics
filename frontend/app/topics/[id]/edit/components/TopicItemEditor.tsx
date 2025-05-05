'use client';

import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Link,
  Divider,
  Chip
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { TopicArticle } from '@/types';
import { useTopicStore } from '@/stores/topicStore';

// 大カテゴリの選択肢
const MAJOR_CATEGORIES = [
  '世の中の動き',
  '半導体/電子部品業界の動き', 
  '半導体製造装置業界の動き',
  'その他'
];

// 小カテゴリの選択肢
const MINOR_CATEGORIES = [
  'テクノロジー動向',
  'ビジネス戦略',
  '市場予測・分析',
  '法律・規制変更',
  '地政学リスク',
  '環境・持続可能性',
  '研究開発',
  'M&A・提携',
  '人事・組織',
  'その他'
];

interface TopicItemEditorProps {
  article: TopicArticle;
  index: number;
}

export default function TopicItemEditor({ article, index }: TopicItemEditorProps) {
  // Zustand storeからカテゴリ更新および自動分類関数を取得
  const { 
    updateArticleCategory, 
    autoCategorizeArticle,
    isCategorizing
  } = useTopicStore(state => ({
    updateArticleCategory: state.updateArticleCategory,
    autoCategorizeArticle: state.autoCategorizeArticle,
    isCategorizing: state.isCategorizing
  }));

  // この記事のカテゴリ自動設定中かどうか
  const isLoadingCategories = isCategorizing[article.id] || false;

  // ソース表示用の整形
  const formattedSource = article.source ? article.source : '不明';
  
  // 日付表示用の整形
  const formattedDate = article.published ? 
    new Date(article.published).toLocaleDateString('ja-JP') : 
    '日付不明';

  // カテゴリ変更ハンドラー
  const handleMajorCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    updateArticleCategory(article.id, event.target.value as string, article.categoryMinor);
  };

  const handleMinorCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    updateArticleCategory(article.id, article.categoryMajor, event.target.value as string);
  };

  // カテゴリ自動設定ハンドラー
  const handleAutoCategorize = async () => {
    try {
      await autoCategorizeArticle(article.id);
    } catch (error) {
      console.error(`Failed to auto-categorize article ${article.id}:`, error);
    }
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 3, 
        mb: 3,
        position: 'relative'
      }}
    >
      {/* 記事番号表示 */}
      <Chip 
        label={`#${index + 1}`} 
        size="small" 
        color="primary" 
        sx={{ 
          position: 'absolute',
          top: 8,
          right: 8
        }} 
      />
      
      {/* 記事タイトルと基本情報 */}
      <Typography variant="h6" gutterBottom>
        {article.title}
      </Typography>

      <Box sx={{ mb: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
        <Box component="span" sx={{ mr: 2 }}>
          出典: {formattedSource}
        </Box>
        <Box component="span">
          公開日: {formattedDate}
        </Box>
      </Box>
      
      {/* 記事URL */}
      <Link 
        href={article.url} 
        target="_blank" 
        rel="noopener noreferrer"
        sx={{ display: 'block', mb: 2, wordBreak: 'break-all' }}
      >
        {article.url}
      </Link>

      {/* 要約（あれば表示） */}
      {article.summary && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          {article.summary}
        </Typography>
      )}
      
      <Divider sx={{ my: 2 }} />

      {/* カテゴリ選択セクション */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, mt: 2, gap: 2 }}>
        {/* 大カテゴリ選択 */}
        <FormControl variant="outlined" fullWidth>
          <InputLabel id={`major-category-label-${article.id}`}>大カテゴリ</InputLabel>
          <Select
            labelId={`major-category-label-${article.id}`}
            value={article.categoryMajor || ''}
            onChange={handleMajorCategoryChange}
            label="大カテゴリ"
          >
            <MenuItem value="">
              <em>未選択</em>
            </MenuItem>
            {MAJOR_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 小カテゴリ選択 */}
        <FormControl variant="outlined" fullWidth>
          <InputLabel id={`minor-category-label-${article.id}`}>小カテゴリ</InputLabel>
          <Select
            labelId={`minor-category-label-${article.id}`}
            value={article.categoryMinor || ''}
            onChange={handleMinorCategoryChange}
            label="小カテゴリ"
          >
            <MenuItem value="">
              <em>未選択</em>
            </MenuItem>
            {MINOR_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 自動カテゴリ設定ボタン */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LoadingButton
            variant="outlined"
            color="secondary"
            onClick={handleAutoCategorize}
            loading={isLoadingCategories}
            loadingPosition="start"
            startIcon={<AutoFixHighIcon />}
            sx={{ whiteSpace: 'nowrap', minWidth: '200px' }}
          >
            LLMによる自動分類
          </LoadingButton>
        </Box>
      </Box>
    </Paper>
  );
}