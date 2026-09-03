export function AuthError({ message }: Readonly<{ message: string | null }>) {
  if (message === null) return null;
  return <div aria-live="polite" className="rounded-md border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">{message}</div>;
}
