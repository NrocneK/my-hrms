import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { v2 as cloudinary }          from "cloudinary";
import { prisma }                    from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DELETE — xóa ảnh cũ khi upload ảnh mới
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { publicId } = await req.json();
  if (!publicId) return NextResponse.json({ error: "Missing publicId" }, { status: 400 });

  try {
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Xóa ảnh thất bại." }, { status: 500 });
  }
}

// PATCH — lưu URL ảnh mới vào DB sau khi upload xong
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { employeeId, avatarUrl } = await req.json();
  if (!employeeId || !avatarUrl) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  // Chỉ cho phép sửa avatar của chính mình hoặc admin
  const employee = await prisma.employee.findUnique({
    where:  { id: employeeId },
    select: { userId: true },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "ADMIN" && employee.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data:  { avatarUrl },
  });

  return NextResponse.json({ ok: true, avatarUrl });
}
