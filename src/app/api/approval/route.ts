import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import {
  leaderApproveLeave,   leaderRejectLeave,
  hrApproveLeave,       hrRejectLeave,
} from "@/actions/leave.action";
import {
  leaderApproveCorrection, leaderRejectCorrection,
  hrApproveCorrection,     hrRejectCorrection,
} from "@/actions/correction.action";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

    const role = session.user.role;
    if (role !== "LEADER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }

    const { id, type, round, action, note } = await req.json() as {
      id:     string;
      type:   "leave" | "correction";
      round:  "leader" | "hr";
      action: "approve" | "reject";
      note?:  string;
    };

    if (!id || !type || !round || !action) {
      return NextResponse.json({ error: "Thiếu thông tin." }, { status: 400 });
    }

    if (type === "leave") {
      if (round === "leader") {
        if (action === "approve") await leaderApproveLeave(id, note);
        else                      await leaderRejectLeave(id, note ?? "");
      } else {
        if (action === "approve") await hrApproveLeave(id, note);
        else                      await hrRejectLeave(id, note ?? "");
      }
    } else {
      if (round === "leader") {
        if (action === "approve") await leaderApproveCorrection(id, note);
        else                      await leaderRejectCorrection(id, note ?? "");
      } else {
        if (action === "approve") await hrApproveCorrection(id, note);
        else                      await hrRejectCorrection(id, note ?? "");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi server.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
