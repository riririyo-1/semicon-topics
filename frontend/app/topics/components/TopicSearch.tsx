"use client";

import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Topic } from './TopicsList';

interface TopicOption {
  id: number;
  title: string;
}

export const TopicSearch: React.FC = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions([]);
      return undefined;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/topics/search?q=${encodeURIComponent(inputValue)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }
        const data = await response.json();
        if (active) {
          setOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        if (active) {
          setOptions([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [inputValue]);

  return (
    <Autocomplete
      id="topics-search"
      fullWidth
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      inputValue={inputValue}
      onInputChange={(_, newValue) => setInputValue(newValue)}
      options={options}
      getOptionLabel={(option) => option.title}
      isOptionEqualToValue={(option, value) => option.id === value.id}
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