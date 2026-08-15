"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDepartments() {
  const depts = await prisma.department.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      programs: {
        include: {
          students: { select: { id: true } }
        }
      }
    }
  });

  return depts.map(d => {
    const studentCount = d.programs.reduce((acc, p) => acc + (p.students?.length || 0), 0);
    return {
      ...d,
      studentCount,
      hasData: studentCount > 0
    };
  });
}

export async function addDepartment(data: { 
  name: string; 
  code: string; 
  hodName: string; 
  phone?: string; 
  email?: string; 
  startingYear?: number; 
  studentCapacity?: number 
}) {
  await prisma.department.create({ 
    data: {
      name: data.name,
      code: data.code,
      hodName: data.hodName || null,
    } 
  });
  revalidatePath("/admin/departments-programs");
}

export async function toggleDepartmentStatus(id: string, isActive: boolean) {
  await prisma.department.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/departments-programs");
}

export async function getPrograms() {
  const progs = await prisma.program.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      department: true,
      students: { select: { id: true } },
      courses: {
        select: {
          id: true,
          marks: { select: { id: true } }
        }
      }
    }
  });

  return progs.map(p => {
    const studentCount = p.students?.length || 0;
    const marksCount = p.courses?.reduce((acc, c) => acc + (c.marks?.length || 0), 0) || 0;
    return {
      ...p,
      studentCount,
      marksCount,
      hasData: (studentCount + marksCount) > 0
    };
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

export async function updateDepartment(id: string, data: { name: string; code: string; hodName: string }) {
  try {
    await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        hodName: data.hodName || null
      }
    });
    revalidatePath("/admin/departments-programs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update department" };
  }
}

export async function deleteDepartment(id: string) {
  try {
    await prisma.department.delete({ where: { id } });
    revalidatePath("/admin/departments-programs");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2003") {
      return { 
        success: false, 
        error: "Cannot delete department because it has active programs, students, or courses linked to it." 
      };
    }
    return { success: false, error: error.message || "Failed to delete department" };
  }
}

export async function updateProgram(id: string, data: { name: string; code: string; educationLevel: string; departmentId: string }) {
  try {
    await prisma.program.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        educationLevel: data.educationLevel,
        departmentId: data.departmentId || null
      }
    });
    revalidatePath("/admin/departments-programs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update program" };
  }
}

export async function deleteProgram(id: string) {
  try {
    await prisma.program.delete({ where: { id } });
    revalidatePath("/admin/departments-programs");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2003") {
      return { 
        success: false, 
        error: "Cannot delete program because it has active students or marks linked to it." 
      };
    }
    return { success: false, error: error.message || "Failed to delete program" };
  }
}
