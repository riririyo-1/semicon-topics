import { NextRequest, NextResponse } from "next/server";

// GET /api/topics/[id] - 特定のTOPICSを取得
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`http://api:4000/api/topics/${params.id}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch topic" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/topics/[id] - 特定のTOPICSを更新
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    
    const res = await fetch(`http://api:4000/api/topics/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to update topic" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}