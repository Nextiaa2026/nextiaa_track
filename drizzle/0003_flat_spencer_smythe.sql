CREATE TABLE IF NOT EXISTS "vessels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"imo" varchar(100) NOT NULL,
	"last_known_lat" double precision,
	"last_known_lon" double precision,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vessels_imo_unique" UNIQUE("imo")
);
--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "vessel_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipments" ADD CONSTRAINT "shipments_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
