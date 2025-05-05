'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import { useTopicStore } from '../../../../../stores/topicStore';
import SummaryEditor from './SummaryEditor';
import TopicItemEditor from './TopicItemEditor';

const TemplateOutputTab: React.FC = () => {
  const { articles, setActiveTab } = useTopicStore();

  // 表示順でソートした記事
  const sortedArticles = [...articles].sort((a, b) => a.displayOrder - b.displayOrder);
  
  // プレビュータブへの切り替え
  const handlePreviewClick = () => {
    setActiveTab(2); // プレビュータブのインデックス
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>月次まとめ</Typography>
        <SummaryEditor />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>カテゴリ設定</Typography>
        {articles.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            記事がありません。前のタブで記事を選択してください。
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              各記事のカテゴリを設定してください。LLM自動分類ボタンで、AIがカテゴリを提案します。
            </Typography>
            {sortedArticles.map((article, index) => (
              <Box key={article.id} sx={{ mb: 2, pb: 2, borderBottom: index < sortedArticles.length - 1 ? '1px solid #eee' : 'none' }}>
                <TopicItemEditor 
                  article={article}
                />
              </Box>
            ))}
          </>
        )}
      </Box>
      
      {articles.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PreviewIcon />}
            onClick={handlePreviewClick}
          >
            プレビュー表示
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default TemplateOutputTab;