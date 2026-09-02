export interface OpaqueTokenGenerator { generate(): string; }
export interface OpaqueTokenHasher { hash(token: string): string; }
