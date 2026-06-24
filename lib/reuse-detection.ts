export function getPasswordReuseCount(
  password: string,
  existingPasswords: string[]
): number {
  if (!password.trim()) return 0;
  return existingPasswords.filter((item) => item === password).length;
}

export function isPasswordReused(
  password: string,
  existingPasswords: string[]
): boolean {
  return getPasswordReuseCount(password, existingPasswords) > 0;
}

export function getReusedPasswordGroups(passwords: string[]) {
  const map = new Map<string, number>();

  for (const password of passwords) {
    if (!password.trim()) continue;
    map.set(password, (map.get(password) || 0) + 1);
  }

  return Array.from(map.entries()).filter(([, count]) => count > 1);
}
