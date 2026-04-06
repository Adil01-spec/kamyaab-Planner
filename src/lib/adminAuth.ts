export const ADMIN_EMAILS = ['kaamyab.app@gmail.com', 'rajaadil4445@gmail.com'];

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
