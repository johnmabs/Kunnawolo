export type ApiSecretHash = Readonly<{ salt: string; hash: string }>;

export interface ApiSecretHasher {
  create(secret: string): Promise<ApiSecretHash>;
  verify(secret: string, stored: ApiSecretHash): Promise<boolean>;
}
