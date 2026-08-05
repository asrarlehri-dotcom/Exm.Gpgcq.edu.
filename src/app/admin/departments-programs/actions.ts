"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDepartments() {
  return prisma.department.findMany({
    orderBy: { createdAt: "desc" },
    include: { programs: true }
  });
}

export async function addDepartment(data: { name: string; code: string; hodName: string }) {
  await prisma.department.create({ data });
  revalidatePath("/admin/departments-programs");
}

export async function toggleDepartmentStatus(id: string, isActive: boolean) {
  await prisma.department.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/departments-programs");
}

export async function getPrograms() {
  return prisma.program.findMany({
    orderBy: { createdAt: "desc" },
    include: { department: true }
  });
}

export async function addProgram(data: { name: string; code: string; educationLevel: string; departmentId: string }) {
  await prisma.program.create({ data });
  revalidatePath("/admin/departments-programs");
}

export async function toggleProgramStatus(id: string, isActive: boolean) {
  await prisma.program.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/departments-programs");
}
