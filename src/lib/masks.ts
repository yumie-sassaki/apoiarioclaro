export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function isValidPhoneBR(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) return false;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (/^(\d)\1+$/.test(digits) || /^(\d)\1+$/.test(digits.slice(2))) return false;
  if (digits.length === 11 && digits[2] !== '9') return false;
  return true;
}

export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 14 && !/^(\d)\1+$/.test(digits);
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export function isMeaningfulText(value: string, minChars: number, minWords = 1): boolean {
  const trimmed = value.trim();
  if (trimmed.length < minChars) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < minWords) return false;
  const letters = (trimmed.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  if (letters < 3) return false;
  if (/(.)\1{4,}/.test(trimmed)) return false;
  return true;
}

export function parsePublicContactInfo(text?: string) {
  let whatsapp = '';
  let instagram = '';
  let email = '';
  let website = '';

  if (text && text.trim()) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.startsWith('whatsapp:') ||
        lower.startsWith('whatsapp institucional:') ||
        lower.startsWith('whats:') ||
        lower.startsWith('zap:') ||
        lower.startsWith('telefone:') ||
        lower.startsWith('tel:')
      ) {
        whatsapp = line.replace(/^[^:]+:\s*/i, '').trim();
      } else if (lower.startsWith('instagram:') || lower.startsWith('insta:')) {
        instagram = line.replace(/^[^:]+:\s*/i, '').trim();
      } else if (lower.startsWith('e-mail:') || lower.startsWith('email:')) {
        email = line.replace(/^[^:]+:\s*/i, '').trim();
      } else if (lower.startsWith('site:') || lower.startsWith('website:') || lower.startsWith('web:')) {
        website = line.replace(/^[^:]+:\s*/i, '').trim();
      } else if (line.startsWith('@') || lower.includes('instagram.com')) {
        if (!instagram) instagram = line;
      } else if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('www.')) {
        if (!website) website = line;
      } else if (line.includes('@') && !line.startsWith('@')) {
        if (!email) email = line;
      } else if (/^[\d\s()+-]+$/.test(line)) {
        if (!whatsapp) whatsapp = line;
      }
    }
  }

  return { whatsapp, instagram, email, website };
}

export function parseOrganizationContacts(
  org?: {
    publicContactInfo?: string;
  } | null
) {
  const parsed = parsePublicContactInfo(org?.publicContactInfo);

  const whatsapp =
    parsed.whatsapp && isValidPhoneBR(parsed.whatsapp)
      ? formatPhoneBR(parsed.whatsapp)
      : '';

  const phone = '';

  const email =
    parsed.email && isValidEmail(parsed.email)
      ? parsed.email.trim()
      : '';

  const instagram = parsed.instagram.trim();
  const instagramUrl = instagram
    ? instagram.startsWith('http')
      ? instagram
      : `https://instagram.com/${instagram.replace(/^@/, '')}`
    : '';

  const website = parsed.website.trim();
  const websiteUrl = website
    ? /^https?:\/\//i.test(website)
      ? website
      : `https://${website}`
    : '';

  return {
    whatsapp,
    phone,
    email,
    instagram,
    instagramUrl,
    website,
    websiteUrl
  };
}

export function buildWhatsAppUrl(phoneStr: string, message?: string): string {
  const digits = onlyDigits(phoneStr);
  if (!digits) return '';
  const fullDigits = digits.length <= 11 && !digits.startsWith('55') ? `55${digits}` : digits;
  return message
    ? `https://wa.me/${fullDigits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${fullDigits}`;
}
