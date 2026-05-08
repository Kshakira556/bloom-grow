-- NOTE: CUB Internal hard delete is implemented as an API endpoint:
--   POST /api/cub/users/:id/hard-delete { confirm_password }
--
-- It performs a transaction and deletes all associated rows derived from the current codebase.
-- If any foreign-key constraints still reference the user, the transaction fails (to avoid orphaned rows).
--
-- This file exists only as documentation. No SQL needs to be run for the hard-delete feature.

