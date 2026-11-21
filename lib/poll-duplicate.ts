// Type definitions for duplicate checking
type Poll = {
  id: string;
  question: { hi: string; en: string };
  description: { hi: string; en: string };
  category: string;
  closesAt: string;
  status?: string;
  featured?: boolean;
  sponsored?: boolean;
  isDemo: boolean;
  createdAt: string;
  options: { id: string; label: { hi: string; en: string } }[];
};

type PollRequest = {
  id: string;
  questionHi: string;
  questionEn: string;
  optionsHi: string[];
  optionsEn: string[];
  category: string;
  purpose: string;
  contact: string | null;
  stateId: string | null;
  districtId: string | null;
  status: string;
  adminNote: string | null;
  createdPollId: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
};

// Normalize question for duplicate detection
export function normalizeQuestion(questionHi: string, questionEn: string): string {
  return `${questionHi.trim().toLowerCase().replace(/\s+/g, ' ')} ${questionEn.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

// Check if a poll/poll request is a duplicate of existing entries
// Returns the ID of the original if duplicate, or undefined if not
export function isDuplicate(
  questionHi: string,
  questionEn: string,
  existingPolls: Poll[],
  existingRequests: PollRequest[]
): { isDuplicate: boolean; originalId?: string; normalized: string } {
  const normalized = normalizeQuestion(questionHi, questionEn);

  // Check against existing polls
  for (const poll of existingPolls) {
    const existingNorm = normalizeQuestion(poll.question?.hi || "", poll.question?.en || "");
    if (normalized === existingNorm) {
      return { isDuplicate: true, originalId: poll.id, normalized };
    }
  }

  // Check against existing poll requests
  for (const req of existingRequests) {
    const existingNorm = normalizeQuestion(req.questionHi, req.questionEn);
    if (normalized === existingNorm) {
      return { isDuplicate: true, originalId: req.id, normalized };
    }
  }

  return { isDuplicate: false, originalId: undefined, normalized };
}

// Batch check for duplicates - useful for import scenarios
export function batchCheckDuplicates(
  newEntries: { questionHi: string; questionEn: string }[],
  existingPolls: Poll[],
  existingRequests: PollRequest[]
): Array<{ isDuplicate: boolean; originalId?: string; normalized: string }> {
  return newEntries.map(({ questionHi, questionEn }) => {
    return isDuplicate(questionHi, questionEn, existingPolls, existingRequests) as {
      isDuplicate: boolean;
      originalId?: string;
      normalized: string;
    };
  });
}