import type { ReactNode } from "react";

export const OWNER_EMAIL = "hello@minkhantkyaw.com";

export const fmt = (v: number | string | Date) => new Date(v).toLocaleString();

export function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
