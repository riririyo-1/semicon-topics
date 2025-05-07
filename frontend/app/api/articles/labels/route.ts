import { NextRequest, NextResponse } from "next/server";

// GET /api/articles/labels - 記事ラベル一覧取得
export async function GET(req: NextRequest) {
  try {
    const res = await fetch("http://api:4000/api/articles/labels", { cache: "no-store" });
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch labels" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}