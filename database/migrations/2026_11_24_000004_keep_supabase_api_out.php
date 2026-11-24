<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// On Supabase, every table in the public schema can be read and written through Supabase's web API with the project's
// public (publishable/anon) key, which anyone can find. AniBayan only reaches its data through Laravel (as the
// database owner), so this takes that API's roles off every table: no grants, row level security on with no rules,
// and the same for tables made later. Laravel's own connection isn't affected (owners skip row level security).
// It does nothing on databases without Supabase's roles (MySQL, plain Postgres).
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! DB::selectOne("select 1 as ok from pg_roles where rolname = 'anon'")) {
            return;
        }
        foreach (DB::select("select tablename from pg_tables where schemaname = 'public'") as $table) {
            DB::statement('alter table public."'.$table->tablename.'" enable row level security');
        }
        DB::statement('revoke all on all tables in schema public from anon, authenticated');
        DB::statement('revoke all on all sequences in schema public from anon, authenticated');
        DB::statement('revoke all on all functions in schema public from anon, authenticated');
        DB::statement('alter default privileges in schema public revoke all on tables from anon, authenticated');
        DB::statement('alter default privileges in schema public revoke all on sequences from anon, authenticated');
        DB::statement('alter default privileges in schema public revoke all on functions from anon, authenticated');
    }

    public function down(): void
    {
        // Left locked on purpose.
    }
};
