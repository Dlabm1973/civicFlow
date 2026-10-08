CREATE TABLE `document_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`case_id` text NOT NULL,
	`status` text NOT NULL,
	`checklist_json` text NOT NULL,
	`reason` text,
	`reviewer` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vetting_handoffs` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`target` text NOT NULL,
	`status` text NOT NULL,
	`packet_json` text NOT NULL,
	`external_reference` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vetting_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`handoff_id` text NOT NULL,
	`outcome` text NOT NULL,
	`reason` text,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
