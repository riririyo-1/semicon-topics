import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // URLからクエリパラメータを取得
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  
  // クエリパラメータをAPIリクエストに含める
  const apiUrl = `http://api:4000/api/articles${searchParams ? `?${searchParams}` : ''}`;
  
  const res = await fetch(apiUrl, { cache: "no-store" });
  const data = await res.json();
  return new NextResponse(JSON.stringify(data), {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    const res = await fetch("http://api:4000/api/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    return new NextResponse(null, { status: res.status });
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: "削除に失敗しました" }), { status: 500 });
  }
}