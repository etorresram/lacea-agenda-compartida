CREATE TABLE rooms (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT NOT NULL, invite_hash TEXT NOT NULL, created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE members (room_id TEXT NOT NULL REFERENCES rooms(id), user_id TEXT NOT NULL, display_name TEXT NOT NULL, choices TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL, PRIMARY KEY(room_id,user_id));
