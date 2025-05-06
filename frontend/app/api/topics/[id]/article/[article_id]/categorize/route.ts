import { NextRequest, NextResponse } from "next/server";

// POST /api/topics/[id]/article/[article_id]/categorize - 記事カテゴリの自動分類
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; article_id: string } }
) {
  try {
    const res = await fetch(
      `http://api:4000/api/topics/${params.id}/article/${params.article_id}/categorize`, 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to auto-categorize article" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}