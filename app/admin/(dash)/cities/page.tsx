import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { PageHead, Panel } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import CityForm from "./CityForm";
import { deleteCity } from "./actions";

export const dynamic = "force-dynamic";

export default async function CitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const editId = edit ? Number(edit) : NaN;

  const cities = await prisma.city.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const editing = Number.isInteger(editId)
    ? cities.find((c) => c.id === editId) ?? null
    : null;

  return (
    <>
      <PageHead
        title="Cities"
        sub={`${cities.length} districts and cities in the directory.`}
      />

      <div className="a-cols">
        <div>
          <Panel title="Directory" flush>
            <div className="a-tablewrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Group</th>
                    <th>Province</th>
                    <th>Lat</th>
                    <th>Lng</th>
                    <th>Sort</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <p className="a-empty">No cities yet.</p>
                      </td>
                    </tr>
                  ) : (
                    cities.map((c) => (
                      <tr key={c.id}>
                        <td className="a-table__strong">{c.name}</td>
                        <td>{c.group ?? "—"}</td>
                        <td>{c.province ?? "—"}</td>
                        <td>{c.lat ?? "—"}</td>
                        <td>{c.lng ?? "—"}</td>
                        <td>{c.sortOrder}</td>
                        <td>
                          <div className="a-table__actions">
                            <Link
                              href={`/admin/cities?edit=${c.id}`}
                              className="t-btn t-btn--secondary t-btn--sm"
                            >
                              Edit
                            </Link>
                            <form action={deleteCity}>
                              <input type="hidden" name="id" value={c.id} />
                              <ConfirmButton question={`Delete ${c.name}?`} />
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div>
          <Panel title={editing ? `Edit ${editing.name}` : "Add a city"}>
            {editing ? (
              <CityForm
                mode="edit"
                values={{
                  id: editing.id,
                  name: editing.name,
                  group: editing.group ?? "",
                  province: editing.province ?? "",
                  lat: editing.lat?.toString() ?? "",
                  lng: editing.lng?.toString() ?? "",
                  image: editing.image ?? "",
                  sortOrder: editing.sortOrder,
                }}
              />
            ) : (
              <CityForm mode="create" />
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
