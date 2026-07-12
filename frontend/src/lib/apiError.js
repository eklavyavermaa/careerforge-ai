/**
 * Extracts the best available human-readable message from an error thrown
 * by the axios client. Backend errors follow { success:false, message } or,
 * for validation failures, { success:false, message, errors: [{ msg }] }.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((e) => e.msg).join(' ');
  }
  if (data?.message) return data.message;
  if (error?.message === 'Network Error') return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
}
