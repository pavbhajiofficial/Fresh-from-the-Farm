# Fresh from the Farm — safe integration notes

## Scope of these changes
Product images can now be attached by a public HTTPS URL from the new farmer form, and updated from **My listings → Photo link**. File uploading through **Upload photo** is supported by a server-side signed Cloudinary endpoint, which only works after Cloudinary server credentials have been configured. Existing cart/order/auth handlers were left intact. A one-farmer-per-order UI guard was added to match the current database function.

### Deploy only after testing
- Verify `npm.cmd install` / `npm.cmd ci`, then `npx.cmd tsc --noEmit` and `npm.cmd run build` on your machine.
- Verify `/api/health`, `/api/products`, login, farmer create, image links, checkout, farmer confirmation.
- Do NOT run `db/seed.sql` into an existing database. It contains fixed demo IDs and is NOT a safe live migration.
- Your working local PostgreSQL database contains changes (such as order_status_log) made in pgAdmin and may differ from the SQL text files bundled here. For a hosted database, use a checked `pg_dump` of the actual functioning database; restore to a new empty Neon database and verify routines, tables and sequences.
- The .env.example values are placeholders. Keep credentials exclusively in local `.env.local` and Vercel Environment Variables.
- Vercel requires hosted Postgres: localhost cannot be reached from the deployed app. `lib/db.ts` supports `DATABASE_URL` and the existing local PG* variables.
- Generate a new strong SESSION_SECRET for the public deployment; never expose it in a screenshot.
- Before going publicly live, complete rate limiting, CSRF protections for state-changing endpoints, input protections, authorization review and privacy review (real user/order data). This is an MVP, not production-hardened.

## Safest GitHub push (from Windows PowerShell; do not overwrite teammates' main)
1. Confirm that the repository `pavbhajiofficial/Fresh-from-the-Farm` is the correct destination and ask collaborators to review the integration.
2. In a different directory, run `git clone https://github.com/pavbhajiofficial/Fresh-from-the-Farm.git`, then `cd Fresh-from-the-Farm`.
3. Run `git switch -c feature/backend-images-integration`.
4. Copy the updated project files from the supplied ZIP **into that new clone**. Do not copy `.git` from anywhere and do not copy `.env.local`.
5. Run `git status --short` and review the changes. Run `npm.cmd ci`, `npx.cmd tsc --noEmit`, `npm.cmd run build`.
6. Run `git add app components lib db package.json package-lock.json .gitignore .env.example GITHUB_AND_DEPLOY.md` (and include other changed source files only after review).
7. Run `git status --short` AGAIN; confirm there are no passwords, node_modules, `.next`, or real .env files staged.
8. Run `git commit -m "Integrate authenticated backend and product image support"`.
9. Run `git push -u origin feature/backend-images-integration`.
10. Open a GitHub pull request to `main` and review before merging; don't force-push and don't push directly to main.

## Image URL path (works without Cloudinary)
Go to Farmer → My Listings → Photo link, paste a public HTTPS direct-image URL (`https://...jpg/png/webp`), and save. The site will display the photo via the existing Photo component. For new listings, paste the link in the Photo HTTPS link field.

## File uploads (requires separate Cloudinary account)
Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to `.env.local` and to Vercel server environment variables. They must never use NEXT_PUBLIC prefixes or be committed. The upload endpoint checks the current farmer session, validates JPG/PNG/WEBP file signatures, caps image size to 2MB and performs a signed Cloudinary upload server-side. Avoid uploading copyrighted images without permission. Uploads remain hosted in Cloudinary when the application is deployed.
