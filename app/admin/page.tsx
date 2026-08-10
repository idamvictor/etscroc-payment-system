import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import LogoutButton from "./LogoutButton";
import StatusActions from "./StatusActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const RECEIPT_URL_TTL_SECONDS = 60 * 60;
const STATUS_TABS = ["all", "pending", "approved", "rejected"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function isStatusTab(value: string | undefined): value is StatusTab {
  return !!value && (STATUS_TABS as readonly string[]).includes(value);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab: StatusTab = isStatusTab(status) ? status : "all";

  const { data: registrations, error } = await supabaseAdmin
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-destructive">
          Failed to load registrations: {error.message}
        </p>
      </div>
    );
  }

  const allRows = await Promise.all(
    (registrations ?? []).map(async (r) => {
      const { data: signed } = await supabaseAdmin.storage
        .from("receipts")
        .createSignedUrl(r.receipt_path, RECEIPT_URL_TTL_SECONDS);
      return { ...r, receiptUrl: signed?.signedUrl ?? null };
    }),
  );

  const counts = {
    all: allRows.length,
    pending: allRows.filter((r) => r.payment_status === "pending").length,
    approved: allRows.filter((r) => r.payment_status === "approved").length,
    rejected: allRows.filter((r) => r.payment_status === "rejected").length,
  };

  const rows =
    activeTab === "all"
      ? allRows
      : allRows.filter((r) => r.payment_status === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-400 mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Registrations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {counts.all} total &middot; {counts.pending} awaiting review
            </p>
          </div>
          <LogoutButton />
        </div>

        <nav className="flex gap-1 mb-4 border-b border-border">
          {STATUS_TABS.map((tab) => {
            const isActive = tab === activeTab;
            const href = tab === "all" ? "/admin" : `/admin?status=${tab}`;
            return (
              <Link
                key={tab}
                href={href}
                className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab} <span className="text-muted-foreground">({counts[tab]})</span>
              </Link>
            );
          })}
        </nav>

        <div className="bg-card border border-border rounded-xl shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="divide-x divide-border">
                <TableHead>Submitted</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Country (Other)</TableHead>
                <TableHead>State/City</TableHead>
                <TableHead>Employment Status</TableHead>
                <TableHead>Employment (Other)</TableHead>
                <TableHead>Education Level</TableHead>
                <TableHead>Education (Other)</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Tech Experience</TableHead>
                <TableHead>Job Support</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Agreed to Terms</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="divide-x divide-border">
                  <TableCell className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{r.first_name}</TableCell>
                  <TableCell>{r.last_name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell>{r.gender}</TableCell>
                  <TableCell>{r.country}</TableCell>
                  <TableCell>{r.country_other || "—"}</TableCell>
                  <TableCell>{r.state_city}</TableCell>
                  <TableCell>{r.employment_status}</TableCell>
                  <TableCell>{r.employment_status_other || "—"}</TableCell>
                  <TableCell>{r.education_level}</TableCell>
                  <TableCell>{r.education_level_other || "—"}</TableCell>
                  <TableCell>{r.course}</TableCell>
                  <TableCell>{r.tech_experience}</TableCell>
                  <TableCell>{r.job_support}</TableCell>
                  <TableCell>{r.referral_code || "—"}</TableCell>
                  <TableCell>{r.agree_terms ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {r.receiptUrl ? (
                      <a
                        href={r.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium underline underline-offset-2"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <StatusActions id={r.id} status={r.payment_status} />
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={21}
                    className="text-center text-muted-foreground py-12"
                  >
                    No registrations
                    {activeTab !== "all" ? ` with status "${activeTab}"` : ""}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
