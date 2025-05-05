"use client";

import React from 'react';
import { 
  List, ListItem, ListItemText, ListItemButton, 
  Card, CardContent, Typography, Grid,
  Chip, Divider
} from '@mui/material';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

export interface Topic {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  articleCount?: number; // 記事数（オプション）
}

interface TopicsListProps {
  topics: Topic[];
}

// 日付を「5時間前」「3日前」などの形式に整形
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ja });
  } catch {
    return '日付不明';
  }
};

export const TopicsList: React.FC<TopicsListProps> = ({ topics }) => {
  return (
    <Grid container spacing={2}>
      {topics.length === 0 ? (
        <Grid item xs={12}>
          <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ py: 4 }}>
            TOPICSがありません。新規作成ボタンから作成してください。
          </Typography>
        </Grid>
      ) : (
        topics.map((topic) => (
          <Grid item xs={12} sm={6} md={4} key={topic.id}>
            <Link href={`/topics/${topic.id}/edit`} style={{ textDecoration: 'none' }}>
              <Card
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom noWrap>
                    {topic.title}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item>
                      <Chip 
                        size="small" 
                        label={`${topic.articleCount || 0} 記事`} 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        作成: {formatDate(topic.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        更新: {formatDate(topic.updatedAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))
      )}
    </Grid>
  );
};