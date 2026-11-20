# DB schema

`db-schema.mwb` is a MySQL Workbench 8.0 model of the `inventory` schema with one EER diagram.

It was reverse-engineered from the database created by `prisma migrate deploy`; the `_prisma_migrations` table is left out. After a schema change, regenerate it:

1. Apply migrations to a local MySQL: `npm run db:deploy`.
2. In MySQL Workbench: Database → Reverse Engineer → schema `inventory` → place objects on a diagram.
3. Save the model over `docs/db-schema.mwb`.
