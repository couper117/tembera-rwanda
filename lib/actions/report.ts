"use server";

export interface ReportState {
  error?: string;
  ok?: boolean;
}

/**
 * Reporting a problem with a listing, with the backend removed.
 *
 * There is no reports table, so the message has nowhere to go. Saying that is
 * the only honest option: showing a thank-you for a report that was discarded
 * would be worse than showing nothing at all.
 */
export async function submitReportAction(
  _prev: ReportState,
  _formData: FormData,
): Promise<ReportState> {
  return {
    error:
      "Reporting is not connected yet — this build has no backend, so your report was not sent.",
  };
}
