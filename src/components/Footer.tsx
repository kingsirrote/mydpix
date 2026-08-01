import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Generate", href: "/generate" },
      { label: "Library", href: "/library" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-base-800/80 bg-base-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <p className="font-display text-lg font-bold">
              my<span className="text-signal">dpix</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-ink-500">
              Describe any situation. Get a meme that actually feels like it belongs on your timeline.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-300 hover:text-ink-100">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-base-800 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} MyDpix AI. All rights reserved.</p>
          <p>Made for the internet&apos;s funniest situations.</p>
        </div>
      </div>
    </footer>
  );
}
