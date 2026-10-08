CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text,
	`actor_type` text NOT NULL,
	`actor_id` text,
	`event_code` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`detail_json` text DEFAULT '{}' NOT NULL,
	`correlation_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`municipality_code` text DEFAULT 'GMM' NOT NULL,
	`case_type` text DEFAULT 'INDIGENT_NEW_APPLICATION' NOT NULL,
	`channel` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`current_state` text DEFAULT 'DRAFT' NOT NULL,
	`workflow_step` text DEFAULT 'LANGUAGE' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`applicant_name` text,
	`mobile_masked` text,
	`property_label` text,
	`classification_candidate` text,
	`assigned_queue` text DEFAULT 'INTAKE' NOT NULL,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`source_version` text DEFAULT 'GMM-WORKING-DRAFT-2026-09' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`submitted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cases_reference` ON `cases` (`reference`);--> statement-breakpoint
CREATE TABLE `document_requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`person_id` text,
	`requirement_code` text NOT NULL,
	`label` text NOT NULL,
	`mandatory` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'OUTSTANDING' NOT NULL,
	`acceptable_types_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`requirement_id` text,
	`person_id` text,
	`object_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`content_hash` text NOT NULL,
	`status` text DEFAULT 'UPLOADED_PENDING_REVIEW' NOT NULL,
	`source_channel` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `income_items` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`person_id` text NOT NULL,
	`income_type` text NOT NULL,
	`description` text,
	`gross_amount_cents` integer NOT NULL,
	`frequency` text DEFAULT 'MONTHLY' NOT NULL,
	`verification_status` text DEFAULT 'DECLARED_ONLY' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`case_id` text,
	`direction` text NOT NULL,
	`body` text,
	`provider_message_id` text,
	`message_type` text DEFAULT 'text' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_messages_provider` ON `messages` (`provider_message_id`);--> statement-breakpoint
CREATE TABLE `persons` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`role` text NOT NULL,
	`full_name` text NOT NULL,
	`identity_type` text,
	`identity_masked` text,
	`adult_for_policy` integer DEFAULT true NOT NULL,
	`income_status` text DEFAULT 'OUTSTANDING' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_type` text NOT NULL,
	`channel_identifier` text NOT NULL,
	`case_id` text,
	`workflow_step` text DEFAULT 'LANGUAGE' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`auth_level` integer DEFAULT 0 NOT NULL,
	`context_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_channel` ON `sessions` (`channel_type`,`channel_identifier`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`task_type` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`owner_queue` text NOT NULL,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`due_at` text,
	`created_at` text NOT NULL,
	`completed_at` text
);
