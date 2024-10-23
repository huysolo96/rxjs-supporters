/**
 * Checks if a value is not null or undefined.
 *
 * @param {T | null | undefined} value - The value to check.
 * @return {value is T} - Returns true if the value is not null or undefined, otherwise false.
 */
export const notNil = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

/**
 * Checks if a value is not an error.
 *
 * @param {T | Error} value - The value to check.
 * @return {value is T} - Returns true if the value is not an error, otherwise false.
 */
export const notErr = <T>(value: T | Error): value is T =>
  notNil(value) && !(value instanceof Error);

/**
 * Checks if an object is not null or undefined and all its values are not null or undefined.
 *
 * @param {Partial<T> | null | undefined} v - The object to check.
 * @return {v is Required<T>} - Returns true if the object is not null or undefined and all its values are not null or undefined, otherwise false.
 */
export const notNilObject = <T extends Record<string, unknown>>(
  v: Partial<T> | null | undefined
): v is Required<T> => notNil(v) && Object.values(v).every((v) => notNil(v));
