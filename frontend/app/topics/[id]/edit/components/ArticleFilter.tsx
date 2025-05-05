"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, TextField, Autocomplete, Chip,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ja } from 'date-fns/locale/ja';
import { ArticleFilters } from './ArticleSelectionTab';

interface ArticleFilterProps {
  initialFilters: ArticleFilters;
  onFilterChange: (filters: Partial<ArticleFilters>) => void;
}

const ArticleFilter: React.FC<ArticleFilterProps> = ({ initialFilters, onFilterChange }) => {
  const [startDate, setStartDate] = useState<Date | null>(initialFilters.startDate);
  const [endDate, setEndDate] = useState<Date | null>(initialFilters.endDate);
  const [labels, setLabels] = useState<string[]>(initialFilters.labels);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);

  // 利用可能なラベルをAPIから取得
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await fetch('/api/articles/labels');
        if (response.ok) {
          const data = await response.json();
          setAvailableLabels(data || []);
        }
      } catch (error) {
        console.error('ラベル取得エラー:', error);
      }
    };

    fetchLabels();
  }, []);

  // 開始日変更ハンドラ
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    // 少し遅延させてフィルター適用（UIの反応性向上のため）
    setTimeout(() => {
      onFilterChange({ startDate: date });
    }, 300);
  };

  // 終了日変更ハンドラ
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    // 少し遅延させてフィルター適用
    setTimeout(() => {
      onFilterChange({ endDate: date });
    }, 300);
  };

  // ラベル変更ハンドラ
  const handleLabelsChange = (_: any, newLabels: string[]) => {
    setLabels(newLabels);
    onFilterChange({ labels: newLabels });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="開始日"
              value={startDate}
              onChange={handleStartDateChange}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="終了日"
              value={endDate}
              onChange={handleEndDateChange}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Autocomplete
              multiple
              id="labels-filter"
              options={availableLabels}
              value={labels}
              onChange={handleLabelsChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ラベルで絞り込み"
                  placeholder="ラベルを選択"
                  size="small"
                  fullWidth
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>
    </LocalizationProvider>
  );
};

export default ArticleFilter;