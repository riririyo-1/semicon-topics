"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    // .envのNEXT_PUBLIC_API_URLを必ず参照
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/api/hello`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.text();
      })
      .then((text) => setMessage(text))
      .catch(() => setMessage("API通信エラー"));
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1>Hello, World! サンプル</h1>
      <div>
        <strong>APIレスポンス:</strong> {message}
      </div>
    </main>
  );
}