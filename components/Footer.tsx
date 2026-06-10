import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <img src="/logo-white.png" alt="Life Admin" className="h-8 w-8 object-contain" />
              <span className="font-semibold">Life Admin</span>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              Stop bleeding money on subscriptions you forgot.
            </p>
            <a
              href="https://apps.apple.com/app/id6762589970"
              className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left leading-none">
                <div className="text-[9px] text-gray-400">Download on the</div>
                <div className="text-sm font-semibold text-white">App Store</div>
              </div>
            </a>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/features">Features</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <a href="https://apps.apple.com/app/id6762589970">iOS App</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/home" className="hover:text-white transition">Finance Guides</Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">Blog</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">About</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">Contact</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">Terms</Link>
              </li>
              <li>
                <Link href="/transparency" className="hover:text-white transition">How We Make Money</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Life Admin. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
