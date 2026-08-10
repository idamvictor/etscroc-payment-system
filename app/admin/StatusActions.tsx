"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { badgeVariants } from "@/components/ui/badge";
import type { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type Status = "pending" | "approved" | "rejected";
type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

const STATUS_VARIANT: Record<Status, BadgeVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

const STATUS_LABELS: Record<Status, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

type PendingAction =
  | { type: "status"; status: Status }
  | { type: "delete" };

const ACTION_COPY: Record<
  string,
  {
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant: ButtonVariant;
  }
> = {
  approved: {
    title: "Approve registration?",
    description:
      "The applicant will be notified by email that their payment has been approved.",
    confirmLabel: "Approve",
    confirmVariant: "success",
  },
  rejected: {
    title: "Reject registration?",
    description:
      "The applicant will be notified by email that their payment could not be verified.",
    confirmLabel: "Reject",
    confirmVariant: "destructive",
  },
  pending: {
    title: "Reset to pending?",
    description:
      "This clears the current status back to pending review. No email will be sent.",
    confirmLabel: "Reset",
    confirmVariant: "default",
  },
  delete: {
    title: "Delete registration?",
    description:
      "This permanently removes the registration and its uploaded payment evidence. This cannot be undone.",
    confirmLabel: "Delete",
    confirmVariant: "destructive",
  },
};

export default function StatusActions({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const [current, setCurrent] = useState<Status>(status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const router = useRouter();

  const updateStatus = async (next: Status) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/registrations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setCurrent(next);
        router.refresh();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === "delete") {
      await handleDelete();
    } else {
      await updateStatus(pendingAction.status);
    }
    setPendingAction(null);
  };

  const copyKey =
    pendingAction?.type === "delete" ? "delete" : pendingAction?.status;
  const copy = copyKey ? ACTION_COPY[copyKey] : null;

  return (
    <>
      <TableCell>
        <Badge variant={STATUS_VARIANT[current]}>{STATUS_LABELS[current]}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="xs"
            variant="success"
            disabled={isUpdating || current === "approved"}
            onClick={() => setPendingAction({ type: "status", status: "approved" })}
          >
            Approve
          </Button>
          <Button
            type="button"
            size="xs"
            variant="destructive"
            disabled={isUpdating || current === "rejected"}
            onClick={() => setPendingAction({ type: "status", status: "rejected" })}
          >
            Reject
          </Button>
          {current !== "pending" && (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={isUpdating}
              onClick={() => setPendingAction({ type: "status", status: "pending" })}
            >
              Reset
            </Button>
          )}
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={isUpdating}
            onClick={() => setPendingAction({ type: "delete" })}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete registration"
            title="Delete registration"
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>{copy?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isUpdating}
              onClick={() => setPendingAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={copy?.confirmVariant}
              disabled={isUpdating}
              onClick={handleConfirm}
            >
              {isUpdating ? "Working…" : copy?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
