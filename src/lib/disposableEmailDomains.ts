/**
 * Curated list of common disposable email domains.
 * Intentionally small to avoid false positives.
 */
export const DISPOSABLE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  // Major temporary email providers
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamail.org',
  'guerrillamail.net',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'mailinator.com',
  'mailinater.com',
  'mailinator2.com',
  'maildrop.cc',
  'getairmail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'throwaway.email',
  'throwawaymail.com',
  'dispostable.com',
  'mailnesia.com',
  'tempr.email',
  'temp-mail.io',
  'tempail.com',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'emailondeck.com',
  'mintemail.com',
  'mohmal.com',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'trash-mail.com',
  'trash-mail.at',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10minmail.com',
  '20minutemail.com',
  '20minutemail.it',
  'mailcatch.com',
  'spamgourmet.com',
  'spambox.us',
  'spamfree24.org',
  'spam4.me',
  'jetable.org',
  'emailfake.com',
  'getnada.com',
  'nada.email',
  'tempinbox.com',
  'burnermail.io',
  'burner.kiwi',
  'discard.email',
  'discardmail.com',
  'mailsac.com',
  'inboxkitten.com',
  'crazymailing.com',
  'tmail.com',
  'mail-temp.com',
  'mailtemp.net',
  'imgv.de',
  'mailforspam.com',
  'spamherelots.com',
  'mytrashmail.com',
  'mailnesia.com',
  'tempmailaddress.com',
  'tempemailgen.com',
  'fakemailopen.com',
  'tempsky.com',
  'mail-temporaire.fr',
  'haribu.net',
  'emailtemporario.com.br',
  'anonymmail.net',
  'emailsensei.com',
  'anonymbox.com',
  'hidzz.com',
  'dropmail.me',
  'byom.de',
  'cuvox.de',
  'fleckens.hu',
  'armyspy.com',
  'dayrep.com',
  'einrot.com',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
]);

/**
 * Check if an email domain is a known disposable email provider.
 * Returns 'disposable' | 'standard' | 'enterprise'
 */
export function classifyEmailDomain(email: string): 'disposable' | 'standard' | 'enterprise' {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) return 'standard';
  
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return 'disposable';
  }
  
  // Simple heuristic for enterprise domains (custom domains)
  // Enterprise domains typically don't use free email providers
  const freeEmailProviders = new Set([
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'hotmail.com',
    'hotmail.co.uk',
    'outlook.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'protonmail.com',
    'proton.me',
    'zoho.com',
    'mail.com',
    'gmx.com',
    'gmx.net',
    'yandex.com',
    'yandex.ru',
  ]);
  
  if (!freeEmailProviders.has(domain)) {
    return 'enterprise';
  }
  
  return 'standard';
}

/**
 * Server-side function for edge functions to use
 */
export function getEmailDomainType(email: string): 'disposable' | 'standard' | 'enterprise' {
  return classifyEmailDomain(email);
}
