import { NextRequest, NextResponse } from "next/server";

// GET /api/topics - TOPICSの一覧取得
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    
    // リクエストパラメータをAPIに渡す
    const apiUrl = new URL("http://api:4000/api/topics");
    
    // 検索条件があれば追加
    if (searchParams.has("q")) {
      apiUrl.searchParams.set("q", searchParams.get("q")!);
    }
    
    const res = await fetch(apiUrl.toString(), { 
      cache: "no-store" 
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch topics" },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/topics - 新規TOPICS作成
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const res = await fetch("http://api:4000/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to create topic" }, 
        { status: res.status }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}