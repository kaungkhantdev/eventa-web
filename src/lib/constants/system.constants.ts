/** The system module's named constants. */

/**
 * Whether the browser failed to fetch a code chunk.
 *
 * Matched on the message because there is no error type for it — each engine
 * words it differently, and all three are a `TypeError`.
 */
export const MODULE_LOAD_FAILURE = /dynamically imported module|importing a module script failed/i
