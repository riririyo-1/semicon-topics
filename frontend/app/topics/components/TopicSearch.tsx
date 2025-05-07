"use client";

import React, { useState } from 'react';
import { TextField, Button, Stack } from '@mui/material';

interface TopicSearchProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSearch: () => void;
}

export const TopicSearch: React.FC<TopicSearchProps> = ({ inputValue, onInputChange, onSearch }) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <TextField
        sx={{ flex: 1 }}
        label="TOPICSを検索"
        variant="outlined"
        value={inputValue}
        onChange={e => onInputChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onSearch();
          }
        }}
      />
      <Button
        variant="contained"
        color="primary"
        disabled={!inputValue}
        onClick={onSearch}
        sx={{ height: 40, minWidth: 80 }}
      >
        検索
      </Button>
    </Stack>
  );
};