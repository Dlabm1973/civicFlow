CREATE INDEX `idx_audit_case_created` ON `audit_events` (`case_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_cases_state_updated` ON `cases` (`current_state`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_requirements_case_status` ON `document_requirements` (`case_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_documents_case` ON `documents` (`case_id`);--> statement-breakpoint
CREATE INDEX `idx_documents_requirement` ON `documents` (`requirement_id`);--> statement-breakpoint
CREATE INDEX `idx_income_case_person` ON `income_items` (`case_id`,`person_id`);--> statement-breakpoint
CREATE INDEX `idx_persons_case` ON `persons` (`case_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_case_status` ON `tasks` (`case_id`,`status`);--> statement-breakpoint
PRAGMA optimize;
