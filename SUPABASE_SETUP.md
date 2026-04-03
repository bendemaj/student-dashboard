# Supabase Setup

1. Create a Supabase project.

2. In Supabase, open the SQL editor and run the migration in `supabase/migrations/20260403_create_courses.sql`.

3. In Supabase, enable email auth.
   The app uses passwordless email sign-in via magic links.

4. In Supabase, add your local and deployed URLs to the auth redirect allow list.
   Typical values:
   - `http://localhost:3000`
   - your production URL

5. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

6. Start the app with `npm run dev`.

7. Open the app, enter your email, and use the magic link on both devices.
   Both devices will load the same `courses` rows for your Supabase user.

## Notes

- Existing browser-local course data is migrated to Supabase automatically the first time you sign in and your remote table is empty.
- `currentSemester` remains a browser preference, so it is still stored locally per device.
- Course add, edit, delete, clear, and spreadsheet import now write to Supabase when cloud sync is configured.
