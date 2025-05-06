import { NextRequest, NextResponse } from "next/server";

// POST /api/topics/[id]/export - テンプレートHTMLの生成
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`http://api:4000/api/topics/${params.id}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to export template" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}