import { NextRequest, NextResponse } from "next/server";

// PATCH /api/topics/[id]/article/[article_id]/category - 記事カテゴリの手動編集
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; article_id: string } }
) {
  try {
    const body = await req.json();
    
    const res = await fetch(
      `http://api:4000/api/topics/${params.id}/article/${params.article_id}/category`, 
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to update article category" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}