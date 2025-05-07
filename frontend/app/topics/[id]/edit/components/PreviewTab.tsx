"use client";

import React, { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Divider, 
  List, ListItem, ListItemText, Chip, Link,
  Grid, Card, CardContent, Dialog, DialogTitle,
  DialogContent, DialogActions 
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import { useTopicStore } from '../../../../../stores/topicStore';

const PreviewTab: React.FC = () => {
  const { title, summary, articles } = useTopicStore();
  const [showHtmlDialog, setShowHtmlDialog] = useState(false);
  
  // カテゴリごとに記事をグループ化
  const groupedArticles: { [category: string]: typeof articles } = {};
  const sortedArticles = [...articles].sort((a, b) => a.displayOrder - b.displayOrder);
  
  // 記事をカテゴリごとにグループ化
  sortedArticles.forEach((article) => {
    const category = article.categoryMajor || '未分類';
    if (!groupedArticles[category]) {
      groupedArticles[category] = [];
    }
    groupedArticles[category].push(article);
  });
  
  // HTML出力関数
  const generateHtml = () => {
    let html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title} - 半導体TOPICS配信</title>
  <style>
    body { font-family: sans-serif; margin: 2em; }
    h1 { color: #1a237e; }
    .article { border-bottom: 1px solid #ccc; margin-bottom: 1em; padding-bottom: 1em; }
    .category { font-weight: bold; color: #1565c0; }
    .summary { margin: 0.5em 0; }
    .labels { color: #388e3c; font-size: 0.95em; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>作成日: ${new Date().toLocaleDateString('ja-JP')}</p>
  <h2>月次まとめ</h2>
  <div>${summary || '月次まとめはありません。'}</div>
  <h2>記事一覧</h2>
`;
    
    // カテゴリ順に記事を追加
    Object.keys(groupedArticles).forEach(category => {
      html += `<h3>${category}</h3>`;
      html += '<div>';
      
      groupedArticles[category].forEach(article => {
        html += `
    <div class="article">
      <div class="category">[${article.categoryMajor || '未分類'}] ${(article.categoryMinor || []).join(', ')}</div>
      <div><a href="${article.url}">${article.title}</a>（${article.source} / ${article.published ? new Date(article.published).toLocaleDateString('ja-JP') : '日付不明'}）</div>
      <div class="summary">${article.summary}</div>
      <div class="labels">タグ: ${article.labels?.join(', ') || 'なし'}</div>
    </div>`;
      });
      
      html += '</div>';
    });
    
    html += `
</body>
</html>
`;
    return html;
  };
  
  // HTMLダウンロード関数
  const handleDownloadHtml = () => {
    const html = generateHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'TOPICS'}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>{title || 'タイトルなし'}</Typography>
        <Typography variant="caption" display="block" gutterBottom>
          作成日: {new Date().toLocaleDateString('ja-JP')}
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>月次まとめ</Typography>
        <Typography variant="body1" paragraph>
          {summary || '月次まとめはありません。'}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>記事一覧</Typography>
        
        {Object.keys(groupedArticles).length > 0 ? (
          Object.keys(groupedArticles).map((category) => (
            <Box key={category} sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', my: 1 }}>
                {category}
              </Typography>
              <List>
                {groupedArticles[category].map((article) => (
                  <ListItem key={article.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                    <ListItemText
                      primary={
                        <Link href={article.url} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </Link>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="caption" component="span" display="block">
                            {`${article.source} | ${article.published ? new Date(article.published).toLocaleDateString('ja-JP') : '日付不明'}`}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{article.summary}</Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" component="span" sx={{ mr: 1 }}>
                              大分類: {article.categoryMajor || '未分類'}
                            </Typography>
                          </Box>
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap' }}>
                            <Typography variant="caption" component="span" sx={{ mr: 1 }}>
                              小カテゴリ: 
                            </Typography>
                            {article.categoryMinor && article.categoryMinor.length > 0 ? (
                              article.categoryMinor.map(minor => (
                                <Chip
                                  key={minor}
                                  label={minor}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))
                            ) : (
                              <Typography variant="caption">未設定</Typography>
                            )}
                          </Box>
                          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                            <Typography variant="caption" component="span" sx={{ mr: 1 }}>
                              ラベル: 
                            </Typography>
                            {article.labels && article.labels.length > 0 ? (
                              article.labels.map(label => (
                                <Chip
                                  key={label}
                                  label={label}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))
                            ) : (
                              <Typography variant="caption">なし</Typography>
                            )}
                          </Box>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))
        ) : (
          <Typography variant="body1" color="text.secondary">
            記事がありません。前のタブで記事を選択してください。
          </Typography>
        )}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadHtml}
          disabled={articles.length === 0}
        >
          HTMLをダウンロード
        </Button>
        <Button
          variant="outlined"
          startIcon={<CodeIcon />}
          onClick={() => setShowHtmlDialog(true)}
          disabled={articles.length === 0}
        >
          HTMLを表示
        </Button>
      </Box>
      
      <Dialog
        open={showHtmlDialog}
        onClose={() => setShowHtmlDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>生成されたHTML</DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box component="pre" sx={{ 
              overflow: 'auto', 
              bgcolor: '#f5f5f5', 
              p: 2, 
              fontSize: '0.875rem',
              maxHeight: '70vh'
            }}>
              {generateHtml()}
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHtmlDialog(false)}>閉じる</Button>
          <Button variant="contained" onClick={handleDownloadHtml}>ダウンロード</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PreviewTab;