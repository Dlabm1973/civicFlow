CREATE TABLE `whatsapp_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`session_id` text,
	`case_state` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`provider_message_id` text,
	`error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_case` ON `whatsapp_notifications` (`case_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_notifications_provider` ON `whatsapp_notifications` (`provider_message_id`);