import { NextRequest, NextResponse } from "next/server";

// POST /api/topics/[id]/summary - 月次まとめの自動生成
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`http://api:4000/api/topics/${params.id}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to generate summary" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}