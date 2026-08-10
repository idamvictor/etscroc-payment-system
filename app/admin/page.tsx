import Link from "next/link";
import { ClipboardList, ExternalLink } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatNlsRegistrationId } from "@/lib/nls-registration-id";
import LogoutButton from "./LogoutButton";
import StatusActions from "./StatusActions";
import { Badge } from "@/components/ui/badge";
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
    .from("nls_registrations")
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
      <div className="h-1 w-full bg-linear-to-r from-brand-orange-dark via-brand-orange to-brand-blue" />
      <div className="max-w-400 mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-orange-dark to-brand-orange text-white shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                NLS × ETSCROC Registrations
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline">{counts.all} total</Badge>
                <Badge variant="warning">
                  {counts.pending} awaiting review
                </Badge>
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>

        <nav className="inline-flex items-center gap-1 mb-4 p-1 bg-muted rounded-full">
          {STATUS_TABS.map((tab) => {
            const isActive = tab === activeTab;
            const href = tab === "all" ? "/admin" : `/admin?status=${tab}`;
            return (
              <Link
                key={tab}
                href={href}
                className={`px-4 py-2 text-sm font-semibold capitalize rounded-full transition ${
                  isActive
                    ? "bg-brand-orange-dark text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}{" "}
                <span className={isActive ? "text-white/80" : "text-muted-foreground"}>
                  ({counts[tab]})
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="bg-card rounded-xl shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 z-10 divide-x divide-border bg-card">
                <TableHead>Registration ID</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Matric Number</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Total Amount Paid</TableHead>
                <TableHead>Payment Reference</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="divide-x divide-border">
                  <TableCell className="font-mono font-semibold text-brand-orange-dark">
                    {formatNlsRegistrationId(r.registration_number)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{r.full_name}</TableCell>
                  <TableCell>{r.whatsapp_phone}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.matric_number}</TableCell>
                  <TableCell>{r.campus}</TableCell>
                  <TableCell>{r.courses.join(", ")}</TableCell>
                  <TableCell>
                    ₦{r.total_amount_paid.toLocaleString()}
                  </TableCell>
                  <TableCell>{r.payment_reference}</TableCell>
                  <TableCell>
                    {r.receiptUrl ? (
                      <a
                        href={r.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-brand-orange-dark transition hover:bg-orange-100"
                      >
                        <ExternalLink className="h-3 w-3" />
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
                  <TableCell colSpan={13} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">
                        No registrations
                        {activeTab !== "all"
                          ? ` with status "${activeTab}"`
                          : " yet"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        New submissions will show up here automatically.
                      </p>
                    </div>
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
