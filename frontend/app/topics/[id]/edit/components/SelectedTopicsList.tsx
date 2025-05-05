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
import { useTopicStore } from '../../../../../stores/topicStore';

const SelectedTopicsList: React.FC = () => {
  const { articles, removeArticle, updateArticleOrder } = useTopicStore();
  
  // 表示順でソート
  const sortedArticles = [...articles].sort((a, b) => a.displayOrder - b.displayOrder);
  
  // 記事を上に移動
  const handleMoveUp = (articleId: number) => {
    const currentIndex = sortedArticles.findIndex(a => a.id === articleId);
    if (currentIndex <= 0) return; // 既に先頭の場合は何もしない
    
    const newOrder = sortedArticles[currentIndex - 1].displayOrder;
    const prevOrder = sortedArticles[currentIndex].displayOrder;
    
    updateArticleOrder(articleId, newOrder);
    updateArticleOrder(sortedArticles[currentIndex - 1].id, prevOrder);
  };
  
  // 記事を下に移動
  const handleMoveDown = (articleId: number) => {
    const currentIndex = sortedArticles.findIndex(a => a.id === articleId);
    if (currentIndex === -1 || currentIndex >= sortedArticles.length - 1) return;
    
    const newOrder = sortedArticles[currentIndex + 1].displayOrder;
    const prevOrder = sortedArticles[currentIndex].displayOrder;
    
    updateArticleOrder(articleId, newOrder);
    updateArticleOrder(sortedArticles[currentIndex + 1].id, prevOrder);
  };
  
  if (sortedArticles.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, height: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          左側のリストから記事を選択してください
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
      <List disablePadding>
        {sortedArticles.map((article, index) => (
          <React.Fragment key={article.id}>
            {index > 0 && <Divider />}
            <ListItem>
              <Box sx={{ display: 'flex', mr: 1 }}>
                <Tooltip title="上に移動">
                  <span>
                    <IconButton 
                      size="small"
                      onClick={() => handleMoveUp(article.id)}
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
                      onClick={() => handleMoveDown(article.id)}
                      disabled={index === sortedArticles.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <ListItemText
                primary={article.title}
                secondary={`${article.source} | ${article.published ? new Date(article.published).toLocaleDateString('ja-JP') : '日付不明'}`}
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
                  onClick={() => removeArticle(article.id)}
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