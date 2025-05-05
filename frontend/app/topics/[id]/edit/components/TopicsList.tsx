// frontend/app/topics/components/TopicsList.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { List, ListItem, ListItemButton, ListItemText, Typography, Box } from '@mui/material';
import { TopicListItem } from '@/types';

interface TopicsListProps {
  topics: TopicListItem[];
}

// 日付フォーマット関数 (必要に応じて調整)
const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '日付不明';
    }
};

export default function TopicsList({ topics }: TopicsListProps) {
  if (!topics || topics.length === 0) {
    return <Typography>作成済みのTOPICS配信はありません。</Typography>;
  }

  return (
    <List>
      {topics.map((topic) => (
        <ListItem key={topic.id} disablePadding>
          <ListItemButton component={Link} href={`/topics/${topic.id}/edit`}>
            <ListItemText
              primary={topic.title || `TOPICS ID: ${topic.id}`}
              secondary={`最終更新: ${formatDate(topic.updated_at)}`}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}