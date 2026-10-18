-- One-shot install. From the repository root:
--   createdb fresh_farm
--   psql -d fresh_farm -f db/install.sql
--
-- \ir paths are relative to this file, not to the shell's current directory.

\ir schema.sql
\ir triggers.sql
\ir functions.sql
\ir views.sql
\ir seed.sql
\ir queries.sql
