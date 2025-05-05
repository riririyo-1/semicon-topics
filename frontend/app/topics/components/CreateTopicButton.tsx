"use client";

import React from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';

export const CreateTopicButton: React.FC = () => {
  return (
    <Link href="/topics/new/edit" style={{ textDecoration: 'none' }}>
      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />}
        sx={{ mb: 2 }}
      >
        新規TOPICS作成
      </Button>
    </Link>
  );
};