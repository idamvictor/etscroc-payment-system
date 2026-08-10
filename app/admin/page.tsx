import { supabaseAdmin } from "@/lib/supabase/admin";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

const RECEIPT_URL_TTL_SECONDS = 60 * 60;

function displayValue(primary: string, other: string | null) {
  return primary === "Other" && other ? other : primary;
}

export default async function AdminPage() {
  const { data: registrations, error } = await supabaseAdmin
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-red-700">
          Failed to load registrations: {error.message}
        </p>
      </div>
    );
  }

  const rows = await Promise.all(
    (registrations ?? []).map(async (r) => {
      const { data: signed } = await supabaseAdmin.storage
        .from("receipts")
        .createSignedUrl(r.receipt_path, RECEIPT_URL_TTL_SECONDS);
      return { ...r, receiptUrl: signed?.signedUrl ?? null };
    }),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Registrations ({rows.length})
        </h1>
        <LogoutButton />
      </div>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Submitted</th>
              <th className="px-4 py-3 whitespace-nowrap">Name</th>
              <th className="px-4 py-3 whitespace-nowrap">Email</th>
              <th className="px-4 py-3 whitespace-nowrap">Phone</th>
              <th className="px-4 py-3 whitespace-nowrap">Course</th>
              <th className="px-4 py-3 whitespace-nowrap">Gender</th>
              <th className="px-4 py-3 whitespace-nowrap">Country</th>
              <th className="px-4 py-3 whitespace-nowrap">State/City</th>
              <th className="px-4 py-3 whitespace-nowrap">Employment</th>
              <th className="px-4 py-3 whitespace-nowrap">Education</th>
              <th className="px-4 py-3 whitespace-nowrap">Tech Experience</th>
              <th className="px-4 py-3 whitespace-nowrap">Job Support</th>
              <th className="px-4 py-3 whitespace-nowrap">Referral</th>
              <th className="px-4 py-3 whitespace-nowrap">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.first_name} {r.last_name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{r.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.phone}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.course}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.gender}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {displayValue(r.country, r.country_other)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{r.state_city}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {displayValue(r.employment_status, r.employment_status_other)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {displayValue(r.education_level, r.education_level_other)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.tech_experience}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{r.job_support}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.referral_code || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.receiptUrl ? (
                    <a
                      href={r.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-orange-dark underline underline-offset-2"
                    >
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                  No registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
