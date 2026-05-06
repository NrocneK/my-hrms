import { Role, Gender, AttendanceStatus, LeaveType, LeaveStatus, CorrectionStatus } from "@prisma/client";

export type { Role, Gender, AttendanceStatus, LeaveType, LeaveStatus, CorrectionStatus };

export interface DepartmentType {
  id: string;
  name: string;
  description?: string | null;
  isHR: boolean;
  leaderId?: string | null;
  leader?: EmployeeType | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { employees: number };
}

export interface EmployeeType {
  id: string;
  employeeCode: string;
  fullName: string;
  phone?: string | null;
  gender: Gender;
  dateOfBirth?: Date | null;
  address?: string | null;
  position: string;
  salary: number;
  joinDate: Date;
  avatarUrl?: string | null;
  isActive: boolean;
  userId: string;
  departmentId: string;
  department?: DepartmentType;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveRequestType {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  leaderNote?: string | null;
  leaderAt?: Date | null;
  hrNote?: string | null;
  hrAt?: Date | null;
  employeeId: string;
  employee?: EmployeeType;
  createdAt: Date;
}

export interface AttendanceCorrectionType {
  id: string;
  date: Date;
  checkIn: Date;
  checkOut: Date;
  reason: string;
  status: CorrectionStatus;
  leaderNote?: string | null;
  leaderAt?: Date | null;
  hrNote?: string | null;
  hrAt?: Date | null;
  employeeId: string;
  employee?: EmployeeType;
  createdAt: Date;
}

export interface UserType {
  id: string;
  email: string;
  role: Role;
  employee?: EmployeeType | null;
}
