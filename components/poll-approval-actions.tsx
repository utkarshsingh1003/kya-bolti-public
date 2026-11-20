"use client";

import { useCallback } from "react";
import { Alert, Badge, buttonClass, cn } from "@/components/ui";
import { moderatePollRequest, fetchPollRequests } from "@/components/admin-poll-management";
import { logAuditAction } from "@/lib/audit-log";

type PollRequestStatus = "pending" | "approved" | "rejected" | "published";

interface PendingPoll {
  id: string;
  questionHi: string;
  questionEn: string;
  category: string;
  purpose: string;
  contact: string | null;
  stateId: string | null;
  districtId: string | null;
  status: PollRequestStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export function PollApprovalActions({
  request,
  locale,
}: {
  request: PendingPoll;
  locale: "hi" | "en";
}) {
  const handleApprove = useCallback(async () => {
    try {
      await moderatePollRequest(request.id, "approve", locale);
      logAuditAction({
        action: "poll_request_approved",
        actor: "admin",
        pollRequestId: request.id,
        details: `Poll request approved: ${request.questionHi}`,
      });
      Alert({
        title: locale === "hi" ? "सफलता" : "Success",
        tone: "success",
        children: locale === "hi" ? "प्रस्ताव स्वीकृत किया गया।" : "Poll request approved.",
      });
    } catch (err) {
      logAuditAction({
        action: "poll_request_approved",
        actor: "admin",
        pollRequestId: request.id,
        details: `Failed to approve: ${(err as Error).message}`,
      });
      Alert({
        title: locale === "hi" ? "त्रुटि" : "Error",
        tone: "danger",
        children: locale === "hi" ? "त्रुटि हुई।" : "An error occurred.",
      });
    }
  }, [request.id, locale]);

  const handleReject = useCallback(async () => {
    try {
      await moderatePollRequest(request.id, "reject", locale);
      logAuditAction({
        action: "poll_request_rejected",
        actor: "admin",
        pollRequestId: request.id,
        details: `Poll request rejected: ${request.questionHi}`,
      });
      Alert({
        title: locale === "hi" ? "सफलता" : "Success",
        tone: "success",
        children: locale === "hi" ? "प्रस्ताव अस्वीकृत किया गया।" : "Poll request rejected.",
      });
    } catch (err) {
      logAuditAction({
        action: "poll_request_rejected",
        actor: "admin",
        pollRequestId: request.id,
        details: `Failed to reject: ${(err as Error).message}`,
      });
      Alert({
        title: locale === "hi" ? "त्रुटि" : "Error",
        tone: "danger",
        children: locale === "hi" ? "त्रुटि हुई।" : "An error occurred.",
      });
    }
  }, [request.id, locale]);

  return (
    <div className="space-y-2">
      {request.status === "pending" ? (
        <>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              className={buttonClass("secondary", "sm")}
              disabled={false}
              title={locale === "hi" ? "स्वीकृत कर रहे हैं" : "Approving"}
            >
              {locale === "hi" ? "स्वीकृत कर रहे..." : "Approving..."}
            </button>
            <button
              onClick={handleReject}
              className={buttonClass("outline", "sm")}
              disabled={false}
              title={locale === "hi" ? "अस्वीकार कर रहे हैं" : "Rejecting"}
            >
              {locale === "hi" ? "अस्वीकार कर रहे..." : "Rejecting..."}
            </button>
          </div>
          <p className="text-[0.66rem] text-navy-500">
            {locale === "hi"
              ? "स्थिति: लंबित प्रशासक स्वीकृति"
              : "Status: Awaiting admin approval"}
          </p>
        </>
      ) : (
        <>
          <Badge tone={request.status === "approved" || request.status === "published" ? "teal" : "gold"}>
            {locale === "hi" ? request.status : request.status}
          </Badge>
          <p className="text-[0.66rem] text-navy-500">
            {locale === "hi" ? "स्थिति: " + request.status : "Status: " + request.status}
          </p>
        </>
      )}
    </div>
  );
}