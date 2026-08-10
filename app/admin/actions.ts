"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getCurrentAdmin,
} from "@/lib/auth";

// --- AUTH ---------------------------------------------------------------

export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.adminUser.findUnique({ where: { email } });
  // Always run a compare to keep timing roughly constant for unknown emails.
  const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinva";
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// --- CATEGORY CRUD ------------------------------------------------------

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

async function saveUploadedImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  // Sanitise the filename and prefix with a timestamp (mirrors legacy logic).
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "");
  const filename = `${Date.now()}_${safe || "image"}`;
  await writeFile(path.join(uploadsDir, filename), bytes);
  return `/uploads/${filename}`;
}

export async function saveCategory(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  // Only a slug-safe page link is accepted; this is what the homepage links to.
  const pageLink = String(formData.get("page_link") ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "");
  const iconClass = String(formData.get("icon_class") ?? "").trim();
  const ctaText = String(formData.get("cta_text") ?? "").trim();
  const currentImage = String(formData.get("current_image") ?? "");
  const imageUrlField = String(formData.get("image_url") ?? "").trim();

  if (!title || !description || !pageLink || !iconClass || !ctaText) {
    // Minimal server-side guard; the form also marks fields required.
    throw new Error("All fields are required.");
  }

  const uploaded = await saveUploadedImage(
    formData.get("image_file") as File | null,
  );
  const imageUrl = uploaded ?? (imageUrlField || currentImage);

  const data = { title, description, imageUrl, pageLink, iconClass, ctaText };

  // Parameterised through Prisma — no string-concatenated SQL (the legacy
  // admin.php interpolated $_POST straight into the query).
  if (id > 0) {
    await prisma.travelCategory.update({ where: { id }, data });
  } else {
    await prisma.travelCategory.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id") ?? 0);
  if (id > 0) {
    await prisma.travelCategory.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}
