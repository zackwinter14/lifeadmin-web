export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
      <p className="mb-10 text-sm text-gray-500">Last updated: April 27, 2026</p>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">1. Agreement to Terms</h2>
          <p>By using Life Admin Finance Tracker ("Life Admin Finance Tracker", "the App", or "the Service"), you agree to these Terms of Service. If you do not agree, do not use Life Admin Finance Tracker.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">2. Description of Service</h2>
          <p>Life Admin Finance Tracker is a personal finance management app that helps users track subscriptions, bills, expenses, and net worth. Life Admin Finance Tracker is available on iOS via the App Store and on the web at lifeadminofficial.com.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">3. User Accounts</h2>
          <p>To use Life Admin Finance Tracker, you must create an account with a valid email address and password. You are responsible for maintaining the security of your account and all activity that occurs under it.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">4. Subscriptions and Billing</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Life Admin Finance Tracker offers a free tier and a Pro subscription.</li>
            <li>Pro subscriptions are billed monthly, quarterly, or annually depending on the plan selected.</li>
            <li>Payments are processed securely via Stripe.</li>
            <li>Subscriptions automatically renew unless cancelled before the renewal date.</li>
            <li>Refunds are handled on a case-by-case basis. Contact support@lifeadminofficial.com for refund requests.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Use Life Admin Finance Tracker for any illegal purpose</li>
            <li>Attempt to reverse engineer or hack the app</li>
            <li>Share your account credentials with others</li>
            <li>Use the service to harm or defraud others</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">6. Financial Information Disclaimer</h2>
          <p>Life Admin Finance Tracker is a personal finance tracking tool, not a licensed financial advisor. The information provided by Life Admin Finance Tracker is for informational purposes only and does not constitute financial, investment, or legal advice.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">7. Bank Connection</h2>
          <p>Pro users may connect their bank accounts via Plaid. By connecting your bank, you authorize Life Admin Finance Tracker to retrieve your transaction data to detect recurring payments. We do not store your bank login credentials.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">8. Intellectual Property</h2>
          <p>All content, branding, and technology within Life Admin Finance Tracker is owned by Life Admin Finance Tracker. You may not copy, reproduce, or distribute any part of the service without written permission.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">9. Termination</h2>
          <p>We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may delete your account at any time by contacting support@lifeadminofficial.com.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">10. Limitation of Liability</h2>
          <p>Life Admin Finance Tracker is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including loss of data or financial loss.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">11. Changes to Terms</h2>
          <p>We may update these Terms of Service at any time. Continued use of Life Admin Finance Tracker after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">12. Contact</h2>
          <p>For questions about these Terms of Service, contact Life Admin Finance Tracker at:</p>
          <p className="mt-2">Email: <a href="mailto:support@lifeadminofficial.com" className="text-brand hover:underline">support@lifeadminofficial.com</a></p>
          <p>Website: <a href="https://lifeadminofficial.com" className="text-brand hover:underline">lifeadminofficial.com</a></p>
        </section>
      </div>
    </div>
  );
}
