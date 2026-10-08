export type Choice = {
  id: string;
  label: string;
  description?: string;
};

export type RequirementView = {
  id: string;
  label: string;
  code: string;
  status: string;
  mandatory: boolean;
  personId?: string | null;
};

export type IncomeDraft = {
  id: string;
  personId: string;
  type: string;
  amountCents: number;
};

export type PersonDraft = {
  id: string;
  fullName: string;
  role: "APPLICANT" | "HOUSEHOLD_MEMBER";
  identityType?: string;
  identityMasked?: string;
  incomeComplete?: boolean;
  hasIncome?: boolean;
};

export type WorkflowContext = {
  resumeStep?: string;
  flow?: string;
  language?: string;
  mobile?: string;
  otpHash?: string;
  firstName?: string;
  surname?: string;
  applyingForSelf?: boolean;
  hasMunicipalAccount?: "YES" | "NO" | "UNSURE";
  municipalAccountMasked?: string;
  propertyLabel?: string;
  identityType?: string;
  identityMasked?: string;
  capacity?: string;
  ordinaryResidence?: string;
  propertyUse?: string;
  adultCount?: number;
  currentAdultIndex?: number;
  incomePersonIndex?: number;
  pendingIncomeType?: string;
  people?: PersonDraft[];
  incomes?: IncomeDraft[];
  reviewConfirmed?: boolean;
  translationNoticeShown?: boolean;
  selectedRequirementId?: string;
};

export type SessionRecord = {
  id: string;
  channel_type: string;
  channel_identifier: string;
  case_id: string | null;
  workflow_step: string;
  language: string;
  auth_level: number;
  context_json: string;
  created_at: string;
  updated_at: string;
};

export type ChatInput = {
  sessionId?: string;
  channelType: "WEB" | "WHATSAPP" | "ASSISTED";
  channelIdentifier?: string;
  text?: string;
  action?: string;
  providerMessageId?: string;
};

export type ChatReply = {
  language?: string;
  localized?: boolean;
  sessionId: string;
  caseId?: string | null;
  caseReference?: string | null;
  step: string;
  message: string;
  choices?: Choice[];
  inputType?: "text" | "phone" | "number" | "money" | "none";
  placeholder?: string;
  progress: number;
  requirements?: RequirementView[];
  summary?: Record<string, string | number | boolean | null>;
  debugOtp?: string;
  status?: string;
};
