import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
    background: { default: "#f9fafb", paper: "#fff" },
    secondary: { main: "#047857" },
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