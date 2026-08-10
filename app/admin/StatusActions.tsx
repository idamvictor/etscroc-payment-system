"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type Status = "pending" | "approved" | "rejected";
type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

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

export default function StatusActions({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const [current, setCurrent] = useState<Status>(status);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const updateStatus = async (next: Status) => {
    if (next === current || isUpdating) return;
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

  return (
    <div className="flex items-center gap-2">
      <Badge variant={STATUS_VARIANT[current]}>{STATUS_LABELS[current]}</Badge>
      <Button
        type="button"
        size="xs"
        variant="success"
        disabled={isUpdating || current === "approved"}
        onClick={() => updateStatus("approved")}
      >
        Approve
      </Button>
      <Button
        type="button"
        size="xs"
        variant="destructive"
        disabled={isUpdating || current === "rejected"}
        onClick={() => updateStatus("rejected")}
      >
        Reject
      </Button>
      {current !== "pending" && (
        <Button
          type="button"
          size="xs"
          variant="ghost"
          disabled={isUpdating}
          onClick={() => updateStatus("pending")}
        >
          Reset
        </Button>
      )}
    </div>
  );
}
