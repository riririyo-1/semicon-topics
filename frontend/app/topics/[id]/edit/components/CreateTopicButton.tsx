// frontend/app/topics/components/CreateTopicButton.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function CreateTopicButton() {
  return (
    <Link href="/topics/new/edit" passHref>
      <Button variant="contained" startIcon={<AddIcon />}>
        新規作成
      </Button>
    </Link>
  );
}