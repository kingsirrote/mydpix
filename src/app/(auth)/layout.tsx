import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-950 px-4">
      <Link href="/" className="mb-8 font-display text-2xl font-bold">
        my<span className="text-signal">dpix</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
