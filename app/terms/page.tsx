export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
      <p className="mb-10 text-sm text-gray-500">Last updated: May 9, 2026</p>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">1. Agreement to Terms</h2>
          <p>By using Life Admin ("the App" or "the Service"), you agree to these Terms of Service. If you do not agree, do not use Life Admin.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">2. Description of Service</h2>
          <p>Life Admin is a personal finance management app that helps users track subscriptions, bills, expenses, income, and net worth. Life Admin is available on iOS via the App Store and on the web at lifeadminofficial.com.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">3. User Accounts</h2>
          <p>To use Life Admin, you must create an account with a valid email address and password. You are responsible for maintaining the security of your account and all activity that occurs under it.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">4. Subscriptions and Billing</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <div>
              <p className="font-semibold text-white">Plans</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
                <li><strong className="text-white">Free:</strong> Full manual tracking, no charge ever.</li>
                <li><strong className="text-white">Monthly Pro:</strong> $6.99/month, billed monthly. Cancel anytime.</li>
                <li><strong className="text-white">Annual Pro:</strong> $49.99/year (~$4.17/month), billed once per year.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white">7-day free trial</p>
              <p className="mt-1 text-sm">New Pro subscribers receive a 7-day free trial. No charge during the trial. After 7 days, your plan auto-starts at the rate for the plan you selected unless you cancel before the trial ends.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Auto-renewal</p>
              <p className="mt-1 text-sm">Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Cancellation</p>
              <p className="mt-1 text-sm">You may cancel at any time through your Apple ID account settings (iOS) or your Life Admin profile (web). Cancellation takes effect at the end of the current billing period. You retain Pro access until that date.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Purchases &amp; Refunds</p>
              <p className="mt-1 text-sm">All subscription payments are final and non-refundable, except as required by applicable law. We offer a 7-day free trial so you can fully evaluate the service before any charge occurs. iOS purchases are subject to Apple&apos;s refund policies.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Payment processing</p>
              <p className="mt-1 text-sm">iOS payments are processed by Apple through the App Store via RevenueCat. Web payments are processed securely by our payment provider. We do not store your payment card information.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">5. Referral Program</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>When you refer a new user who subscribes to Pro, you receive 1 free month of Pro added to your account.</li>
            <li>The referred user receives 1 free month before their subscription begins.</li>
            <li>After the free month, subscriptions auto-renew at the standard rate ($6.99/month or $49.99/year).</li>
            <li>Referral credits cannot be redeemed for cash and have no monetary value.</li>
            <li>We reserve the right to modify or discontinue the referral program at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            <li>Use Life Admin for any illegal purpose</li>
            <li>Attempt to reverse engineer or hack the app</li>
            <li>Share your account credentials with others</li>
            <li>Use the service to harm or defraud others</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">7. Financial Information Disclaimer</h2>
          <p className="text-sm">Life Admin is a personal finance tracking tool, not a licensed financial advisor. The information provided is for informational purposes only and does not constitute financial, investment, or legal advice.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">8. Bank Connection</h2>
          <p className="text-sm">Pro users may connect their bank accounts via Plaid. By connecting your bank, you authorize Life Admin to retrieve your transaction data to detect recurring payments. We do not store your bank login credentials. Plaid access is read-only — we cannot initiate transfers or payments.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">9. Intellectual Property</h2>
          <p className="text-sm">All content, branding, and technology within Life Admin is owned by ZZW LLC. You may not copy, reproduce, or distribute any part of the service without written permission.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">10. Termination</h2>
          <p className="text-sm">We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may delete your account at any time by contacting support@lifeadminofficial.com.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">11. Limitation of Liability</h2>
          <p className="text-sm">Life Admin is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including loss of data or financial loss.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">12. Changes to Terms</h2>
          <p className="text-sm">We may update these Terms of Service at any time. Continued use of Life Admin after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">13. Contact</h2>
          <p className="text-sm">For questions about these Terms of Service, contact us at:</p>
          <p className="mt-2 text-sm">Email: <a href="mailto:support@lifeadminofficial.com" className="text-brand hover:underline">support@lifeadminofficial.com</a></p>
          <p className="text-sm">Website: <a href="https://lifeadminofficial.com" className="text-brand hover:underline">lifeadminofficial.com</a></p>
        </section>
      </div>
    </div>
  );
}
