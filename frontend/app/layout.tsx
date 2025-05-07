"use client";

import React, { useState } from "react";
import { Box, Drawer, List, ListItem, ListItemText, ListItemButton, Typography, Container, Switch, FormControlLabel } from "@mui/material";
import Link from "next/link";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "../theme";

const drawerWidth = 220;
const NAV = [
  { label: "トップページ", href: "/" },
  { label: "記事収集", href: "/crawl" },
  { label: "記事一覧", href: "/articles" },
  { label: "TOPICS配信", href: "/topics" }, // 追加
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <html lang="ja">
      <body>
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
          <Box sx={{ display: "flex", bgcolor: "background.default", minHeight: "100vh" }}>
            <Drawer
              variant="permanent"
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" },
              }}
            >
              <Box>
                <Box sx={{
                  width: "100%",
                  bgcolor: "#064e3b",
                  color: "#fff",
                  py: 2,
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: 2,
                  borderBottom: "2px solid #047857"
                }}>
                  半導体TOPICS
                </Box>
                <List sx={{ mt: 1 }}>
                  {NAV.map((n) => (
                    <ListItem key={n.href} disablePadding>
                      <ListItemButton component={Link} href={n.href}>
                        <ListItemText primary={n.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
              <Box sx={{ p: 1, borderTop: "1px solid #eee", textAlign: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={e => setDarkMode(e.target.checked)}
                      color="default"
                    />
                  }
                  label={darkMode ? "ダーク" : "ライト"}
                  labelPlacement="start"
                  sx={{ color: "text.primary", mx: "auto" }}
                />
              </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
              <Container maxWidth="lg" sx={{ py: 2, px: { xs: 0.5, sm: 1, md: 2 } }}>
                {children}
              </Container>
            </Box>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}
