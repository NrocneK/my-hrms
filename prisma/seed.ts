import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Tạo email theo format: tên + chữ cái đầu họ + chữ cái đầu tên đệm
 * Ví dụ: "Ngô Minh Nhựt" → "nhutnm@hrms.com"
 *         "Nguyễn Thị Bích Kiểm" → "kiemntb@hrms.com"
 */
function buildEmail(fullName: string, existingEmails: Set<string>): string {
  const parts = fullName.trim().split(/\s+/);
  // parts[0] = họ, parts[1..n-1] = tên đệm, parts[n] = tên
  const lastName   = removeDiacritics(parts[parts.length - 1]);           // tên
  const firstInit  = removeDiacritics(parts[0][0]);                        // chữ đầu họ
  const middleInits = parts.slice(1, -1).map(p => removeDiacritics(p[0])).join(""); // chữ đầu tên đệm

  let base  = `${lastName}${firstInit}${middleInits}`;
  let email = `${base}@hrms.com`;

  // Xử lý trùng email
  let counter = 1;
  while (existingEmails.has(email)) {
    email = `${base}${counter}@hrms.com`;
    counter++;
  }
  existingEmails.add(email);
  return email;
}

// ── Dữ liệu ──────────────────────────────────────────────────────────────────

const HO      = ["Nguyễn","Trần","Lê","Phạm","Hoàng","Huỳnh","Phan","Vũ","Võ","Đặng","Bùi","Đỗ","Hồ","Ngô","Dương","Lý","Đinh","Mai"];
const DEM_NAM = ["Văn","Đình","Công","Quốc","Xuân","Ngọc","Thanh","Trung","Minh","Hoàng","Hữu","Đức"];
const DEM_NU  = ["Thị","Ngọc","Thanh","Thu","Bích","Diễm","Kiều","Mỹ","Phương","Quỳnh","Thùy","Tuyết"];
const TEN_NAM = ["An","Bình","Cường","Dũng","Hải","Hùng","Khoa","Long","Minh","Nam","Phong","Quân","Thành","Tuấn","Việt","Đức","Hưng","Khôi","Lâm","Tài","Hào","Kiệt","Phúc","Trí","Duy"];
const TEN_NU  = ["Anh","Chi","Dung","Hà","Hoa","Huệ","Lan","Linh","Mai","My","Ngân","Như","Phương","Thảo","Thu","Trang","Trinh","Uyên","Vân","Yến","Kiểm","Nhung","Hằng","Loan","Nhựt"];

const PHONES  = ["090","091","092","093","094","096","097","098","032","033","034","035","036","037","038","039","070","079","077","078","056","058"];
const ADDRS   = [
  "12 Nguyễn Huệ, Q.1, TP.HCM",     "45 Lê Lợi, Q.3, TP.HCM",
  "78 Trần Hưng Đạo, Q.5, TP.HCM",  "23 CMT8, Q.10, TP.HCM",
  "156 Điện Biên Phủ, Bình Thạnh",   "34 Phan Xích Long, Phú Nhuận",
  "89 Hoàng Văn Thụ, Tân Bình",      "67 Nguyễn Thị Minh Khai, Q.1",
  "210 Lý Thường Kiệt, Q.11",        "55 Võ Văn Tần, Q.3",
  "18 Trường Chinh, Tân Bình",       "302 Nguyễn Trãi, Q.5",
];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randPhone() { return rand(PHONES) + String(randInt(1000000, 9999999)); }
function randDOB()   { return new Date(randInt(1985,2000), randInt(0,11), randInt(1,28)); }
function randJoin()  { return new Date(randInt(2019,2024), randInt(0,11), randInt(1,28)); }

function randName(gender: "MALE"|"FEMALE") {
  const ho  = rand(HO);
  const dem = gender === "MALE" ? rand(DEM_NAM) : rand(DEM_NU);
  const ten = gender === "MALE" ? rand(TEN_NAM) : rand(TEN_NU);
  return `${ho} ${dem} ${ten}`;
}

// ── Cấu hình phòng ban ────────────────────────────────────────────────────────

interface Position { title: string; salaryMin: number; salaryMax: number }
interface DeptCfg  { name: string; description: string; isHR: boolean; positions: Position[]; count: number }

const DEPTS: DeptCfg[] = [
  {
    name: "Nhân sự", description: "Quản lý nhân sự & phúc lợi", isHR: true, count: 5,
    positions: [
      { title: "Chuyên viên tuyển dụng", salaryMin: 10_000_000, salaryMax: 18_000_000 },
      { title: "Chuyên viên C&B",        salaryMin: 11_000_000, salaryMax: 19_000_000 },
      { title: "Chuyên viên đào tạo",    salaryMin: 10_000_000, salaryMax: 17_000_000 },
      { title: "Chuyên viên HRIS",       salaryMin: 12_000_000, salaryMax: 20_000_000 },
    ],
  },
  {
    name: "Công nghệ thông tin", description: "Phát triển phần mềm & hạ tầng", isHR: false, count: 8,
    positions: [
      { title: "Lập trình viên Frontend",  salaryMin: 15_000_000, salaryMax: 25_000_000 },
      { title: "Lập trình viên Backend",   salaryMin: 16_000_000, salaryMax: 28_000_000 },
      { title: "Lập trình viên Fullstack", salaryMin: 18_000_000, salaryMax: 30_000_000 },
      { title: "Kỹ sư QA/QC",             salaryMin: 12_000_000, salaryMax: 20_000_000 },
      { title: "DevOps Engineer",          salaryMin: 20_000_000, salaryMax: 35_000_000 },
      { title: "UI/UX Designer",           salaryMin: 13_000_000, salaryMax: 22_000_000 },
    ],
  },
  {
    name: "Kinh doanh", description: "Phát triển thị trường & bán hàng", isHR: false, count: 8,
    positions: [
      { title: "Nhân viên kinh doanh",      salaryMin:  8_000_000, salaryMax: 15_000_000 },
      { title: "Chuyên viên bán hàng",      salaryMin:  9_000_000, salaryMax: 16_000_000 },
      { title: "Chuyên viên phát triển KH", salaryMin: 12_000_000, salaryMax: 22_000_000 },
      { title: "Account Manager",           salaryMin: 15_000_000, salaryMax: 25_000_000 },
    ],
  },
  {
    name: "Kế toán", description: "Quản lý tài chính & kế toán", isHR: false, count: 6,
    positions: [
      { title: "Kế toán tổng hợp",  salaryMin: 12_000_000, salaryMax: 20_000_000 },
      { title: "Kế toán công nợ",   salaryMin: 11_000_000, salaryMax: 18_000_000 },
      { title: "Kế toán thuế",      salaryMin: 12_000_000, salaryMax: 20_000_000 },
      { title: "Kiểm toán nội bộ",  salaryMin: 14_000_000, salaryMax: 24_000_000 },
    ],
  },
  {
    name: "Marketing", description: "Quảng bá thương hiệu & truyền thông", isHR: false, count: 6,
    positions: [
      { title: "Chuyên viên Marketing", salaryMin: 12_000_000, salaryMax: 20_000_000 },
      { title: "Content Creator",       salaryMin: 10_000_000, salaryMax: 17_000_000 },
      { title: "Graphic Designer",      salaryMin: 11_000_000, salaryMax: 18_000_000 },
      { title: "SEO Specialist",        salaryMin: 12_000_000, salaryMax: 20_000_000 },
    ],
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Reset và seed toàn bộ dữ liệu...\n");

  // Xóa toàn bộ dữ liệu cũ theo thứ tự FK
  await prisma.attendanceCorrection.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.department.updateMany({ data: { leaderId: null } });
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  console.log("🗑️  Đã xóa dữ liệu cũ\n");

  const DEFAULT_PASS   = await bcrypt.hash("123456", 10);
  const existingEmails = new Set<string>();
  let empIndex = 0;

  // ── Admin ──────────────────────────────────────────────
  await prisma.user.create({
    data: { email: "admin@hrms.com", loginId: "ADMIN", password: DEFAULT_PASS, role: "ADMIN" },
  });
  console.log("✅ Admin — Mã: ADMIN / Mật khẩu: 123456\n");

  // ── Từng phòng ban ─────────────────────────────────────
  for (const deptCfg of DEPTS) {
    // Tạo phòng ban
    const dept = await prisma.department.create({
      data: { name: deptCfg.name, description: deptCfg.description, isHR: deptCfg.isHR },
    });
    console.log(`📁 Phòng: ${dept.name}`);

    // Chọn index ngẫu nhiên làm leader
    const leaderIdx = randInt(0, deptCfg.count - 1);

    const createdEmployees: string[] = []; // lưu employee id

    for (let i = 0; i < deptCfg.count; i++) {
      empIndex++;
      const empCode   = `EMP${String(empIndex).padStart(4, "0")}`;
      const isLeader  = i === leaderIdx;
      const gender    = Math.random() > 0.45 ? "MALE" : "FEMALE" as "MALE"|"FEMALE";
      const fullName  = randName(gender);
      const email     = buildEmail(fullName, existingEmails);
      const pos       = rand(deptCfg.positions);
      const salary    = randInt(pos.salaryMin / 500_000, pos.salaryMax / 500_000) * 500_000;
      const position  = isLeader ? `Trưởng phòng ${deptCfg.name}` : pos.title;
      const leaderSal = isLeader ? Math.max(salary, 25_000_000) : salary;

      const user = await prisma.user.create({
        data: {
          email,
          loginId:  empCode,
          password: DEFAULT_PASS,
          role:     isLeader ? "LEADER" : "EMPLOYEE",
          employee: {
            create: {
              employeeCode: empCode,
              fullName,
              phone:        randPhone(),
              gender,
              dateOfBirth:  randDOB(),
              address:      rand(ADDRS),
              position,
              salary:       leaderSal,
              departmentId: dept.id,
              joinDate:     isLeader ? new Date(randInt(2018,2021), randInt(0,11), 1) : randJoin(),
              isActive:     true,
            },
          },
        },
        include: { employee: true },
      });

      createdEmployees.push(user.employee!.id);

      const tag = isLeader ? "👔 Leader" : "👤";
      console.log(`   ${tag} ${empCode} · ${fullName} · ${position}`);
      console.log(`         Email: ${email} | Đăng nhập: ${empCode} / 123456`);

      // Gán leader cho phòng
      if (isLeader) {
        await prisma.department.update({
          where: { id: dept.id },
          data:  { leaderId: user.employee!.id },
        });
      }
    }

    console.log("");
  }

  const totalEmp   = await prisma.employee.count();
  const totalLeader = await prisma.user.count({ where: { role: "LEADER" } });

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Seed hoàn tất!
   Tổng nhân viên  : ${totalEmp}
   Trưởng phòng    : ${totalLeader}
   Phòng ban       : ${DEPTS.length}

🔑 Cách đăng nhập:
   Admin    → Mã: ADMIN   / Mật khẩu: 123456
   Khác     → Mã: EMPxxxx / Mật khẩu: 123456

📧 Email format: tên + chữ đầu họ + chữ đầu tên đệm
   Ví dụ: Ngô Minh Nhựt → nhutnm@hrms.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main()
  .catch(e => { console.error("❌ Lỗi:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
