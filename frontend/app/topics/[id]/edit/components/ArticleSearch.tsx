"use client";

import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
type Article = {
  id: number;
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  labels: string[];
  thumbnailUrl?: string;
};

interface ArticleSearchProps {
  onArticleSelect: (article: Article) => void;
}

const ArticleSearch: React.FC<ArticleSearchProps> = ({ onArticleSelect }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let active = true;
    
    if (inputValue === '') {
      setOptions([]);
      return undefined;
    }
    
    setLoading(true);
    
    // 検索APIを呼び出す (400msのdebounce)
    const timeoutId = setTimeout(() => {
      fetch(`/api/articles?q=${encodeURIComponent(inputValue)}`)
        .then(response => response.json())
        .then(data => {
          if (active) {
            // dataが配列ならそのまま、オブジェクトならdata.itemsを参照
            if (Array.isArray(data)) {
              setOptions(data);
            } else if (Array.isArray(data.items)) {
              setOptions(data.items);
            } else {
              setOptions([]);
            }
            setLoading(false);
          }
        })
        .catch(() => {
          setLoading(false);
        });
    }, 400);
    
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
          onArticleSelect(newValue);
          // 選択後に入力をクリア
          setInputValue('');
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="記事を検索"
          placeholder="タイトルまたはキーワードで検索"
          variant="outlined"
          size="small"
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

export default ArticleSearch;