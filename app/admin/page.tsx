import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { saveCategory, deleteCategory, logout } from "./actions";

export const dynamic = "force-dynamic";

// Replaces legacy pages/admin.php. Same CRUD UI, but:
//  - requires an authenticated admin
//  - all queries go through Prisma (no string-concatenated SQL)
//  - does NOT generate .php files on disk (that was an RCE vector)
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const { edit } = await searchParams;
  const editId = edit ? Number(edit) : 0;
  const editing =
    editId > 0
      ? await prisma.travelCategory.findUnique({ where: { id: editId } })
      : null;

  const categories = await prisma.travelCategory.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="admin-body">
      <div className="d-flex">
        <div className="sidebar col-md-2">
          <h3>VisitRwanda</h3>
          <hr />
          <Link href="/admin">
            <i className="fas fa-list"></i> Categories
          </Link>
          <Link href="/" target="_blank">
            <i className="fas fa-eye"></i> View Website
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="btn btn-link text-start p-0 mt-2"
              style={{ color: "#cfd8dc", textDecoration: "none" }}
            >
              <i className="fas fa-sign-out-alt"></i> Log out ({admin.email})
            </button>
          </form>
        </div>

        <div className="content col-md-10">
          <h2 className="mb-4">Manage Travel Categories</h2>

          <div className="card-custom mb-5">
            <h4>{editing ? "Edit Category" : "Add New Category"}</h4>
            <form action={saveCategory} encType="multipart/form-data">
              <input type="hidden" name="id" defaultValue={editing?.id ?? 0} />
              <input
                type="hidden"
                name="current_image"
                defaultValue={editing?.imageUrl ?? ""}
              />

              <div className="row mt-3">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    defaultValue={editing?.title ?? ""}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Icon (FontAwesome)</label>
                  <input
                    type="text"
                    name="icon_class"
                    className="form-control"
                    defaultValue={editing?.iconClass ?? ""}
                    placeholder="fas fa-landmark"
                    required
                  />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    defaultValue={editing?.description ?? ""}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Page Link (e.g. historics)</label>
                  <input
                    type="text"
                    name="page_link"
                    className="form-control"
                    defaultValue={editing?.pageLink ?? ""}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Button Text</label>
                  <input
                    type="text"
                    name="cta_text"
                    className="form-control"
                    defaultValue={editing?.ctaText ?? ""}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    className="form-control"
                    defaultValue={editing?.imageUrl ?? ""}
                    placeholder="https://… or leave blank"
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">…or upload</label>
                  <input type="file" name="image_file" className="form-control" />
                </div>
              </div>

              <button type="submit" className="btn btn-success">
                {editing ? "Update Category" : "Save Category"}
              </button>
              {editing && (
                <Link href="/admin" className="btn btn-secondary ms-2">
                  Cancel
                </Link>
              )}
            </form>
          </div>

          <div className="card-custom">
            <h4>Current Categories</h4>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.imageUrl}
                        alt={row.title}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 5,
                        }}
                      />
                    </td>
                    <td>{row.title}</td>
                    <td>{row.description.slice(0, 50)}…</td>
                    <td>
                      <Link
                        href={`/admin?edit=${row.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Edit
                      </Link>{" "}
                      <form action={deleteCategory} style={{ display: "inline" }}>
                        <input type="hidden" name="id" defaultValue={row.id} />
                        <button type="submit" className="btn btn-sm btn-danger">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
