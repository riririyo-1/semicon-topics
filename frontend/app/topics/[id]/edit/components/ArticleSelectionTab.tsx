"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Alert, 
  CircularProgress, ToggleButtonGroup, ToggleButton,
  Paper, Divider, IconButton, TextField // TextField を追加
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TableViewIcon from '@mui/icons-material/TableView';
import GridViewIcon from '@mui/icons-material/GridView';
import { useTopicStore, TopicArticle as StoreTopicArticle } from '../../../../../stores/topicStore'; // TopicArticle を StoreTopicArticle としてインポート
import ArticleFilter from './ArticleFilter';
import ArticleTable from './ArticleTable';
import ArticleCardList from './ArticleCardList';
import SelectedTopicsList from './SelectedTopicsList';
import { motion, AnimatePresence } from 'framer-motion';
import { Article, ArticleFilters, TopicArticle } from '../../../../../types'; // 型定義をインポート

// Article 型をストアの TopicArticle 型にマッピングするヘルパー関数
const mapArticleToTopicArticle = (article: Article): Omit<StoreTopicArticle, 'displayOrder' | 'categoryMajor' | 'categoryMinor'> => {
  return {
    id: article.id,
    title: article.title,
    url: article.url,
    source: article.source,
    summary: article.summary,
    labels: article.tags,
    thumbnailUrl: article.thumbnail,
    published: article.published,
  };
};

const ArticleSelectionTab: React.FC = () => {
  const { articles: articlesFromStore, addArticles, removeArticle, updateArticleOrder } = useTopicStore();
  
  // ローカルステート
  const [articles, setArticles] = useState<Article[]>([]); // APIから取得した記事リスト (左側)
  const [selectedLeftArticleIds, setSelectedLeftArticleIds] = useState<Set<number>>(new Set());
  const [selectedRightArticleIds, setSelectedRightArticleIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [filters, setFilters] = useState<ArticleFilters>({
    startDate: null,
    endDate: null,
    tags: []
  });
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [leftSearchTerm, setLeftSearchTerm] = useState('');
  const [rightSearchTerm, setRightSearchTerm] = useState('');
  
  // フィルター変更時の処理
  const handleFilterChange = (newFilters: ArticleFilters) => {
    setFilters(newFilters);
    // フィルター変更時に左側の選択をクリア
    setSelectedLeftArticleIds(new Set());
  };
  
  // フィルター条件に基づいて記事を取得
  useEffect(() => {
    const fetchArticles = async () => {
      setIsArticleLoading(true);
      setArticleError(null);
      
      try {
        const params = new URLSearchParams();
        if (filters.startDate) {
          // YYYY-MM-DD 形式に変換
          const formattedStartDate = new Date(filters.startDate).toISOString().split('T')[0];
          params.append('startDate', formattedStartDate);
        }
        if (filters.endDate) {
          // YYYY-MM-DD 形式に変換
          const formattedEndDate = new Date(filters.endDate).toISOString().split('T')[0];
          params.append('endDate', formattedEndDate);
        }
        if (filters.tags && filters.tags.length > 0) {
          filters.tags.forEach(tag => params.append('tags', tag));
        }
        // クエリパラメータがない場合は空の文字列を渡す
        const queryString = params.toString();
        const apiUrl = queryString ? `/api/articles?${queryString}` : '/api/articles';

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch articles and parse error response' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // APIのレスポンスが { articles: [] } または { items: [] } または [] の形式であることを期待
        setArticles(data.items || data.articles || (Array.isArray(data) ? data : []));
      } catch (error) {
        console.error('記事の取得に失敗しました:', error);
        setArticleError(error instanceof Error ? error.message : '記事の取得に失敗しました');
      } finally {
        setIsArticleLoading(false);
      }
    };
    
    fetchArticles();
  }, [filters]);
  
  // 表示モードの切り替え
  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'table' | 'card' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // 選択した記事をTOPICに追加 (左から右へ)
  const handleAddSelectedArticlesToStore = useCallback(() => {
    const articlesToAdd = articles
      .filter(article => selectedLeftArticleIds.has(article.id))
      .map(mapArticleToTopicArticle);
    if (articlesToAdd.length > 0) {
      addArticles(articlesToAdd);
    }
    setSelectedLeftArticleIds(new Set()); // 左側の選択をクリア
  }, [articles, selectedLeftArticleIds, addArticles]);

  // 選択済み記事をTOPICから削除 (右から左へ、または削除)
  const handleRemoveSelectedArticlesFromStore = useCallback(() => {
    const idsToRemove = Array.from(selectedRightArticleIds);
    if (idsToRemove.length === 0) return;

    // ストアの removeArticle はインデックスを期待するため、IDからインデックスを見つける
    // 逆順で処理することで、削除によるインデックスのズレを防ぐ
    const indicesToRemove: number[] = [];
    articlesFromStore.forEach((article, index) => {
      if (idsToRemove.includes(article.id)) {
        indicesToRemove.push(index);
      }
    });
    indicesToRemove.sort((a, b) => b - a).forEach(index => removeArticle(index));
    
    setSelectedRightArticleIds(new Set()); // 右側の選択をクリア
  }, [selectedRightArticleIds, articlesFromStore, removeArticle]);


  // 記事の選択/選択解除ハンドラー (共通化)
  const handleSelectionChange = (articleId: number, side: 'left' | 'right') => {
    const setSelectedIds = side === 'left' ? setSelectedLeftArticleIds : setSelectedRightArticleIds;
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  // 検索条件でフィルタリング
  const filterArticles = (items: Article[], searchTerm: string) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(term) || 
      (item.summary && item.summary.toLowerCase().includes(term)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  };
  
  // フィルタリングされた記事リスト
  const filteredLeftArticles = filterArticles(articles, leftSearchTerm);
  // articlesFromStore を TopicArticle[] から Article[] に変換する必要がある場合、またはその逆。
  // ここでは SelectedTopicsList が TopicArticle を期待すると仮定し、ストアのものをそのまま使う。
  // ただし、filterArticles は Article[] を期待しているので、合わせる必要がある。
  // 一旦、ストアの selectedArticles をそのままフィルタリングする。
  // TopicArticle にも title, summary, labels (tagsの代わり) があると仮定。
  const filteredRightArticles = articlesFromStore.filter(item => {
    if (!rightSearchTerm) return true;
    const term = rightSearchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.summary && item.summary.toLowerCase().includes(term)) ||
      (item.labels && item.labels.some(label => label.toLowerCase().includes(term)))
    );
  }).sort((a, b) => a.displayOrder - b.displayOrder);


  // 右側リストのアイテムを上に移動
  const handleMoveArticleUp = (articleId: number) => {
    const currentIndex = filteredRightArticles.findIndex(a => a.id === articleId);
    if (currentIndex > 0) {
      const prevArticleId = filteredRightArticles[currentIndex - 1].id;
      // ストアの updateArticleOrder は ID と新しい displayOrder を取る想定
      // もしストアがIDのペアを期待するなら、それに合わせる
      // ここでは、IDと対象記事のIDを渡して順序を入れ替える updateArticleOrder(id1, id2) を想定
      // もしストアの updateArticleOrder が (articleId, newDisplayOrder) なら、
      // displayOrder を直接操作する必要がある。
      // 現在の topicStore の updateArticleOrder は (articleId, newOrder) のため、
      // 2つの記事の displayOrder を入れ替える形で呼び出す。
      const articleToMove = articlesFromStore.find(a => a.id === articleId);
      const articleToSwapWith = articlesFromStore.find(a => a.id === prevArticleId);
      if (articleToMove && articleToSwapWith) {
        updateArticleOrder(articleToMove.id, articleToSwapWith.displayOrder);
        updateArticleOrder(articleToSwapWith.id, articleToMove.displayOrder);
      }
    }
  };

  // 右側リストのアイテムを下に移動
  const handleMoveArticleDown = (articleId: number) => {
    const currentIndex = filteredRightArticles.findIndex(a => a.id === articleId);
    if (currentIndex < filteredRightArticles.length - 1 && currentIndex !== -1) {
      const nextArticleId = filteredRightArticles[currentIndex + 1].id;
      const articleToMove = articlesFromStore.find(a => a.id === articleId);
      const articleToSwapWith = articlesFromStore.find(a => a.id === nextArticleId);
      if (articleToMove && articleToSwapWith) {
        updateArticleOrder(articleToMove.id, articleToSwapWith.displayOrder);
        updateArticleOrder(articleToSwapWith.id, articleToMove.displayOrder);
      }
    }
  };
  
  // 右側リストから記事を削除
  const handleRemoveArticleFromSideList = (articleId: number) => {
     const articleIndex = articlesFromStore.findIndex(a => a.id === articleId);
     if (articleIndex !== -1) {
       removeArticle(articleIndex);
     }
     setSelectedRightArticleIds(prev => {
       const newSet = new Set(prev);
       newSet.delete(articleId);
       return newSet;
     });
  };


  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)' }}>
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, overflow: 'hidden' }}>
          {/* 左側パネル - 記事一覧 */}
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              flexBasis: '48%', 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                記事一覧
                {!articleError && (
                  <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                    ({articles.length}件)
                  </Typography>
                )}
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

            <Box sx={{ mb: 2 }}>
              <ArticleFilter 
                initialFilters={filters} 
                onFilterChange={handleFilterChange} 
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="記事を検索..."
                value={leftSearchTerm}
                onChange={(e) => setLeftSearchTerm(e.target.value)}
              />
            </Box>
            
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              <AnimatePresence mode="wait">
                {isArticleLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : articleError ? (
                  <Alert severity="error">{articleError}</Alert>
                ) : filteredLeftArticles.length === 0 ? (
                  <Typography color="text.secondary" align="center" sx={{ p: 4 }}>
                    {articles.length === 0 ? '記事がありません' : '検索条件に一致する記事が見つかりません'}
                  </Typography>
                ) : viewMode === 'table' ? (
                  <ArticleTable 
                    articles={filteredLeftArticles}
                    selectedArticleIds={selectedLeftArticleIds}
                    onSelectionChange={(id) => handleSelectionChange(id, 'left')}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ArticleCardList 
                      articles={filteredLeftArticles}
                      selectedArticleIds={selectedLeftArticleIds}
                      onSelectionChange={(id) => handleSelectionChange(id, 'left')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Paper>

          {/* 中央の移動ボタン */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: 2
          }}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton 
                onClick={handleAddSelectedArticlesToStore} 
                disabled={selectedLeftArticleIds.size === 0}
                sx={{
                  border: '1px dashed',
                  borderColor: 'primary.main',
                  p: 1.5,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ArrowForwardIcon fontSize="large" />
              </IconButton>
            </motion.div>
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              {selectedLeftArticleIds.size > 0
                ? `${selectedLeftArticleIds.size}件追加`
                : '追加する記事を選択'}
            </Typography>

            <Divider sx={{ width: '100%', my: 1 }} />

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton 
                onClick={handleRemoveSelectedArticlesFromStore} 
                disabled={selectedRightArticleIds.size === 0}
                sx={{
                  border: '1px dashed',
                  borderColor: 'error.main',
                  p: 1.5,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ArrowBackIcon fontSize="large" />
              </IconButton>
            </motion.div>
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              {selectedRightArticleIds.size > 0
                ? `${selectedRightArticleIds.size}件削除`
                : '削除する記事を選択'}
            </Typography>
          </Box>

          {/* 右側パネル - 選択済み記事 */}
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              flexBasis: '48%', 
              flexGrow: 1,
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                選択済み記事
                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                  ({articlesFromStore.length}件)
                </Typography>
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="選択済み記事を検索..."
                value={rightSearchTerm}
                onChange={(e) => setRightSearchTerm(e.target.value)}
              />
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              <AnimatePresence mode="wait">
                {filteredRightArticles.length === 0 ? (
                  <Typography color="text.secondary" align="center" sx={{ p: 4 }}>
                    {articlesFromStore.length === 0 ? '選択済み記事がありません' : '検索条件に一致する記事が見つかりません'}
                  </Typography>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <SelectedTopicsList
                      articles={filteredRightArticles} // フィルタリングおよびソート済みのリストを渡す
                      selectedArticleIds={selectedRightArticleIds}
                      onSelectionChange={(id) => handleSelectionChange(id, 'right')}
                      onMoveUp={handleMoveArticleUp}
                      onMoveDown={handleMoveArticleDown}
                      onRemove={handleRemoveArticleFromSideList}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ArticleSelectionTab;
