import type { DashboardRole } from "../roles";

export type Role = DashboardRole;
export type Employee = {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: Role[];
};
export type EmployeeForm = {
  displayName: string;
  username: string;
  password: string;
  roles: Role[];
};
export type EmployeeEditForm = {
  displayName: string;
  password: string;
  active: boolean;
  roles: Role[];
};
