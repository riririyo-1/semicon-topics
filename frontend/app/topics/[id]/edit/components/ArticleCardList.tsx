"use client";

import React from 'react';
import {
  Grid, Card, CardContent, CardMedia, Typography,
  Checkbox, Chip, Stack, Box, CardActionArea, Link
} from '@mui/material';
import { Article } from './ArticleSelectionTab';

interface ArticleCardListProps {
  articles: Article[];
  selectedArticleIds: Set<number>;
  onSelectionChange: (articleId: number) => void;
}

const ArticleCardList: React.FC<ArticleCardListProps> = ({
  articles,
  selectedArticleIds,
  onSelectionChange
}) => {
  if (!articles || articles.length === 0) {
    return <Typography variant="body1">表示する記事がありません。フィルターを変更してください。</Typography>;
  }

  return (
    <Box sx={{ maxHeight: 500, overflow: 'auto', pr: 1 }}>
      <Grid container spacing={2}>
        {articles.map((article) => {
          const isSelected = selectedArticleIds.has(article.id);
          
          return (
            <Grid item xs={12} sm={6} key={article.id}>
              <Card
                variant="outlined"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative',
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  }
                }}
              >
                <CardActionArea
                  onClick={() => onSelectionChange(article.id)}
                  sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'stretch' }}
                >
                  {article.thumbnailUrl && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={article.thumbnailUrl}
                      alt={article.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, pt: article.thumbnailUrl ? 1 : 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {article.source} | {article.published 
                        ? new Date(article.published).toLocaleDateString('ja-JP')
                        : '日付不明'
                      }
                    </Typography>
                    <Typography variant="subtitle1" component="h3" gutterBottom noWrap>
                      <Link 
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        color="inherit"
                      >
                        {article.title}
                      </Link>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 1.5
                    }}>
                      {article.summary}
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {article.labels?.map((label) => (
                        <Chip
                          key={label}
                          label={label}
                          size="small"
                          sx={{ mb: 0.5, fontSize: '0.7rem' }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </CardActionArea>
                <Checkbox
                  checked={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectionChange(article.id);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '50%',
                    p: 0.5,
                  }}
                />
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ArticleCardList;