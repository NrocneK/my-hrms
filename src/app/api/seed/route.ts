import { NextResponse } from "next/server";
import { seedAdminUser } from "@/actions/auth.action";

export async function POST() {
  try {
    const result = await seedAdminUser();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
