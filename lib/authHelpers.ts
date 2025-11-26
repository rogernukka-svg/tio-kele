// Normaliza el teléfono y genera el pseudo-email interno
export function normalizePhone(p: string) {
  let s = (p || '').trim();
  s = s.replace(/\s+/g, '').replace(/[()\-\.]/g, '');
  if (!s.startsWith('+')) {
    // Por defecto PARAGUAY (+595). Ajustá si querés otro país.
    if (s.length >= 8 && s.length <= 12) s = '+595' + s;
    else s = '+' + s;
  }
  return s;
}

export function phoneToPseudoEmail(phoneNormalized: string) {
  // +595981234567 -> plus595981234567@raspay.local
  return `${phoneNormalized}@raspay.local`.replace(/\+/g, 'plus');
}
