export const PROFILE_AVATARS = ['🚴', '🧭', '🦊', '🐻', '🦉', '🐈', '🐺', '🦋'];

export function normalizeProfile(value) {
  if (!value || typeof value !== 'object') return null;
  const nickname = typeof value.nickname === 'string' ? value.nickname.trim().slice(0, 20) : '';
  const avatar = PROFILE_AVATARS.includes(value.avatar) ? value.avatar : PROFILE_AVATARS[0];
  if (!nickname) return null;
  return { nickname, avatar };
}
