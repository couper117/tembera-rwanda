"use client";

import { useEffect } from "react";
import { pushVisit } from "@/lib/client/visited";

/**
 * Records that this place was opened. Renders nothing — it exists so the place
 * page can stay a server component while still feeding the visit history the
 * profile reads.
 */
export default function VisitRecorder({ id }: { id: string }) {
  useEffect(() => {
    pushVisit(id);
  }, [id]);

  return null;
}
