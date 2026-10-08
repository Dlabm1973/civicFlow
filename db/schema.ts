import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const cases = sqliteTable(
  "cases",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull(),
    municipalityCode: text("municipality_code").notNull().default("GMM"),
    caseType: text("case_type").notNull().default("INDIGENT_NEW_APPLICATION"),
    channel: text("channel").notNull(),
    language: text("language").notNull().default("en"),
    currentState: text("current_state").notNull().default("DRAFT"),
    workflowStep: text("workflow_step").notNull().default("LANGUAGE"),
    progress: integer("progress").notNull().default(0),
    applicantName: text("applicant_name"),
    mobileMasked: text("mobile_masked"),
    propertyLabel: text("property_label"),
    classificationCandidate: text("classification_candidate"),
    assignedQueue: text("assigned_queue").notNull().default("INTAKE"),
    priority: text("priority").notNull().default("NORMAL"),
    sourceVersion: text("source_version").notNull().default("GMM-WORKING-DRAFT-2026-09"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    submittedAt: text("submitted_at"),
  },
  (table) => [
    uniqueIndex("idx_cases_reference").on(table.reference),
    index("idx_cases_state_updated").on(table.currentState, table.updatedAt),
  ]
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    channelType: text("channel_type").notNull(),
    channelIdentifier: text("channel_identifier").notNull(),
    caseId: text("case_id"),
    workflowStep: text("workflow_step").notNull().default("LANGUAGE"),
    language: text("language").notNull().default("en"),
    authLevel: integer("auth_level").notNull().default(0),
    contextJson: text("context_json").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_sessions_channel").on(
      table.channelType,
      table.channelIdentifier
    ),
  ]
);

export const persons = sqliteTable(
  "persons",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    role: text("role").notNull(),
    fullName: text("full_name").notNull(),
    identityType: text("identity_type"),
    identityMasked: text("identity_masked"),
    adultForPolicy: integer("adult_for_policy", { mode: "boolean" })
      .notNull()
      .default(true),
    incomeStatus: text("income_status").notNull().default("OUTSTANDING"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_persons_case").on(table.caseId)]
);

export const incomeItems = sqliteTable("income_items", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  personId: text("person_id").notNull(),
  incomeType: text("income_type").notNull(),
  description: text("description"),
  grossAmountCents: integer("gross_amount_cents").notNull(),
  frequency: text("frequency").notNull().default("MONTHLY"),
  verificationStatus: text("verification_status")
    .notNull()
    .default("DECLARED_ONLY"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_income_case_person").on(table.caseId, table.personId)]);

export const documentRequirements = sqliteTable("document_requirements", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  personId: text("person_id"),
  requirementCode: text("requirement_code").notNull(),
  label: text("label").notNull(),
  mandatory: integer("mandatory", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("OUTSTANDING"),
  acceptableTypesJson: text("acceptable_types_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_requirements_case_status").on(table.caseId, table.status)]);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  requirementId: text("requirement_id"),
  personId: text("person_id"),
  objectKey: text("object_key").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  contentHash: text("content_hash").notNull(),
  status: text("status").notNull().default("UPLOADED_PENDING_REVIEW"),
  sourceChannel: text("source_channel").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_documents_case").on(table.caseId),
  index("idx_documents_requirement").on(table.requirementId),
]);

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  taskType: text("task_type").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("OPEN"),
  ownerQueue: text("owner_queue").notNull(),
  priority: text("priority").notNull().default("NORMAL"),
  dueAt: text("due_at"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
}, (table) => [index("idx_tasks_case_status").on(table.caseId, table.status)]);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    caseId: text("case_id"),
    direction: text("direction").notNull(),
    body: text("body"),
    providerMessageId: text("provider_message_id"),
    messageType: text("message_type").notNull().default("text"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("idx_messages_provider").on(table.providerMessageId)]
);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  caseId: text("case_id"),
  actorType: text("actor_type").notNull(),
  actorId: text("actor_id"),
  eventCode: text("event_code").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  detailJson: text("detail_json").notNull().default("{}"),
  correlationId: text("correlation_id").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_audit_case_created").on(table.caseId, table.createdAt)]);

export const whatsappNotifications = sqliteTable("whatsapp_notifications", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  sessionId: text("session_id"),
  caseState: text("case_state").notNull(),
  status: text("status").notNull().default("PENDING"),
  providerMessageId: text("provider_message_id"),
  error: text("error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, table => [index("idx_notifications_case").on(table.caseId, table.createdAt), uniqueIndex("idx_notifications_provider").on(table.providerMessageId)]);
