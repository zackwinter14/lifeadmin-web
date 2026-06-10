export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
      <p className="mb-10 text-sm text-gray-500">Last updated: May 9, 2026</p>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">1. Introduction</h2>
          <p>Life Admin Finance Tracker ("Life Admin Finance Tracker", "we", "our", or "us") operates the Life Admin Finance Tracker mobile application and website at lifeadminofficial.com. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">2. Information We Collect</h2>
          <p>Life Admin Finance Tracker collects the following types of information:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong className="text-white">Account Information:</strong> Name, email address, and password when you create an account.</li>
            <li><strong className="text-white">Financial Data:</strong> Subscriptions, bills, expenses, and income information you manually enter or import via bank connection.</li>
            <li><strong className="text-white">Device Information:</strong> Device type, operating system, and app usage data.</li>
            <li><strong className="text-white">Bank Connection Data:</strong> If you connect your bank via Plaid, we receive transaction data to detect recurring payments. We do not store your bank credentials.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">3. How We Use Your Information</h2>
          <p>Life Admin Finance Tracker uses your information to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Provide and improve the Life Admin Finance Tracker app and website</li>
            <li>Track your subscriptions, bills, and expenses</li>
            <li>Send you notifications about upcoming bills and payments</li>
            <li>Process payments for Pro subscriptions</li>
            <li>Respond to customer support requests</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">4. Data Sharing</h2>
          <p>Life Admin Finance Tracker does not sell your personal data. We share data only with trusted third-party services required to operate the app, including:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong className="text-white">Supabase</strong>  -  secure database and authentication</li>
            <li><strong className="text-white">Plaid</strong>  -  bank account connection (Pro users only)</li>
            <li><strong className="text-white">Apple / RevenueCat</strong>  -  payment processing for iOS subscriptions</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">5. Data Security</h2>
          <p>We use industry-standard encryption and security practices to protect your data. Your financial data is stored securely and is only accessible to you through your account.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">6. Data Retention</h2>
          <p>We retain your data as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us at lifeadminofficial@gmail.com.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">7. Children's Privacy</h2>
          <p>Life Admin Finance Tracker is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">8. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at lifeadminofficial@gmail.com.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, contact Life Admin Finance Tracker at:</p>
          <p className="mt-2">Email: <a href="mailto:lifeadminofficial@gmail.com" className="text-brand hover:underline">lifeadminofficial@gmail.com</a></p>
          <p>Website: <a href="https://lifeadminofficial.com" className="text-brand hover:underline">lifeadminofficial.com</a></p>
        </section>
      </div>
    </div>
  );
}
