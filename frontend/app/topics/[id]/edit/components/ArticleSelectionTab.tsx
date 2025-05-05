"use client";

import React, { useState, useEffect } from 'react';
import { 
  Grid, Box, IconButton, Typography, Alert, 
  CircularProgress, ToggleButtonGroup, ToggleButton 
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TableViewIcon from '@mui/icons-material/TableView';
import GridViewIcon from '@mui/icons-material/GridView';
import { useTopicStore } from '../../../../../stores/topicStore';
import ArticleFilter from './ArticleFilter';
import ArticleSearch from './ArticleSearch';
import ArticleTable from './ArticleTable';
import ArticleCardList from './ArticleCardList';
import SelectedTopicsList from './SelectedTopicsList';

// 記事の型定義
export interface Article {
  id: number;
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  labels: string[];
  thumbnailUrl?: string;
}

// フィルターの型定義
export interface ArticleFilters {
  startDate: Date | null;
  endDate: Date | null;
  labels: string[];
  page: number;
  limit: number;
}

const ArticleSelectionTab: React.FC = () => {
  const { addArticles } = useTopicStore();
  
  // ローカルステート
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<number>>(new Set());
  const [articles, setArticles] = useState<Article[]>([]);
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ArticleFilters>({
    startDate: null,
    endDate: null,
    labels: [],
    page: 1,
    limit: 20,
  });

  // フィルターが変更されたらAPIリクエスト
  useEffect(() => {
    const fetchArticles = async () => {
      setIsArticleLoading(true);
      setArticleError(null);
      
      try {
        // クエリパラメータの構築
        const queryParams = new URLSearchParams();
        
        if (filters.startDate) {
          queryParams.append('startDate', filters.startDate.toISOString().split('T')[0]);
        }
        
        if (filters.endDate) {
          queryParams.append('endDate', filters.endDate.toISOString().split('T')[0]);
        }
        
        filters.labels.forEach(label => {
          queryParams.append('labels', label);
        });
        
        queryParams.append('page', filters.page.toString());
        queryParams.append('limit', filters.limit.toString());
        
        // APIリクエスト
        const response = await fetch(`/api/articles?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('記事の取得に失敗しました');
        }
        
        const data = await response.json();
        setArticles(data.items || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setArticleError(error instanceof Error ? error.message : '記事の取得中にエラーが発生しました');
      } finally {
        setIsArticleLoading(false);
      }
    };
    
    fetchArticles();
  }, [filters]);

  // フィルター変更ハンドラー
  const handleFilterChange = (newFilters: Partial<ArticleFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // フィルター変更時はページを1に戻す
  };

  // 選択状態の切り替え
  const handleSelectionChange = (articleId: number) => {
    setSelectedArticleIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(articleId)) {
        newSelection.delete(articleId);
      } else {
        newSelection.add(articleId);
      }
      return newSelection;
    });
  };

  // 表示形式の切り替え
  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'table' | 'card' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // 選択した記事をTOPICに追加
  const handleAddSelectedArticles = () => {
    const selectedArticles = articles.filter(article => selectedArticleIds.has(article.id));
    addArticles(selectedArticles);
    setSelectedArticleIds(new Set()); // 選択をクリア
  };

  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6}>
          <Typography variant="h6" gutterBottom>記事一覧</Typography>
          <Box sx={{ mb: 2 }}>
            <ArticleFilter 
              initialFilters={filters} 
              onFilterChange={handleFilterChange} 
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <ArticleSearch 
              onArticleSelect={(article) => {
                addArticles([article]);
              }} 
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              {articleError ? '0' : `${articles.length}`}件の記事
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="table" aria-label="table view">
                <TableViewIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="card" aria-label="card view">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {articleError ? (
            <Alert severity="error">{articleError}</Alert>
          ) : isArticleLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            viewMode === 'table' ? (
              <ArticleTable 
                articles={articles}
                selectedArticleIds={selectedArticleIds}
                onSelectionChange={handleSelectionChange}
              />
            ) : (
              <ArticleCardList 
                articles={articles}
                selectedArticleIds={selectedArticleIds}
                onSelectionChange={handleSelectionChange}
              />
            )
          )}
        </Grid>
        
        <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconButton
            color="primary"
            onClick={handleAddSelectedArticles}
            disabled={selectedArticleIds.size === 0}
            sx={{ 
              border: '1px dashed',
              borderColor: 'primary.main',
              p: 1
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Grid>
        
        <Grid item xs={5}>
          <Typography variant="h6" gutterBottom>選択済み記事</Typography>
          <SelectedTopicsList />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ArticleSelectionTab;
