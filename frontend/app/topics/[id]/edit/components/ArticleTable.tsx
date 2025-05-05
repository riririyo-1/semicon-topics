"use client";

import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Checkbox, Chip,
  Typography, Link
} from '@mui/material';
import { Article } from './ArticleSelectionTab';

interface ArticleTableProps {
  articles: Article[];
  selectedArticleIds: Set<number>;
  onSelectionChange: (articleId: number) => void;
}

const ArticleTable: React.FC<ArticleTableProps> = ({
  articles,
  selectedArticleIds,
  onSelectionChange
}) => {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={{ bgcolor: 'background.paper' }}>
              <Checkbox 
                indeterminate={selectedArticleIds.size > 0 && selectedArticleIds.size < articles.length} 
                checked={articles.length > 0 && selectedArticleIds.size === articles.length}
                onChange={() => {
                  if (selectedArticleIds.size === articles.length) {
                    // すべて選択解除
                    articles.forEach(article => {
                      if (selectedArticleIds.has(article.id)) {
                        onSelectionChange(article.id);
                      }
                    });
                  } else {
                    // すべて選択
                    articles.forEach(article => {
                      if (!selectedArticleIds.has(article.id)) {
                        onSelectionChange(article.id);
                      }
                    });
                  }
                }}
              />
            </TableCell>
            <TableCell sx={{ bgcolor: 'background.paper' }}>タイトル</TableCell>
            <TableCell sx={{ bgcolor: 'background.paper' }}>出典</TableCell>
            <TableCell sx={{ bgcolor: 'background.paper' }}>公開日</TableCell>
            <TableCell sx={{ bgcolor: 'background.paper' }}>ラベル</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {articles.map((article) => {
            const isSelected = selectedArticleIds.has(article.id);
            
            return (
              <TableRow 
                key={article.id}
                hover
                selected={isSelected}
                onClick={() => onSelectionChange(article.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()} // クリックイベントの伝播を止める
                    onChange={() => onSelectionChange(article.id)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                    <Link href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </Link>
                  </Typography>
                </TableCell>
                <TableCell>{article.source}</TableCell>
                <TableCell>
                  {article.published 
                    ? new Date(article.published).toLocaleDateString('ja-JP')
                    : '不明'
                  }
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: 200 }}>
                    {article.labels?.map((label) => (
                      <Chip 
                        key={label} 
                        label={label} 
                        size="small" 
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ArticleTable;