"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, TextField, Autocomplete, Chip, Paper, Button
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ja } from 'date-fns/locale/ja';

type ArticleFilters = {
  startDate: Date | null;
  endDate: Date | null;
  labels: string[];
};

interface ArticleFilterProps {
  initialFilters: ArticleFilters;
  onFilterChange: (filters: Partial<ArticleFilters>) => void;
}

const getDefaultMonthRange = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: first, end: last };
};

const ArticleFilter: React.FC<ArticleFilterProps> = ({ initialFilters, onFilterChange }) => {
  const defaultRange = getDefaultMonthRange();
  const [startDate, setStartDate] = useState<Date | null>(initialFilters.startDate ?? defaultRange.start);
  const [endDate, setEndDate] = useState<Date | null>(initialFilters.endDate ?? defaultRange.end);
  const [labels, setLabels] = useState<string[]>(initialFilters.labels ?? []);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);

  // 利用可能なラベルをAPIから取得
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        console.log("[ArticleFilter] fetch /api/articles/labels");
        const response = await fetch('/api/articles/labels');
        if (response.ok) {
          const data = await response.json();
          console.log("[ArticleFilter] fetchLabels result:", data);
          setAvailableLabels(Array.isArray(data) ? data : []);
        } else {
          console.error("[ArticleFilter] fetchLabels response not ok:", response.status);
        }
      } catch (error) {
        console.error('ラベル取得エラー:', error);
      }
    };

    fetchLabels();
  }, []);

  // initialFiltersが変化したら内部stateも更新
  useEffect(() => {
    setStartDate(initialFilters.startDate);
    setEndDate(initialFilters.endDate);
    setLabels(initialFilters.labels);
  }, [initialFilters]);

  // 開始日変更ハンドラ
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  // 終了日変更ハンドラ
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  // ラベル変更ハンドラ
  const handleLabelsChange = (_: any, newLabels: string[]) => {
    setLabels(newLabels);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
        {/* 日付行 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <DatePicker
            label="開始日"
            value={startDate}
            onChange={handleStartDateChange}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
          <DatePicker
            label="終了日"
            value={endDate}
            onChange={handleEndDateChange}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        </Box>
        {/* ラベル行 */}
        <Box>
          <Autocomplete
            multiple
            freeSolo
            filterSelectedOptions
            id="labels-filter"
            options={Array.isArray(availableLabels) ? availableLabels : []}
            value={Array.isArray(labels) ? labels : []}
            onChange={handleLabelsChange}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ラベルで絞り込み"
                placeholder="ラベルを選択または入力"
                size="small"
                fullWidth
              />
            )}
          />
          {/* 選択済みラベルを下部に明示表示 */}
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Array.isArray(labels) && labels.length > 0 ? (
              labels.map((label) => (
                <Chip key={label} label={label} size="small" color="primary" />
              ))
            ) : (
              <span style={{ color: '#888', fontSize: 13 }}>ラベル未選択</span>
            )}
          </Box>
        </Box>
        {/* 絞り込みボタン */}
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onFilterChange({
                startDate,
                endDate,
                labels
              });
            }}
            sx={{ height: 40, minWidth: 100, fontSize: 16 }}
          >
            絞り込み
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default ArticleFilter;