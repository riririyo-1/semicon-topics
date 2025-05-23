"use client";

import React from 'react';
import { Box, Tabs, Tab, Alert, Button, CircularProgress, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import ArticleSelectionTab from './ArticleSelectionTab';
import TemplateOutputTab from './TemplateOutputTab';
import PreviewTab from './PreviewTab';
import { useTopicStore } from '../../../../../stores/topicStore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`topic-tabpanel-${index}`}
      aria-labelledby={`topic-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, width: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `topic-tab-${index}`,
    'aria-controls': `topic-tabpanel-${index}`,
  };
}

const EditTabs: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    saveTopic, 
    isSaving, 
    error, 
    title,
    setTitle
  } = useTopicStore();

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField 
        label="TOPICSタイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="例: 2025年5月 半導体業界TOPICS"
        variant="outlined"
        fullWidth
        required
        sx={{ mb: 3 }}
        error={error?.includes('タイトル')}
        helperText={error?.includes('タイトル') ? error : ''}
      />

      {error && !error.includes('タイトル') && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleChange} aria-label="TOPICS編集タブ">
          <Tab label="TOPICS選択" {...a11yProps(0)} />
          <Tab label="テンプレート出力" {...a11yProps(1)} />
          <Tab label="プレビュー" {...a11yProps(2)} />
        </Tabs>

        <LoadingButton
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          loading={isSaving}
          onClick={saveTopic}
        >
          保存
        </LoadingButton>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <ArticleSelectionTab />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <TemplateOutputTab />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <PreviewTab />
      </TabPanel>
    </Box>
  );
};

export default EditTabs;
