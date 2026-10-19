# Product photos only — original UI unchanged

This update adds 8 images to `public/produce/`. It does not modify React, CSS,
frontend layout, auth, checkout, orders, or existing backend routes.

## Apply to the original working localhost project

1. Extract this ZIP into the project root (the folder containing package.json).
2. In VS Code PowerShell, while in that original folder, run:
   `node .\scripts\assign-product-images.cjs`
3. Open http://localhost:3000/marketplace and refresh. If the server is stopped,
   run `npm.cmd run dev` from the original project folder.

The script uses your existing `.env.local` and applies `db/assign-product-images.sql`
only to known product names. It preserves any previously uploaded image URL,
and does not modify stock, orders, users, or names.

## Apply to GitHub review branch

Extract the *same* ZIP into the `fresh-farm-github-review` folder, then run
from that folder:

```
git status --short
git add public/produce db/assign-product-images.sql scripts/assign-product-images.cjs
 git commit -m "Add produce photography without changing site layout"
git push origin feature/backend-images-integration
```

Review PR #1. Do not merge until teammates review it.

## Database migration to Neon

When you migrate the working database using a PostgreSQL backup, the image_url
values come with the existing rows. The `public/produce` images deploy with the
website on Vercel. If you seed a NEW database instead, run
`db/assign-product-images.sql` there once afterward.

## About images

Seven portraits have matching cream studio-photo backgrounds. The beans image
is a lower-resolution crop from a generated concept; replace later with a
higher-resolution original product photo if desired. No fake farmer photos are
presented as photographs from an actual farm.
