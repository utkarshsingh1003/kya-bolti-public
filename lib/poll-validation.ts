export interface QualityCheck {
  valid: boolean;
  questionHiError?: string;
  questionEnError?: string;
  optionsHiError?: string;
  optionsEnError?: string;
  duplicate?: boolean;
  duplicateOf?: string;
  qualityIssues: string[];
}

// Validate poll input before import/approval
export function validatePollInput(
  questionHi: string,
  questionEn: string,
  optionsHi: string[],
  optionsEn: string[]
): QualityCheck {
  const issues: string[] = [];
  let valid = true;

  // Question minimum length
  if (questionHi.trim().length < 10) {
    valid = false;
    issues.push("हिंदी प्रश्न कम से कम 10 अक्षरों का होना चाहिए");
  }
  if (questionEn.trim().length < 10) {
    valid = false;
    issues.push("English question minimum 10 characters");
  }

  // Minimum 2 options
  const activeOptionsHi = optionsHi.filter((o) => o.trim().length > 0);
  const activeOptionsEn = optionsEn.filter((o) => o.trim().length > 0);
  if (activeOptionsHi.length < 2) {
    valid = false;
    issues.push("कम से कम 2 विकल्प हिंदी में आवश्यक हैं");
  }
  if (activeOptionsEn.length < 2) {
    valid = false;
    issues.push("At least 2 options required in English");
  }

  // Maximum 6 options
  if (activeOptionsHi.length > 6) {
    valid = false;
    issues.push("अधिकतम 6 विकल्प अनुमत हैं");
  }
  if (activeOptionsEn.length > 6) {
    valid = false;
    issues.push("Maximum 6 options allowed in English");
  }

  // Duplicate check (normalized question)
  const normalized = `${questionHi.trim().toLowerCase().replace(/\s+/g, ' ')} ${questionEn.trim().toLowerCase().replace(/\s+/g, ' ')}`;
  // Will be checked against existing data at integration point

  return {
    valid,
    questionHiError: questionHi.trim().length < 10 ? "हिंदी प्रश्न कम से कम 10 अक्षर होना चाहिए" : undefined,
    questionEnError: questionEn.trim().length < 10 ? "English question minimum 10 characters" : undefined,
    optionsHiError: activeOptionsHi.length < 2 ? "कम से कम 2 विकल्प हिंदी में आवश्यक हैं" : undefined,
    optionsEnError: activeOptionsEn.length < 2 ? "At least 2 options required in English" : undefined,
    duplicate: false, // Will be set by duplicate detection
    duplicateOf: undefined,
    qualityIssues: issues,
  };
}

// Validate single option length and content
export function validateOption(
  option: string,
  index: number,
  maxLength: number = 90
): { valid: boolean; error?: string } {
  const trimmed = option.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: `विकल्प ${index + 1} खाली नहीं होना चाहिए` };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `विकल्प ${index + 1} अधिकतम ${maxLength} अक्षरों का होना चाहिए` };
  }
  // Check for placeholder content
  const placeholders = ["डमी", "placeholder", "example", "option", "विकल्प", "Option"];
  if (placeholders.some(p => trimmed.toLowerCase().includes(p))) {
    return { valid: false, error: `विकल्प ${index + 1} में स्थानापन्न सामग्री नहीं होनी चाहिए` };
  }
  return { valid: true };
}

// Validate all options
export function validateAllOptions(
  optionsHi: string[],
  optionsEn: string[]
): { valid: boolean; errors: string[]; activeHi: string[]; activeEn: string[] } {
  const errors: string[] = [];
  const activeHi: string[] = [];
  const activeEn: string[] = [];

  const activeHiList = optionsHi.filter((o, i) => {
    const result = validateOption(o, i);
    if (result.valid) {
      activeHi.push(o);
    } else {
      errors.push(result.error || `विकल्प ${optionsHi.length + 1} अमान्य है`);
    }
    return result.valid;
  });

  const activeEnList = optionsEn.filter((o, i) => {
    const result = validateOption(o, i);
    if (result.valid) {
      activeEn.push(o);
    } else {
      errors.push(result.error || `Option ${optionsEn.length + 1} invalid`);
    }
    return result.valid;
  });

  return {
    valid: errors.length === 0,
    errors,
    activeHi: activeHiList,
    activeEn: activeEnList,
  };
}