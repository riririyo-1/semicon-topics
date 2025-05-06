"use client";

import React from 'react';
import { 
  List, ListItem, ListItemText, ListItemSecondaryAction, 
  IconButton, Paper, Typography, Box, Divider,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
// import { useTopicStore } from '../../../../../stores/topicStore'; // ストアへの直接アクセスを削除
import { TopicArticle as StoreTopicArticle } from '../../../../../stores/topicStore'; // 型のみインポート

interface SelectedTopicsListProps {
  articles: StoreTopicArticle[]; // 親からソート済みの記事リストを受け取る
  selectedArticleIds: Set<number>;
  onSelectionChange: (articleId: number) => void;
  onMoveUp: (articleId: number) => void;
  onMoveDown: (articleId: number) => void;
  onRemove: (articleId: number) => void;
}

const SelectedTopicsList: React.FC<SelectedTopicsListProps> = ({
  articles,
  selectedArticleIds,
  onSelectionChange,
  onMoveUp,
  onMoveDown,
  onRemove
}) => {
  // const { articles, removeArticle, updateArticleOrder } = useTopicStore(); // 削除
  
  // 表示順でソート (親コンポーネントで行うため削除)
  // const sortedArticles = [...articles].sort((a, b) => a.displayOrder - b.displayOrder);
  
  // 記事を上に移動 (親コンポーネントのコールバックを呼ぶ)
  const handleMoveUp = (articleId: number) => {
    onMoveUp(articleId);
  };
  
  // 記事を下に移動 (親コンポーネントのコールバックを呼ぶ)
  const handleMoveDown = (articleId: number) => {
    onMoveDown(articleId);
  };

  const handleRemove = (articleId: number) => {
    onRemove(articleId);
  };
  
  if (articles.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, height: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          左側のリストから記事を選択するか、検索して追加してください
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper variant="outlined" sx={{ maxHeight: '100%', height: '100%', overflow: 'auto' }}>
      <List disablePadding>
        {articles.map((article, index) => (
          <React.Fragment key={article.id}>
            {index > 0 && <Divider />}
            <ListItem
              selected={selectedArticleIds.has(article.id)}
              onClick={() => onSelectionChange(article.id)}
              sx={{ 
                cursor: 'pointer',
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'action.selected',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <Tooltip title="上に移動">
                  <span>
                    <IconButton 
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleMoveUp(article.id); }}
                      disabled={index === 0}
                      sx={{ mr: 0.5 }}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="下に移動">
                  <span>
                    <IconButton 
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleMoveDown(article.id); }}
                      disabled={index === articles.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <ListItemText
                primary={article.title}
                secondary={`${article.source || '出典不明'} | ${article.published ? new Date(article.published).toLocaleDateString('ja-JP') : '日付不明'}`}
                primaryTypographyProps={{
                  variant: 'body2',
                  noWrap: true,
                  sx: { maxWidth: '90%' }
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  noWrap: true
                }}
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleRemove(article.id); }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default SelectedTopicsList;