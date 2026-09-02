export type PasswordHash = Readonly<{ algorithm: string; salt: string; hash: string }>;
export interface PasswordHasher { create(password: string): Promise<PasswordHash>; verify(password: string, stored: PasswordHash): Promise<boolean>; }
