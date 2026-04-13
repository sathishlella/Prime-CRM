# Prime CRM — Backup & Restore Runbook

## Overview

| Method | Frequency | RPO | Who |
|---|---|---|---|
| Supabase PITR (Point-in-Time Recovery) | Continuous | ~1 min | Supabase Free/Pro |
| `pg_dump` weekly snapshot | Weekly Sun 02:00 UTC | 1 week | GitHub Actions cron |
| Storage bucket export | Weekly | 1 week | Manual / GitHub Actions |

---

## Supabase PITR (primary method)

### Enable PITR

1. Supabase Dashboard → Project → Settings → Backups.
2. Enable "Point in Time Recovery" (requires Pro plan).
3. Set retention to 7 days.

### Restore from PITR

```
Supabase Dashboard → Settings → Backups → Point in Time Recovery
→ Select timestamp → Restore
```

Restoration takes 10–30 minutes. The project URL remains the same.

**Important:** PITR restores the entire database. Partial table restores require `pg_dump`.

---

## Weekly pg_dump snapshot

### Manual snapshot

```bash
pg_dump \
  "postgresql://postgres.<project-ref>:<password>@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  --format=custom \
  --no-acl \
  --no-owner \
  --file="prime-crm-$(date +%Y%m%d).dump"
```

Connection string: Supabase Dashboard → Project → Settings → Database → Connection string (URI).

### Restore from pg_dump

```bash
# Restore to a fresh Supabase project
pg_restore \
  --dbname="postgresql://postgres.<new-project-ref>:<password>@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  --no-acl \
  --no-owner \
  prime-crm-20260101.dump
```

### Restore a single table (partial restore)

```bash
pg_restore \
  --dbname="<connection-string>" \
  --table=applications \
  --no-acl \
  --no-owner \
  prime-crm-20260101.dump
```

---

## Storage bucket backup

The `generated-cvs` and `documents` buckets hold PDF files. Back them up with the Supabase CLI:

```bash
# List all objects
supabase storage ls ss:///generated-cvs --project-ref <ref> --token <service-role-key>

# Download all (requires supabase CLI >= 1.150)
supabase storage cp ss:///generated-cvs ./backup/generated-cvs \
  --recursive \
  --project-ref <ref> \
  --token <service-role-key>
```

---

## GitHub Actions automated backup (optional)

Add this workflow to `.github/workflows/backup.yml`:

```yaml
name: Weekly DB backup
on:
  schedule:
    - cron: "0 2 * * 0"  # Sunday 02:00 UTC

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Install pg_dump
        run: sudo apt-get install -y postgresql-client

      - name: Dump
        env:
          DB_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pg_dump "$DB_URL" \
            --format=custom --no-acl --no-owner \
            --file=prime-crm-$(date +%Y%m%d).dump

      - name: Upload artifact (90-day retention)
        uses: actions/upload-artifact@v4
        with:
          name: db-backup-${{ github.run_id }}
          path: "*.dump"
          retention-days: 90
```

---

## Restore drill checklist (run quarterly)

- [ ] Identify most recent pg_dump file.
- [ ] Create a temporary Supabase project.
- [ ] Run `pg_restore` against the temp project.
- [ ] Run `npm run type-check && npm run build` with `NEXT_PUBLIC_SUPABASE_URL` pointing at temp project.
- [ ] Log in as admin, counselor, student — verify data loads.
- [ ] Record timestamp and outcome in this doc.

| Date | Performed by | Outcome | Recovery time |
|---|---|---|---|
| _(fill in after each drill)_ | | | |

---

## RLS smoke test after restore

```sql
-- Confirm RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = FALSE;
-- Expected: zero rows
```
