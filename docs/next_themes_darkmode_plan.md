# Next.js + next-themes + MUI ダークモード実装プラン

## 現状の実装

- `theme.ts` で MUI の `lightTheme` / `darkTheme` を定義
- `layout.tsx` で `useState` によるダークモード切り替え（MUI `ThemeProvider` で適用）
- next-themes（`ThemeProvider`, `useTheme`）は未導入
- ページリロードや他タブでの同期、システムテーマ連動、ユーザー選択の永続化ができていない

---

## next-themes + MUI でのスマートなダークモード実装案

### next-themes の特徴

- `ThemeProvider` で全体をラップ
- `useTheme` で現在のテーマ取得・切り替え
- localStorage で永続化
- システムテーマ（OS設定）連動
- 他タブ同期

### MUI との連携

- next-themes の theme 値（"light" or "dark"）を `useTheme` で取得
- その値に応じて MUI の `ThemeProvider` に `lightTheme` / `darkTheme` を渡す

---

## 構成イメージ

```mermaid
flowchart TD
  A[App Root (layout.tsx)] --> B[next-themes ThemeProvider]
  B --> C[MUI ThemeProvider (theme: lightTheme/darkTheme)]
  C --> D[App Content]
  D --> E[ダークモード切替UI（Switch）]
  E -->|onChange| F[useTheme().setTheme("light"/"dark")]
```

---

## 実装手順

1. next-themes を依存追加
2. `layout.tsx` で next-themes の `ThemeProvider` で全体をラップ
3. `useTheme` で現在の theme を取得し、MUI の `ThemeProvider` に渡す
4. ダークモード切替 UI で `setTheme` を呼ぶ
5. 既存の `useState`, `setDarkMode`, `checked` などは不要

---

## サンプルコード（イメージ）

```tsx
// layout.tsx
import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "../theme";

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <NextThemeProvider attribute="class" defaultTheme="system">
          <ThemeSync>{children}</ThemeSync>
        </NextThemeProvider>
      </body>
    </html>
  );
}

function ThemeSync({ children }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <MuiThemeProvider theme={resolvedTheme === "dark" ? darkTheme : lightTheme}>
      {/* ...DrawerやSwitchのonChangeで setTheme("dark"/"light") を呼ぶ */}
      {children}
    </MuiThemeProvider>
  );
}
```

---

## メリット

- システムテーマ連動・ユーザー選択の永続化・他タブ同期が自動で実現
- コードがシンプル＆拡張性アップ
- MUI のテーマ切り替えも一元管理

---

## まとめ

- next-themes を導入し、`useTheme` でテーマ状態を管理
- MUI の `ThemeProvider` には `resolvedTheme` で切り替え
- ユーザーの選択は自動で永続化・システムテーマ連動も可能
- コードがシンプルで保守性・拡張性が高い