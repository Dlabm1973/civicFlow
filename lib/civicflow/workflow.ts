import { languageCodes, localizeReply } from "./languages";
import {
  addIncome,
  addMessage,
  addPerson,
  addRequirement,
  addTask,
  audit,
  caseReference,
  createCase,
  createSession,
  database,
  findSession,
  getRequirements,
  maskValue,
  parseContext,
  saveSession,
  setPersonIncomeStatus,
  updateCase,
} from "./repository";
import type {
  ChatInput,
  ChatReply,
  Choice,
  PersonDraft,
  SessionRecord,
  WorkflowContext,
} from "./types";

const LANGUAGES: Choice[] = [
  { id: "LANG_EN", label: "English" },
  { id: "LANG_AF", label: "Afrikaans" },
  { id: "LANG_ZU", label: "isiZulu" },
  { id: "LANG_NR", label: "isiNdebele" },
  { id: "LANG_ST", label: "Sesotho" },
];

const MENU: Choice[] = [
  { id: "MENU_LANGUAGE", label: "Change language" },
  { id: "MENU_APPLY", label: "Apply for indigent support" },
  { id: "MENU_RENEW", label: "Renew or verify my support" },
  { id: "MENU_RATES", label: "Property-rates rebate" },
  { id: "MENU_STATUS", label: "Check my application" },
  { id: "MENU_UPLOAD", label: "Upload requested information" },
  { id: "MENU_CHANGE", label: "Report a change" },
  { id: "MENU_APPEAL", label: "Appeal a decision" },
  { id: "MENU_HELP", label: "I need help" },
];

const CAPACITIES: Choice[] = [
  { id: "OWNER", label: "I own the property" },
  { id: "JOINT_OWNER", label: "I jointly own the property" },
  { id: "ACCOUNT_HOLDER", label: "The municipal account is in my name" },
  { id: "MUNICIPAL_TENANT", label: "I rent a municipal property" },
  { id: "ESTATE", label: "I am dealing with a deceased estate" },
  { id: "HEIR", label: "I am an heir or successor" },
  { id: "GUARDIAN", label: "I am the household guardian" },
  { id: "DIVORCE", label: "The property was awarded to me in a divorce" },
  { id: "CAPACITY_HELP", label: "None of these / I need help" },
];

const INCOME_TYPES: Choice[] = [
  { id: "SALARY_WAGES", label: "Salary or wages" },
  { id: "CASUAL_TEMPORARY_WORK", label: "Casual or temporary work" },
  { id: "SELF_EMPLOYMENT", label: "Self-employment or informal trade" },
  { id: "PENSION", label: "Pension" },
  { id: "SOCIAL_GRANT", label: "Social grant" },
  { id: "RENTAL_INCOME", label: "Rent or board" },
  { id: "MAINTENANCE_SUPPORT", label: "Maintenance or support" },
  { id: "OTHER_REGULAR_INCOME", label: "Other income" },
];

const LANGUAGE_CODES: Record<string, string> = languageCodes;

const PROGRESS: Record<string, number> = {
  LANGUAGE: 0,
  MAIN_MENU: 4,
  MOBILE: 8,
  OTP: 12,
  ACCOUNT_STATUS: 17,
  APPLYING_SELF: 21,
  FIRST_NAME: 25,
  SURNAME: 29,
  IDENTITY_TYPE: 34,
  IDENTITY_NUMBER: 38,
  ACCOUNT_NUMBER: 43,
  LOCATION: 43,
  CAPACITY: 49,
  RESIDENCE: 54,
  PROPERTY_USE: 59,
  ADULT_COUNT: 64,
  ADULT_NAME: 68,
  ADULT_ID_TYPE: 71,
  ADULT_ID_NUMBER: 74,
  INCOME_ANY: 78,
  INCOME_TYPE: 81,
  INCOME_AMOUNT: 84,
  INCOME_MORE: 86,
  CONSENT: 89,
  DOCUMENTS: 92,
  REVIEW: 97,
  SUBMITTED: 100,
};

function answer(input: ChatInput) {
  return (input.action || input.text || "").trim();
}

function normalise(value: string) {
  return value.trim().toUpperCase();
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function otpCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

function displayReference() {
  const year = new Date().getUTCFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CF-GMM-${year}-${random}`;
}

function personName(context: WorkflowContext, index: number) {
  return context.people?.[index]?.fullName || `adult ${index + 1}`;
}


function currentPerson(context: WorkflowContext) {
  return context.people?.[context.currentAdultIndex ?? 1];
}

function currentIncomePerson(context: WorkflowContext) {
  return context.people?.[context.incomePersonIndex ?? 0];
}

async function persist(
  session: SessionRecord,
  step: string,
  context: WorkflowContext,
  authLevel = session.auth_level
) {
  await saveSession(session.id, {
    workflowStep: step,
    language: context.language || session.language || "en",
    authLevel,
    caseId: session.case_id,
    context,
  });
  if (session.case_id && !["MAIN_MENU", "STATUS_REFERENCE", "LANGUAGE", "LANGUAGE_CHANGE"].includes(step)) {
    await updateCase(session.case_id, {
      step,
      progress: PROGRESS[step] ?? 0,
      propertyLabel: context.propertyLabel,
    });
  }
}

async function replyForStep(
  session: SessionRecord,
  context: WorkflowContext,
  override?: Partial<ChatReply>
): Promise<ChatReply> {
  const step = override?.step || session.workflow_step;
  const base: ChatReply = {
    sessionId: session.id,
    language: context.language || session.language || "en",
    caseId: session.case_id,
    caseReference: await caseReference(session.case_id),
    step,
    message: "",
    progress: PROGRESS[step] ?? 0,
  };

  const applicant = context.people?.[0];
  const prompts: Record<string, Partial<ChatReply>> = {
    LANGUAGE_CHANGE: { message: "Choose your language.", choices: LANGUAGES, inputType: "none" },
    LANGUAGE: {
      message:
        "Welcome to Khula, Govan Mbeki Local Municipality’s digital assistant. I can help with municipal financial relief. Choose your language.",
      choices: LANGUAGES,
      inputType: "none",
    },
    MAIN_MENU: {
      message: "What would you like to do?",
      choices: context.resumeStep ? [{ id: "MENU_CONTINUE", label: "Continue my application" }, ...MENU] : MENU,
      inputType: "none",
    },
    MOBILE: {
      message:
        session.channel_type === "WHATSAPP"
          ? "I will verify the WhatsApp number you are using. Reply with the one-time PIN in my next message."
          : "Enter the mobile number you want to use for this application.",
      inputType: session.channel_type === "WHATSAPP" ? "none" : "phone",
      placeholder: "e.g. 082 123 4567",
    },
    OTP: {
      message: "Enter the six-digit one-time PIN.",
      inputType: "number",
      placeholder: "6-digit PIN",
    },
    ACCOUNT_STATUS: {
      message: "Do you have a municipal account for the property?",
      choices: [
        { id: "ACCOUNT_YES", label: "Yes" },
        { id: "ACCOUNT_NO", label: "No" },
        { id: "ACCOUNT_UNSURE", label: "I’m not sure" },
      ],
      inputType: "none",
    },
    APPLYING_SELF: {
      message: "Are you applying for yourself?",
      choices: [
        { id: "SELF_YES", label: "Yes" },
        { id: "SELF_NO", label: "No, I am helping someone" },
      ],
      inputType: "none",
    },
    FIRST_NAME: {
      message: context.applyingForSelf
        ? "What is your first name?"
        : "What is the applicant’s first name?",
      inputType: "text",
      placeholder: "First name",
    },
    SURNAME: {
      message: context.applyingForSelf
        ? "What is your surname?"
        : "What is the applicant’s surname?",
      inputType: "text",
      placeholder: "Surname",
    },
    IDENTITY_TYPE: {
      message: `Which identity document does ${applicant?.fullName || "the applicant"} use?`,
      choices: [
        { id: "SA_ID", label: "South African ID" },
        { id: "PASSPORT", label: "Passport" },
        { id: "OTHER_ID", label: "Another approved document" },
        { id: "NO_ID", label: "No identity document" },
        { id: "ID_HELP", label: "I need help" },
      ],
      inputType: "none",
    },
    IDENTITY_NUMBER: {
      message: "Enter the identity or passport number. It will be masked in ordinary screens.",
      inputType: "text",
      placeholder: "Identity reference",
    },
    ACCOUNT_NUMBER: {
      message:
        "Enter the municipal account number. This sandbox records it for later Munsoft matching and will not display protected account data.",
      inputType: "text",
      placeholder: "Municipal account number",
    },
    LOCATION: {
      message:
        "Describe where the property is located. Include the town or settlement and the street, stand or landmark if known.",
      inputType: "text",
      placeholder: "Property or settlement location",
    },
    CAPACITY: {
      message: "Which of these best describes the applicant’s connection to the property?",
      choices: CAPACITIES,
      inputType: "none",
    },
    RESIDENCE: {
      message: "Does the applicant normally live at this property as their home?",
      choices: [
        { id: "RES_YES", label: "Yes" },
        { id: "RES_NO", label: "No" },
        { id: "RES_AWAY", label: "Temporarily away" },
        { id: "RES_HELP", label: "I’m not sure / help" },
      ],
      inputType: "none",
    },
    PROPERTY_USE: {
      message: "How is the property mainly used?",
      choices: [
        { id: "USE_HOME", label: "Only as a home" },
        { id: "USE_SMALL_BUSINESS", label: "Home with a small business" },
        { id: "USE_BUSINESS", label: "Mainly for business" },
        { id: "USE_RENTED", label: "Rented to someone else" },
        { id: "USE_OTHER", label: "Other / not sure" },
      ],
      inputType: "none",
    },
    ADULT_COUNT: {
      message: "How many people aged 18 or older normally live at this property, including the applicant?",
      inputType: "number",
      placeholder: "Number of adults",
    },
    ADULT_NAME: {
      message: `Enter the full legal name of adult ${(context.currentAdultIndex ?? 1) + 1}.`,
      inputType: "text",
      placeholder: "Full legal name",
    },
    ADULT_ID_TYPE: {
      message: `Which identity document does ${currentPerson(context)?.fullName || "this adult"} use?`,
      choices: [
        { id: "SA_ID", label: "South African ID" },
        { id: "PASSPORT", label: "Passport" },
        { id: "OTHER_ID", label: "Another approved document" },
        { id: "NO_ID", label: "No identity document" },
        { id: "ID_HELP", label: "I need help" },
      ],
      inputType: "none",
    },
    ADULT_ID_NUMBER: {
      message: `Enter ${currentPerson(context)?.fullName || "this adult"}’s identity reference.`,
      inputType: "text",
      placeholder: "Identity reference",
    },
    INCOME_ANY: {
      message: `Does ${currentIncomePerson(context)?.fullName || "this adult"} receive money from work, a pension, a grant, a business, rent or another source?`,
      choices: [
        { id: "INCOME_YES", label: "Yes" },
        { id: "INCOME_NO", label: "No income" },
      ],
      inputType: "none",
    },
    INCOME_TYPE: {
      message: `Select ${currentIncomePerson(context)?.fullName || "this adult"}’s income source.`,
      choices: INCOME_TYPES,
      inputType: "none",
    },
    INCOME_AMOUNT: {
      message:
        "Enter the gross amount received per month, before deductions. Irregular income will be flagged for staff review.",
      inputType: "money",
      placeholder: "Amount in rand",
    },
    INCOME_MORE: {
      message: `Does ${currentIncomePerson(context)?.fullName || "this adult"} have another income source?`,
      choices: [
        { id: "MORE_YES", label: "Yes, add another" },
        { id: "MORE_NO", label: "No, continue" },
      ],
      inputType: "none",
    },
    CONSENT: {
      message:
        "Do you authorise the municipality to verify the information supplied for this application through approved sources? This consent is separate from the required sworn affidavit.",
      choices: [
        { id: "CONSENT_YES", label: "I authorise verification" },
        { id: "CONSENT_NO", label: "I do not authorise it" },
      ],
      inputType: "none",
    },
    DOCUMENTS: {
      message:
        "Upload each required document below. Files remain linked to this case; an upload is recorded as pending municipal review.",
      inputType: "none",
    },
    REVIEW: {
      message:
        "Review the application summary. CivicFlow checks document completeness and readability. Legal vetting and the application decision are handled separately.",
      choices: [
        { id: "SUBMIT", label: "Confirm and submit" },
        { id: "REVIEW_HELP", label: "I need help before submitting" },
      ],
      inputType: "none",
    },
    SUBMITTED: {
      message:
        "Your application has been submitted for basic document review. The external vetting system or authorised manual reviewer will decide the outcome.",
      choices: [{ id: "MENU_STATUS", label: "Check application status" }],
      inputType: "none",
    },
    STATUS_REFERENCE: {
      message: "Enter the CivicFlow case reference, for example CF-GMM-2026-123456.",
      inputType: "text",
      placeholder: "Case reference",
    },
  };
  return { ...base, ...(prompts[step] || {}), ...override };
}

async function withWhatsAppRequirements(
  session: SessionRecord,
  reply: ChatReply
) {
  if (session.channel_type !== "WHATSAPP" || !session.case_id || reply.step !== "DOCUMENTS") {
    return reply;
  }
  const requirements = await getRequirements(session.case_id);
  const outstanding = requirements.filter((item) => ["OUTSTANDING", "BASIC_REUPLOAD_REQUIRED"].includes(item.status));
  reply.requirements = requirements;
  reply.choices = [
    ...outstanding.slice(0, 9).map((item) => ({
      id: `REQ_${item.id}`,
      label: item.label,
    })),
    { id: "DOC_DONE", label: "I have finished" },
  ];
  return reply;
}

async function nextIncomePerson(
  session: SessionRecord,
  context: WorkflowContext
): Promise<ChatReply> {
  const nextIndex = (context.incomePersonIndex ?? 0) + 1;
  if (nextIndex < (context.people?.length ?? 0)) {
    context.incomePersonIndex = nextIndex;
    await persist(session, "INCOME_ANY", context);
    return replyForStep({ ...session, workflow_step: "INCOME_ANY" }, context);
  }
  await ensureRequirements(session.case_id!, context);
  await audit({
    caseId: session.case_id,
    actorType: "RESIDENT",
    eventCode: "MEMBER_INCOME_STATUS_COMPLETED",
    entityType: "CASE",
    entityId: session.case_id!,
  });
  await persist(session, "CONSENT", context);
  return replyForStep({ ...session, workflow_step: "CONSENT" }, context);
}

async function ensureRequirements(caseId: string, context: WorkflowContext) {
  const existing = await getRequirements(caseId);
  if (existing.length) return;
  for (const person of context.people ?? []) {
    await addRequirement({
      id: crypto.randomUUID(),
      caseId,
      personId: person.id,
      code: "IDENTITY_DOCUMENT",
      label: `Certified identity document for ${person.fullName}`,
    });
    if (!person.hasIncome) {
      await addRequirement({
        id: crypto.randomUUID(),
        caseId,
        personId: person.id,
        code: "NO_INCOME_AFFIDAVIT",
        label: `Sworn no-income declaration for ${person.fullName}`,
      });
    }
  }
  for (const item of context.incomes ?? []) {
    const person = context.people?.find((entry) => entry.id === item.personId);
    await addRequirement({
      id: crypto.randomUUID(),
      caseId,
      personId: item.personId,
      code: `${item.type}_PROOF`,
      label: `Proof of ${person?.fullName || "household member"}’s ${item.type
        .toLowerCase()
        .replaceAll("_", " ")}`,
    });
  }
  const special: Record<string, [string, string]> = {
    ESTATE: ["LETTER_OF_AUTHORITY", "Letter of Authority or estate appointment"],
    HEIR: ["ESTATE_AUTHORITY_OR_SPECIAL_APPROVAL", "Estate authority or Special Indigent supporting document"],
    GUARDIAN: ["GUARDIANSHIP_DOCUMENT", "Guardianship letter or approved authority"],
    DIVORCE: ["DIVORCE_DECREE", "Certified divorce decree recording the property award"],
    MUNICIPAL_TENANT: ["MUNICIPAL_LEASE", "Municipal residential lease or source confirmation"],
  };
  if (context.capacity && special[context.capacity]) {
    await addRequirement({
      id: crypto.randomUUID(),
      caseId,
      code: special[context.capacity][0],
      label: special[context.capacity][1],
    });
  }
  await addRequirement({
    id: crypto.randomUUID(),
    caseId,
    code: "SWORN_APPLICATION_AFFIDAVIT",
    label: "Executed and commissioned application affidavit",
  });
}

function summary(context: WorkflowContext) {
  const totalCents = (context.incomes ?? []).reduce(
    (sum, item) => sum + item.amountCents,
    0
  );
  return {
    Applicant: context.people?.[0]?.fullName || null,
    "Municipal account":
      context.hasMunicipalAccount === "YES"
        ? context.municipalAccountMasked || "Captured"
        : context.hasMunicipalAccount === "NO"
          ? "No conventional account"
          : "Uncertain — staff matching required",
    Property: context.propertyLabel || "Municipal matching required",
    Capacity: context.capacity || null,
    "Ordinarily resident": context.ordinaryResidence || null,
    "Property use": context.propertyUse || null,
    "Adult occupants": context.people?.length || 0,
    "Declared gross monthly household income": `R ${(totalCents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
    "Vetting result": "Awaiting external or authorised manual reviewer",
  };
}

async function handleReferenceRoute(
  session: SessionRecord,
  context: WorkflowContext,
  route: string,
  reference: string
) {
  const found = await database()
    .prepare(
      "SELECT id, reference, current_state, progress, applicant_name, updated_at FROM cases WHERE UPPER(reference) = UPPER(?) AND (? <> 'WHATSAPP' OR EXISTS (SELECT 1 FROM sessions WHERE sessions.case_id = cases.id AND channel_type = 'WHATSAPP' AND channel_identifier = ?)) LIMIT 1"
    )
    .bind(reference, session.channel_type, session.channel_identifier)
    .first<Record<string, string | number | null>>();
  if (!found) {
    return replyForStep(session, context, {
      step: "STATUS_REFERENCE",
      message: "I could not find that case reference. Check it and try again, or choose I need help.",
      choices: [{ id: "MENU_HELP", label: "I need help" }],
      inputType: "text",
    });
  }
  if (route === "upload") {
    context.selectedRequirementId = undefined;
    await persist({...session,case_id:String(found.id)}, "DOCUMENTS", context);
    return withWhatsAppRequirements({...session,case_id:String(found.id),workflow_step:"DOCUMENTS"}, await replyForStep({...session,case_id:String(found.id),workflow_step:"DOCUMENTS"},context));
  }
  if (route === "status") {
    return replyForStep(session, context, {
      step: "STATUS_REFERENCE",
      message: `${found.reference}\n${(await import("./notifications")).recommendationText(String(found.current_state),context.language || "en")}`,
      choices: [{ id: "MENU_HOME", label: "Return to main menu" }],
      inputType: "none",
      progress: Number(found.progress || 0),
      status: String(found.current_state),
    });
  }
  await addTask({
    caseId: String(found.id),
    type: route === "appeal" ? "APPEAL_INTAKE" : "CHANGE_OF_CIRCUMSTANCES",
    title:
      route === "appeal"
        ? "Validate resident appeal request"
        : "Contact resident about reported change of circumstances",
    queue: route === "appeal" ? "APPEALS" : "CASEWORK",
    priority: "HIGH",
  });
  await audit({
    caseId: String(found.id),
    actorType: "RESIDENT",
    eventCode: route === "appeal" ? "APPEAL_LODGING_STARTED" : "CHANGE_REPORTED",
    entityType: "CASE",
    entityId: String(found.id),
  });
  return replyForStep(session, context, {
    step: "MAIN_MENU",
    message:
      route === "appeal"
        ? `Your appeal request for ${found.reference} has been recorded for validation. The original decision remains unchanged.`
        : `Your change report for ${found.reference} has been linked to the existing case. A municipal official must assess the effect.`,
    choices: [{ id: "MENU_HOME", label: "Return to main menu" }],
    inputType: "none",
  });
}

async function processChatRaw(input: ChatInput): Promise<ChatReply> {
  const channelIdentifier =
    input.channelIdentifier || input.sessionId || `web-${crypto.randomUUID()}`;
  let session = await findSession({
    sessionId: input.sessionId,
    channelType: input.channelType,
    channelIdentifier,
  });
  if (!session) {
    session = await createSession({
      id: input.sessionId || crypto.randomUUID(),
      channelType: input.channelType,
      channelIdentifier,
    });
  }
  if (!session) throw new Error("Unable to create a CivicFlow session");

  const context = parseContext(session);
  const raw = answer(input);
  const value = normalise(raw);
  context.language ||= session.language || "en";

  if (raw) {
    await addMessage({
      sessionId: session.id,
      caseId: session.case_id,
      direction: "INBOUND",
      body: input.text || input.action,
      providerMessageId: input.providerMessageId,
    });
  }

  // Explicit language commands work at any step without resetting the application.
  const namedLanguage = Object.entries({ ENGLISH: "en", AFRIKAANS: "af", ISIZULU: "zu", ISINDEBELE: "nr", SESOTHO: "st" }).find(([name]) => value === name)?.[1];
  const selectedLanguage = LANGUAGE_CODES[value] || namedLanguage;
  if (selectedLanguage) {
    context.language = selectedLanguage;
    const resumeStep = ["LANGUAGE", "LANGUAGE_CHANGE"].includes(session.workflow_step) ? "MAIN_MENU" : session.workflow_step;
    await persist(session, resumeStep, context);
    if (session.case_id) await database().prepare("UPDATE cases SET language = ? WHERE id = ?").bind(selectedLanguage, session.case_id).run();
    return withWhatsAppRequirements({ ...session, workflow_step: resumeStep }, await replyForStep({ ...session, workflow_step: resumeStep }, context, resumeStep === "REVIEW" ? { summary: summary(context) } : undefined));
  }

  if (value === "MENU_LANGUAGE") {
    await persist(session, "LANGUAGE_CHANGE", context);
    return replyForStep({ ...session, workflow_step: "LANGUAGE_CHANGE" }, context);
  }

  if (value === "MENU_HOME") {
    if (!["MAIN_MENU", "LANGUAGE", "LANGUAGE_CHANGE", "STATUS_REFERENCE"].includes(session.workflow_step)) context.resumeStep = session.workflow_step;
    await persist(session, "MAIN_MENU", context);
    return replyForStep({ ...session, workflow_step: "MAIN_MENU" }, context);
  }

  if (!raw) {
    if (session.workflow_step === "MOBILE" && session.channel_type === "WHATSAPP") {
      const code = otpCode();
      context.mobile = session.channel_identifier;
      context.otpHash = await sha256(code);
      await persist(session, "OTP", context);
      return replyForStep({ ...session, workflow_step: "OTP" }, context, {
        message: `Your one-time PIN is ${code}. Enter it to continue.`,
      });
    }
    const current = await replyForStep(session, context);
    if (session.case_id && session.workflow_step === "DOCUMENTS") {
      current.requirements = await getRequirements(session.case_id);
    }
    if (session.workflow_step === "REVIEW") current.summary = summary(context);
    return withWhatsAppRequirements(session, current);
  }

  switch (session.workflow_step) {
    case "LANGUAGE": {
      if (!LANGUAGE_CODES[value]) return replyForStep(session, context);
      context.language = LANGUAGE_CODES[value];

      await persist(session, "MAIN_MENU", context);
      return replyForStep({ ...session, workflow_step: "MAIN_MENU" }, context);
    }
    case "MAIN_MENU": {
      if (value === "MENU_CONTINUE" || (value === "MENU_APPLY" && session.case_id && context.resumeStep)) {
        const resumeStep = context.resumeStep || "SUBMITTED";
        await persist(session, resumeStep, context);
        return withWhatsAppRequirements({ ...session, workflow_step: resumeStep }, await replyForStep({ ...session, workflow_step: resumeStep }, context, resumeStep === "REVIEW" ? { summary: summary(context) } : undefined));
      }
      if (value === "MENU_HELP") {
        return replyForStep(session, context, {
          message:
            "Khula can save an application, collect supporting documents and return information to the same case. It does not grant or refuse benefits. Choose an option to continue.",
          choices: context.resumeStep ? [{ id: "MENU_CONTINUE", label: "Continue my application" }, ...MENU] : MENU,
        });
      }
      if (["MENU_STATUS", "MENU_CHANGE", "MENU_APPEAL", "MENU_UPLOAD"].includes(value)) {
        context.flow =
          value === "MENU_STATUS"
            ? "status"
            : value === "MENU_CHANGE"
              ? "change"
              : value === "MENU_APPEAL"
                ? "appeal"
                : "upload";
        await persist(session, "STATUS_REFERENCE", context);
        return replyForStep({ ...session, workflow_step: "STATUS_REFERENCE" }, context);
      }
      if (value === "MENU_RATES") {
        return replyForStep(session, context, {
          message:
            "Property-rates rebates for pensioners, people with disabilities and people medically retired need a separate workflow. The 2026/27 income formula and effective dates await GMM confirmation. This test service cannot calculate or promise a rebate.",
          choices: [{ id: "MENU_HOME", label: "Return to main menu" }],
        });
      }
      if (value === "MENU_RENEW") {
        context.flow = "status";
        await persist(session, "STATUS_REFERENCE", context);
        return replyForStep({ ...session, workflow_step: "STATUS_REFERENCE" }, context, {
          message:
            "Enter your existing case reference. CivicFlow will distinguish annual verification from full reapplication without creating a duplicate case.",
        });
      }
      if (value !== "MENU_APPLY") return replyForStep(session, context);
      context.flow = "new_application";
      await persist(session, "MOBILE", context);
      const next = { ...session, workflow_step: "MOBILE" };
      if (session.channel_type === "WHATSAPP") {
        const code = otpCode();
        context.mobile = session.channel_identifier;
        context.otpHash = await sha256(code);
        await persist(next, "OTP", context);
        return replyForStep({ ...next, workflow_step: "OTP" }, context, {
          message: `Your one-time PIN is ${code}. Enter it to continue.`,
        });
      }
      return replyForStep(next, context);
    }
    case "STATUS_REFERENCE": {
      if (value === "MENU_HELP") {
        return replyForStep(session, context, {
          message:
            "Your CivicFlow reference begins CF-GMM. A municipal service centre can also help locate a case after identity verification.",
        });
      }
      if (context.flow === "upload") {
        const found = await database()
          .prepare("SELECT id, reference FROM cases WHERE UPPER(reference) = UPPER(?) AND (? <> 'WHATSAPP' OR EXISTS (SELECT 1 FROM sessions WHERE sessions.case_id = cases.id AND channel_type = 'WHATSAPP' AND channel_identifier = ?)) LIMIT 1")
          .bind(raw, session.channel_type, session.channel_identifier)
          .first<{ id: string; reference: string }>();
        if (!found) return handleReferenceRoute(session, context, "status", raw);
        session.case_id = found.id;
        await saveSession(session.id, {
          workflowStep: "DOCUMENTS",
          language: context.language || "en",
          authLevel: session.auth_level,
          caseId: found.id,
          context,
        });
        return replyForStep({ ...session, case_id: found.id, workflow_step: "DOCUMENTS" }, context, {
          requirements: await getRequirements(found.id),
          message: `Upload the item requested for ${found.reference}. Each file will be linked to the existing case.`,
        });
      }
      return handleReferenceRoute(session, context, context.flow || "status", raw);
    }
    case "MOBILE": {
      const mobile = raw.replace(/[^0-9+]/g, "");
      if (mobile.length < 9) {
        return replyForStep(session, context, {
          message: "Enter a valid mobile number with at least nine digits.",
        });
      }
      const code = otpCode();
      context.mobile = mobile;
      context.otpHash = await sha256(code);
      await persist(session, "OTP", context);
      return replyForStep({ ...session, workflow_step: "OTP" }, context, {
        message: `Sandbox PIN: ${code}. In production this will be delivered through the approved provider.`,
        debugOtp: code,
      });
    }
    case "OTP": {
      if (!/^\d{6}$/.test(raw) || (await sha256(raw)) !== context.otpHash) {
        return replyForStep(session, context, {
          message: "That PIN is not correct. Enter the six-digit PIN sent for this session.",
        });
      }
      await persist(session, "ACCOUNT_STATUS", context, 1);
      await audit({
        actorType: "RESIDENT",
        eventCode: "OTP_VERIFIED",
        entityType: "SESSION",
        entityId: session.id,
      });
      return replyForStep({ ...session, workflow_step: "ACCOUNT_STATUS", auth_level: 1 }, context);
    }
    case "ACCOUNT_STATUS": {
      if (!["ACCOUNT_YES", "ACCOUNT_NO", "ACCOUNT_UNSURE"].includes(value)) {
        return replyForStep(session, context);
      }
      context.hasMunicipalAccount =
        value === "ACCOUNT_YES" ? "YES" : value === "ACCOUNT_NO" ? "NO" : "UNSURE";
      await persist(session, "APPLYING_SELF", context);
      return replyForStep({ ...session, workflow_step: "APPLYING_SELF" }, context);
    }
    case "APPLYING_SELF": {
      if (!["SELF_YES", "SELF_NO"].includes(value)) return replyForStep(session, context);
      context.applyingForSelf = value === "SELF_YES";
      await persist(session, "FIRST_NAME", context);
      return replyForStep({ ...session, workflow_step: "FIRST_NAME" }, context);
    }
    case "FIRST_NAME": {
      if (raw.length < 2) return replyForStep(session, context, { message: "Enter the applicant’s first name." });
      context.firstName = raw;
      await persist(session, "SURNAME", context);
      return replyForStep({ ...session, workflow_step: "SURNAME" }, context);
    }
    case "SURNAME": {
      if (raw.length < 2) return replyForStep(session, context, { message: "Enter the applicant’s surname." });
      context.surname = raw;
      const caseId = crypto.randomUUID();
      const personId = crypto.randomUUID();
      const fullName = `${context.firstName} ${context.surname}`;
      await createCase({
        id: caseId,
        reference: displayReference(),
        channel: session.channel_type,
        language: context.language || "en",
        applicantName: fullName,
        mobileMasked: context.mobile ? maskValue(context.mobile, 4) : undefined,
      });
      await addPerson({ id: personId, caseId, role: "APPLICANT", fullName });
      context.people = [{ id: personId, fullName, role: "APPLICANT" }];
      session.case_id = caseId;
      await saveSession(session.id, {
        workflowStep: "IDENTITY_TYPE",
        language: context.language || "en",
        authLevel: 1,
        caseId,
        context,
      });
      await audit({
        caseId,
        actorType: "RESIDENT",
        eventCode: "CASE_CREATED",
        entityType: "CASE",
        entityId: caseId,
      });
      return replyForStep({ ...session, case_id: caseId, workflow_step: "IDENTITY_TYPE" }, context, {
        message: `Your application has been started and saved. Reference: ${await caseReference(caseId)}. Which identity document does ${fullName} use?`,
      });
    }
    case "IDENTITY_TYPE": {
      if (["NO_ID", "ID_HELP"].includes(value)) {
        context.identityType = value;
        await addTask({
          caseId: session.case_id!,
          type: "IDENTITY_ASSISTANCE",
          title: "Assist applicant without a standard identity document",
          queue: "ASSISTED_SERVICE",
          priority: "HIGH",
        });
        return replyForStep(session, context, {
          message:
            "The application is saved. A municipal official must help with the approved alternative identity route before protected account information can be disclosed.",
          choices: [{ id: "ID_CONTINUE", label: "Continue with property information" }],
        });
      }
      if (value === "ID_CONTINUE" && ["NO_ID", "ID_HELP"].includes(context.identityType || "")) {
        const next = context.hasMunicipalAccount === "YES" ? "ACCOUNT_NUMBER" : "LOCATION";
        await persist(session, next, context);
        return replyForStep({ ...session, workflow_step: next }, context);
      }
      if (!['SA_ID','PASSPORT','OTHER_ID'].includes(value)) return replyForStep(session, context);
      context.identityType = value;
      await persist(session, "IDENTITY_NUMBER", context);
      return replyForStep({ ...session, workflow_step: "IDENTITY_NUMBER" }, context);
    }
    case "IDENTITY_NUMBER": {
      if (!raw.trim()) return replyForStep(session, context, { message: "Enter the identity reference shown on your document." });
      context.identityMasked = maskValue(raw, 4);
      if (context.people?.[0]) {
        context.people[0].identityType = context.identityType;
        context.people[0].identityMasked = context.identityMasked;
        await addPerson({
          id: context.people[0].id,
          caseId: session.case_id!,
          role: "APPLICANT",
          fullName: context.people[0].fullName,
          identityType: context.identityType,
          identityMasked: context.identityMasked,
        });
      }
      await audit({
        caseId: session.case_id,
        actorType: "RESIDENT",
        eventCode: "IDENTITY_SUBMITTED",
        entityType: "PERSON",
        entityId: context.people?.[0]?.id,
      });
      const next = context.hasMunicipalAccount === "YES" ? "ACCOUNT_NUMBER" : "LOCATION";
      await persist(session, next, context);
      return replyForStep({ ...session, workflow_step: next }, context);
    }
    case "ACCOUNT_NUMBER": {
      if (raw.length < 4) return replyForStep(session, context, { message: "Enter the municipal account number." });
      context.municipalAccountMasked = maskValue(raw, 4);
      context.propertyLabel = `Account ending ${raw.replace(/\s+/g, "").slice(-4)}`;
      await updateCase(session.case_id!, { propertyLabel: context.propertyLabel });
      await persist(session, "CAPACITY", context);
      return replyForStep({ ...session, workflow_step: "CAPACITY" }, context);
    }
    case "LOCATION": {
      if (raw.length < 5) return replyForStep(session, context, { message: "Add enough information for a municipal official to identify the property." });
      context.propertyLabel = raw;
      await updateCase(session.case_id!, {
        propertyLabel: raw,
        assignedQueue: context.hasMunicipalAccount === "NO" ? "PROPERTY_MATCHING" : "INTAKE",
      });
      await persist(session, "CAPACITY", context);
      return replyForStep({ ...session, workflow_step: "CAPACITY" }, context);
    }
    case "CAPACITY": {
      if (!CAPACITIES.some((choice) => choice.id === value)) return replyForStep(session, context);
      context.capacity = value;
      if (["ESTATE", "HEIR", "GUARDIAN", "DIVORCE", "CAPACITY_HELP"].includes(value)) {
        await addTask({
          caseId: session.case_id!,
          type: `${value}_REVIEW`,
          title: "Review applicant capacity and supporting authority",
          queue: value === "ESTATE" || value === "HEIR" ? "ESTATE_REVIEW" : "CASEWORK",
          priority: "HIGH",
        });
      }
      await persist(session, "RESIDENCE", context);
      return replyForStep({ ...session, workflow_step: "RESIDENCE" }, context);
    }
    case "RESIDENCE": {
      if (!value.startsWith("RES_")) return replyForStep(session, context);
      context.ordinaryResidence = value.replace("RES_", "");
      if (value !== "RES_YES") {
        await addTask({
          caseId: session.case_id!,
          type: "RESIDENCE_REVIEW",
          title: "Review ordinary-residence exception",
          queue: "CASEWORK",
        });
      }
      await persist(session, "PROPERTY_USE", context);
      return replyForStep({ ...session, workflow_step: "PROPERTY_USE" }, context);
    }
    case "PROPERTY_USE": {
      if (!value.startsWith("USE_")) return replyForStep(session, context);
      context.propertyUse = value.replace("USE_", "");
      if (value !== "USE_HOME") {
        await addTask({
          caseId: session.case_id!,
          type: "PROPERTY_USE_REVIEW",
          title: "Review business, rental or non-residential property use",
          queue: "VERIFICATION",
        });
      }
      await persist(session, "ADULT_COUNT", context);
      return replyForStep({ ...session, workflow_step: "ADULT_COUNT" }, context);
    }
    case "ADULT_COUNT": {
      const count = Number.parseInt(raw, 10);
      if (!Number.isInteger(count) || count < 1 || count > 20) {
        return replyForStep(session, context, { message: "Enter a number from 1 to 20, including the applicant." });
      }
      context.adultCount = count;
      if (count === 1) {
        context.incomePersonIndex = 0;
        await persist(session, "INCOME_ANY", context);
        return replyForStep({ ...session, workflow_step: "INCOME_ANY" }, context);
      }
      context.currentAdultIndex = 1;
      await persist(session, "ADULT_NAME", context);
      return replyForStep({ ...session, workflow_step: "ADULT_NAME" }, context);
    }
    case "ADULT_NAME": {
      if (raw.length < 3) return replyForStep(session, context, { message: "Enter this adult’s full legal name." });
      const adult: PersonDraft = {
        id: crypto.randomUUID(),
        fullName: raw,
        role: "HOUSEHOLD_MEMBER",
      };
      context.people = [...(context.people ?? []), adult];
      await addPerson({
        id: adult.id,
        caseId: session.case_id!,
        role: adult.role,
        fullName: adult.fullName,
      });
      await persist(session, "ADULT_ID_TYPE", context);
      return replyForStep({ ...session, workflow_step: "ADULT_ID_TYPE" }, context);
    }
    case "ADULT_ID_TYPE": {
      const adult = currentPerson(context);
      if (!adult) return replyForStep(session, context);
      if (["NO_ID", "ID_HELP"].includes(value)) {
        adult.identityType = value;
        await addTask({
          caseId: session.case_id!,
          type: "MEMBER_IDENTITY_ASSISTANCE",
          title: `Resolve identity evidence for ${adult.fullName}`,
          queue: "ASSISTED_SERVICE",
        });
        const nextIndex = (context.currentAdultIndex ?? 1) + 1;
        if (nextIndex < (context.adultCount ?? 1)) {
          context.currentAdultIndex = nextIndex;
          await persist(session, "ADULT_NAME", context);
          return replyForStep({ ...session, workflow_step: "ADULT_NAME" }, context);
        }
        context.incomePersonIndex = 0;
        await persist(session, "INCOME_ANY", context);
        return replyForStep({ ...session, workflow_step: "INCOME_ANY" }, context);
      }
      if (!['SA_ID','PASSPORT','OTHER_ID'].includes(value)) return replyForStep(session, context);
      adult.identityType = value;
      await persist(session, "ADULT_ID_NUMBER", context);
      return replyForStep({ ...session, workflow_step: "ADULT_ID_NUMBER" }, context);
    }
    case "ADULT_ID_NUMBER": {
      const adult = currentPerson(context);
      if (!adult || raw.length < 5) return replyForStep(session, context, { message: "Enter a valid identity reference." });
      adult.identityMasked = maskValue(raw, 4);
      await addPerson({
        id: adult.id,
        caseId: session.case_id!,
        role: adult.role,
        fullName: adult.fullName,
        identityType: adult.identityType,
        identityMasked: adult.identityMasked,
      });
      const nextIndex = (context.currentAdultIndex ?? 1) + 1;
      if (nextIndex < (context.adultCount ?? 1)) {
        context.currentAdultIndex = nextIndex;
        await persist(session, "ADULT_NAME", context);
        return replyForStep({ ...session, workflow_step: "ADULT_NAME" }, context);
      }
      context.incomePersonIndex = 0;
      await persist(session, "INCOME_ANY", context);
      return replyForStep({ ...session, workflow_step: "INCOME_ANY" }, context);
    }
    case "INCOME_ANY": {
      const person = currentIncomePerson(context);
      if (!person) return replyForStep(session, context);
      if (value === "INCOME_NO") {
        person.hasIncome = false;
        person.incomeComplete = true;
        await setPersonIncomeStatus(person.id, "NO_INCOME_DECLARED");
        return nextIncomePerson(session, context);
      }
      if (value !== "INCOME_YES") return replyForStep(session, context);
      person.hasIncome = true;
      await persist(session, "INCOME_TYPE", context);
      return replyForStep({ ...session, workflow_step: "INCOME_TYPE" }, context);
    }
    case "INCOME_TYPE": {
      if (!INCOME_TYPES.some((choice) => choice.id === value)) return replyForStep(session, context);
      context.pendingIncomeType = value;
      await persist(session, "INCOME_AMOUNT", context);
      return replyForStep({ ...session, workflow_step: "INCOME_AMOUNT" }, context);
    }
    case "INCOME_AMOUNT": {
      const amount = Number(raw.replace(/[^0-9.,-]/g, "").replace(",", "."));
      const person = currentIncomePerson(context);
      if (!person || !Number.isFinite(amount) || amount < 0 || amount > 10000000) {
        return replyForStep(session, context, { message: "Enter a valid gross monthly amount in rand." });
      }
      const item = {
        id: crypto.randomUUID(),
        personId: person.id,
        type: context.pendingIncomeType || "OTHER_REGULAR_INCOME",
        amountCents: Math.round(amount * 100),
      };
      context.incomes = [...(context.incomes ?? []), item];
      await addIncome({
        id: item.id,
        caseId: session.case_id!,
        personId: item.personId,
        type: item.type,
        amountCents: item.amountCents,
      });
      await setPersonIncomeStatus(person.id, "INCOME_DECLARED");
      await persist(session, "INCOME_MORE", context);
      return replyForStep({ ...session, workflow_step: "INCOME_MORE" }, context);
    }
    case "INCOME_MORE": {
      if (value === "MORE_YES") {
        await persist(session, "INCOME_TYPE", context);
        return replyForStep({ ...session, workflow_step: "INCOME_TYPE" }, context);
      }
      if (value !== "MORE_NO") return replyForStep(session, context);
      const person = currentIncomePerson(context);
      if (person) person.incomeComplete = true;
      return nextIncomePerson(session, context);
    }
    case "CONSENT": {
      if (value === "CONSENT_NO") {
        await addTask({
          caseId: session.case_id!,
          type: "CONSENT_REVIEW",
          title: "Explain verification consent and lawful processing route",
          queue: "ASSISTED_SERVICE",
          priority: "HIGH",
        });
        return replyForStep(session, context, {
          message:
            "The application remains saved. Verification cannot proceed until the municipality addresses the consent or lawful verification route with the applicant.",
          choices: [{ id: "CONSENT_YES", label: "I now authorise verification" }],
        });
      }
      if (value !== "CONSENT_YES") return replyForStep(session, context);
      await audit({
        caseId: session.case_id,
        actorType: "RESIDENT",
        eventCode: "FINANCIAL_VERIFICATION_CONSENT_RECORDED",
        entityType: "CONSENT",
        detail: { textVersion: "GMM-CONSENT-WORKING-DRAFT-2026-09", language: context.language || "en", translationVersion: "KHULA-LANG-DRAFT-2026-10-08", accepted: true },
      });
      await updateCase(session.case_id!, {
        state: "DOCUMENTS_OUTSTANDING",
        assignedQueue: "DOCUMENT_INTAKE",
      });
      await persist(session, "DOCUMENTS", context);
      return withWhatsAppRequirements({ ...session, workflow_step: "DOCUMENTS" }, await replyForStep({ ...session, workflow_step: "DOCUMENTS" }, context, {
        requirements: await getRequirements(session.case_id!),
      }));
    }
    case "DOCUMENTS": {
      if (value.startsWith("REQ_")) {
        const requirementId = raw.slice(4);
        const requirements = await getRequirements(session.case_id!);
        const selected = requirements.find(
          (item) => item.id === requirementId && ["OUTSTANDING", "BASIC_REUPLOAD_REQUIRED"].includes(item.status)
        );
        if (!selected) {
          return withWhatsAppRequirements(session, await replyForStep(session, context, {
            message: "That requirement is already satisfied or no longer available. Choose an outstanding item.",
            requirements,
          }));
        }
        context.selectedRequirementId = selected.id;
        await persist(session, "DOCUMENTS", context);
        return replyForStep(session, context, {
          message: `Upload ${selected.label} now. PDF, JPEG and PNG files up to 10 MB are accepted.`,
          choices: undefined,
          requirements,
        });
      }
      if (value !== "DOC_DONE") {
        return withWhatsAppRequirements(session, await replyForStep(session, context, {
          requirements: await getRequirements(session.case_id!),
          choices: [{ id: "DOC_DONE", label: "I have finished uploading" }],
        }));
      }
      const requirements = await getRequirements(session.case_id!);
      const outstanding = requirements.filter((item) => item.mandatory && ["OUTSTANDING", "BASIC_REUPLOAD_REQUIRED"].includes(item.status));
      if (outstanding.length) {
        return replyForStep(session, context, {
          message: `I still need ${outstanding.length} item${outstanding.length === 1 ? "" : "s"}. Upload each outstanding item before continuing.`,
          requirements,
          choices: [{ id: "DOC_DONE", label: "Check again" }],
        });
      }
      const submitted = await database().prepare("SELECT submitted_at FROM cases WHERE id=?").bind(session.case_id).first<{submitted_at:string | null}>();
      if (submitted?.submitted_at) {
        await persist(session,"SUBMITTED",context);
        return replyForStep({...session,workflow_step:"SUBMITTED"},context);
      }
      await updateCase(session.case_id!, { state: "READY_FOR_SUBMISSION" });
      await persist(session, "REVIEW", context);
      return replyForStep({ ...session, workflow_step: "REVIEW" }, context, {
        summary: summary(context),
      });
    }
    case "REVIEW": {
      if (value === "REVIEW_HELP") {
        await addTask({
          caseId: session.case_id!,
          type: "PRE_SUBMISSION_ASSISTANCE",
          title: "Help resident review application before submission",
          queue: "ASSISTED_SERVICE",
        });
        return replyForStep(session, context, {
          message: "The application remains saved. A municipal official can help before it is submitted and frozen.",
          summary: summary(context),
        });
      }
      if (value !== "SUBMIT") return replyForStep(session, context, { summary: summary(context) });
      context.reviewConfirmed = true;
      const snapshotHash = await sha256(JSON.stringify(context));
      await updateCase(session.case_id!, {
        state: "DOCUMENTS_UNDER_REVIEW",
        step: "SUBMITTED",
        progress: 100,
        assignedQueue: "DOCUMENT_BASIC_REVIEW",
        classificationCandidate: "NOT_ASSESSED_BY_CIVICFLOW",
        submitted: true,
      });
      await addTask({
        caseId: session.case_id!,
        type: "DOCUMENT_BASIC_REVIEW",
        title: "Check document completeness and readability; no legal vetting",
        queue: "DOCUMENT_BASIC_REVIEW",
        priority: "HIGH",
      });
      await audit({
        caseId: session.case_id,
        actorType: "RESIDENT",
        eventCode: "APPLICATION_SUBMITTED",
        entityType: "APPLICATION",
        entityId: session.case_id!,
        detail: {
          snapshotHash,
          workflowVersion: "GMM-IND-NEW-2026.09-v1",
          rulesetStatus: "MUNICIPAL_CONFIRMATION_REQUIRED",
        },
      });
      await persist(session, "SUBMITTED", context);
      return replyForStep({ ...session, workflow_step: "SUBMITTED" }, context, {
        progress: 100,
        status: "DOCUMENTS_UNDER_REVIEW",
      });
    }
    case "SUBMITTED": {
      const record = await database().prepare("SELECT current_state FROM cases WHERE id = ?").bind(session.case_id).first<{ current_state: string }>();
      const { recommendationText } = await import("./notifications");
      return replyForStep(session, context, { message: recommendationText(record?.current_state || "DOCUMENTS_UNDER_REVIEW", context.language || "en"), status: record?.current_state || "DOCUMENTS_UNDER_REVIEW", progress: 100 });
    }
    default:
      return replyForStep(session, context);
  }
}

export async function processChat(input: ChatInput): Promise<ChatReply> {
  return localizeReply(await processChatRaw(input));
}
