# DBMS module — Fresh from the Farm

This folder is the database teammate's work. The Next.js screens stay on the frontend teammate. They currently read and write browser storage in `lib/api.ts`. That was intentional: the latest frontend commit removed the API routes so the UI can be graded without a running database.

Do not put pages, CSS, or API routes back into `app/` as part of this module. When the two halves are joined later, `lib/api.ts` should call the view and the two functions below. The shapes already match `lib/types.ts`.

## What you are committing to

| You own | You do not own |
| --- | --- |
| Everything in `db/` | `app/`, `components/`, `app/globals.css` |
| Tables, keys, checks, indexes | Layout, cart UI, farmer screens |
| Views, triggers, `place_order`, `set_order_status` | Rewiring `lib/api.ts` unless the frontend teammate asks |
| Seed data, demo queries, roles | `package.json` and the Next.js toolchain |

## Files

| File | What it is |
| --- | --- |
| `schema.sql` | Tables, enums, primary keys, foreign keys, checks, indexes |
| `triggers.sql` | Rules SQL constraints cannot express |
| `functions.sql` | `place_order` (the stock transaction) and `set_order_status` |
| `views.sql` | Joins the screens need, plus `search_catalog` |
| `seed.sql` | The same farmers, listings and orders the UI already shows |
| `queries.sql` | Viva queries. Mutations are rolled back or caught |
| `roles.sql` | Optional buyer/farmer privileges. Not required to boot the schema |
| `reset.sql` | Drops this module so you can reinstall |
| `install.sql` | Runs the files above, except `roles.sql`, in order |

## Run it

PostgreSQL 14 or newer.

```bash
createdb fresh_farm
psql -d fresh_farm -f db/install.sql
