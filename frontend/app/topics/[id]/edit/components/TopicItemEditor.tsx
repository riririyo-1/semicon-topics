"use client";

import React from 'react';
import { 
  Typography, Box, Grid, FormControl, InputLabel, 
  Select, MenuItem, Paper, Chip, Link, 
  SelectChangeEvent, Stack
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTopicStore, TopicArticle } from '../../../../../stores/topicStore';

// カテゴリ選択肢の定義
const CATEGORIES = {
  major: [
    '技術動向', '市場動向', 'ビジネス', '製造技術', '研究開発',
    'デバイス', '設計', '材料', '半導体装置', 'テスト・検査',
    '実装', 'その他', '未分類'
  ],
  minor: [
    'プロセス', 'ロジック', 'メモリ', 'パワー半導体', 'センサー',
    'アナログ', 'FPGA', 'MCU', 'AI', 'ファウンドリ', 'IDM',
    'サプライチェーン', 'M&A', '決算', 'スタートアップ', 'イベント',
    'ニュース一般', 'その他', '未分類'
  ]
};

interface TopicItemEditorProps {
  article: TopicArticle;
}

const TopicItemEditor: React.FC<TopicItemEditorProps> = ({ article }) => {
  const { updateArticleCategory, autoCategorizeArticle, isCategorizing } = useTopicStore();
  
  // カテゴリ変更ハンドラ（大カテゴリ）
  const handleMajorCategoryChange = (e: SelectChangeEvent) => {
    updateArticleCategory(article.id, {
      categoryMajor: e.target.value
    });
  };
  
  // カテゴリ変更ハンドラ（小カテゴリ） 単一選択
  const handleMinorCategoryChange = (e: SelectChangeEvent) => {
    updateArticleCategory(article.id, {
      categoryMinor: [e.target.value]
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* @ts-ignore */}
        <Grid item xs={12}>
          <Typography variant="subtitle1">
            <Link href={article.url} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center' }}>
              {article.title}
              <OpenInNewIcon fontSize="small" sx={{ ml: 0.5 }} />
            </Link>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {article.source} | {article.published ? new Date(article.published).toLocaleDateString('ja-JP') : '日付不明'}
          </Typography>
          
          <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={1}>
            {article.labels?.map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                sx={{ mb: 0.5, fontSize: '0.7rem' }}
              />
            ))}
          </Stack>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {article.summary}
          </Typography>
        </Grid>
        
        {/* @ts-ignore */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id={`major-category-label-${article.id}`}>大カテゴリ</InputLabel>
            <Select
              labelId={`major-category-label-${article.id}`}
              id={`major-category-${article.id}`}
              value={article.categoryMajor || '未分類'}
              label="大カテゴリ"
              onChange={handleMajorCategoryChange}
            >
              {CATEGORIES.major.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* @ts-ignore */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id={`minor-category-label-${article.id}`}>小カテゴリ</InputLabel>
            <Select
              labelId={`minor-category-label-${article.id}`}
              id={`minor-category-${article.id}`}
              value={article.categoryMinor && article.categoryMinor.length > 0 ? article.categoryMinor[0] : ''}
              label="小カテゴリ"
              onChange={handleMinorCategoryChange}
            >
              {CATEGORIES.minor.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* @ts-ignore */}
        <Grid item xs={12} sm={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <LoadingButton
            variant="outlined"
            size="small"
            loading={isCategorizing[article.id] || false}
            startIcon={<AutoFixHighIcon />}
            onClick={() => autoCategorizeArticle(article.id)}
          >
            LLM自動分類
          </LoadingButton>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TopicItemEditor;