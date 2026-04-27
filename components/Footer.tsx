import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient font-bold">
                $
              </div>
              <span className="font-semibold">Life Admin</span>
            </div>
            <p className="text-sm text-gray-500">
              Stop bleeding money on subscriptions you forgot.
            </p>
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
            <h4 className="mb-3 text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="https://zackwinter14.github.io/lifeadmin-privacy/privacy-policy.html">
                  Privacy
                </a>
              </li>
              <li>
                <a href="https://zackwinter14.github.io/lifeadmin-privacy/terms.html">
                  Terms
                </a>
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
