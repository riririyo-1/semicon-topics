"use client";

import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Topic } from './TopicsList';

export const TopicSearch: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();
  
  useEffect(() => {
    let active = true;
    
    if (inputValue === '') {
      // 空の検索時は最近のTOPICS（最大5件）を表示
      setLoading(true);
      fetch('/api/topics?limit=5')
        .then(response => response.json())
        .then(data => {
          if (active) {
            setOptions(data);
            setLoading(false);
          }
        })
        .catch(() => {
          setLoading(false);
        });
      return undefined;
    }
    
    setLoading(true);
    
    // 検索APIを呼び出す (500msのdebounce)
    const timeoutId = setTimeout(() => {
      fetch(`/api/topics/search?q=${encodeURIComponent(inputValue)}`)
        .then(response => response.json())
        .then(data => {
          if (active) {
            setOptions(data);
            setLoading(false);
          }
        })
        .catch(() => {
          setLoading(false);
        });
    }, 500);
    
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [inputValue]);
  
  return (
    <Autocomplete
      fullWidth
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      inputValue={inputValue}
      onInputChange={(_, newValue) => setInputValue(newValue)}
      options={options}
      getOptionLabel={(option) => option.title}
      loading={loading}
      onChange={(_, newValue) => {
        if (newValue) {
          router.push(`/topics/${newValue.id}/edit`);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="TOPICSを検索"
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};