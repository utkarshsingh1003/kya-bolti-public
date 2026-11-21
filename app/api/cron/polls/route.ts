import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";
import { logAuditAction } from "@/lib/audit-log";
import { normalizePollQuestion } from "@/lib/poll-provider-types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Authentication check - follow news cron pattern
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET) {
    const authorization = request.headers.get("authorization");
    if (!authorization || authorization !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured. Refusing to run poll fetch." },
      { status: 503 },
    );
  }

  const repo = await getRepository();
  const startTime = Date.now();

  let pollsImported = 0;
  let pollsSkipped = 0;
  let duplicatesDetected = 0;
  const errors: string[] = [];

  // 2. Fetch ALL pending poll requests from database
  // listPollRequests() takes no arguments - filter locally
  const allRequests = await repo.listPollRequests();
  const requests = allRequests.filter((r) => r.status === "pending");

  // 3. Track fetch history
  const provider = "user_submitted";

  // 4. Process each pending request
  for (const req of requests) {
    try {
      // Check for duplicates against existing polls using normalized question matching
      const existingPolls = await repo.listAllPolls();
      const normNew = normalizePollQuestion(req.questionHi, req.questionEn);

      let foundDuplicate = false;
      for (const poll of existingPolls) {
        const existingNorm = normalizePollQuestion(poll.question?.hi || "", poll.question?.en || "");
        if (normNew === existingNorm) {
          foundDuplicate = true;
          // Mark as duplicate
          try {
            await repo.setPollRequestStatus(req.id, "pending", `Duplicate of existing poll`);
          } catch {}
          duplicatesDetected++;
          break;
        }
      }

      if (foundDuplicate) {
        pollsSkipped++;
        continue;
      }

      // Import the poll request as a actual poll
      // Convert poll request options to poll options format
      const options = req.optionsHi.map((hi, index) => ({
        hi,
        en: req.optionsEn[index] ?? hi,
      }));

      const poll = await repo.createPoll({
        question: { hi: req.questionHi, en: req.questionEn },
        description: {
          hi: req.purpose || "नागरिक अनुरोध से स्वीकृत सामुदायिक पोल।",
          en: "Community poll approved from a citizen request.",
        },
        category: req.category,
        closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        options,
      });

      // Mark the poll request as published with the new poll ID
      await repo.setPollRequestStatus(req.id, "published", null, poll.id);

      // Log the import action
      await logAuditAction({
        action: "poll_request_published",
        actor: "system",
        pollId: poll.id,
        pollRequestId: req.id,
        details: `Cron-imported poll request #${req.id} as poll #${poll.id}`,
      });

      pollsImported++;
    } catch (err) {
      errors.push(`Error processing request #${req.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  const duration = Date.now() - startTime;

  // 5. Record fetch history in database
  try {
    await repo.createPollFetchHistory({
      providerId: provider,
      recordsFetched: requests.length,
      validPolls: pollsImported,
      duplicates: duplicatesDetected,
      rejected: errors.length,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
      success: errors.length === 0,
    });
  } catch (e) {
    // If fetch history tracking fails, don't block the poll import
    console.error("Failed to record fetch history:", e);
  }

  // 6. Return results with fetch metadata
  return noStore({
    ok: true,
    fetchedAt: new Date().toISOString(),
    pollsImported,
    pollsSkipped,
    duplicatesDetected,
    durationMs: duration,
    errors,
    mode: "user_submitted" as const,
    fetchedByCron: true,
    totalPending: requests.length,
  });
}

export const POST = GET;
