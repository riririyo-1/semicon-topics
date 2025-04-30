import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#bfa76a" }, // ベージュ系ゴールド
    background: { default: "#f8f5f0", paper: "#f3e9d2" }, // 薄いベージュ
    secondary: { main: "#8c735b" }, // 穏やかなブラウン
    text: { primary: "#3a2c1a", secondary: "#6d4c1b" }
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#22d3ee" },
    background: { default: "#111827", paper: "#1e293b" },
    secondary: { main: "#10b981" },
  },
});