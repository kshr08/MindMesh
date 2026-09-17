/**
 * TEMPORARY placeholder until Stage 8 (Authentication).
 *
 * There is no auth yet, so there is no real "current user" to resolve from
 * a session. This constant exists only so the service/repository layers can
 * already be written against a real userId, and so this single line is the
 * only thing that needs to change when Stage 8 introduces real sessions.
 *
 * This id does not need to exist in the database yet — querying against a
 * non-existent user simply (and correctly) returns an empty graph.
 */
export const CURRENT_USER_ID = "dev-user-placeholder";
