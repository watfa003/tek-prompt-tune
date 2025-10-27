import { DocsLayout } from '@/components/docs/DocsLayout';
import { useEffect } from 'react';

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy | PrompTek';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'PrompTek privacy policy - how we collect, use, and protect your data in compliance with GDPR and CCPA regulations.');
    }
  }, []);

  return (
    <DocsLayout
      title="Privacy Policy"
      description="How we collect, use, and protect your data. Last updated: January 2025."
    >
      <div className="space-y-8 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">1. Information We Collect</h2>
          <div className="space-y-3">
            <p>
              <strong className="text-foreground">Account Information:</strong> When you create an account, we collect your email address, name, and password (encrypted).
            </p>
            <p>
              <strong className="text-foreground">Usage Data:</strong> We collect information about how you use PrompTek, including prompts tested, models selected, and optimization results.
            </p>
            <p>
              <strong className="text-foreground">Technical Data:</strong> We automatically collect IP addresses, browser type, device information, and access times for security and analytics.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">2. How We Use Your Information</h2>
          <ul className="space-y-2 ml-4">
            <li>• Provide and improve our prompt optimization services</li>
            <li>• Personalize your experience with adaptive learning</li>
            <li>• Send service updates and security notifications</li>
            <li>• Analyze usage patterns to enhance platform performance</li>
            <li>• Detect and prevent fraud, abuse, or security incidents</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">3. Data Storage and Security</h2>
          <p className="mb-3">
            Your data is stored on secure servers with industry-standard encryption both in transit (TLS 1.3) and at rest (AES-256). We implement:
          </p>
          <ul className="space-y-2 ml-4">
            <li>• Regular security audits and penetration testing</li>
            <li>• Role-based access controls for our team</li>
            <li>• Automated backup systems with encryption</li>
            <li>• Compliance with SOC 2 Type II standards</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">4. Data Sharing and Third Parties</h2>
          <p className="mb-3">
            We do not sell your personal information. We share data only in these limited circumstances:
          </p>
          <ul className="space-y-2 ml-4">
            <li>• <strong className="text-foreground">AI Model Providers:</strong> Prompts are sent to selected AI models (OpenAI, Anthropic, Google) for testing. Each provider has their own privacy policy.</li>
            <li>• <strong className="text-foreground">Service Providers:</strong> We use trusted third parties for hosting, analytics, and payment processing.</li>
            <li>• <strong className="text-foreground">Legal Requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">5. Your Rights (GDPR & CCPA)</h2>
          <p className="mb-3">
            You have the right to:
          </p>
          <ul className="space-y-2 ml-4">
            <li>• Access and download your personal data</li>
            <li>• Correct inaccurate or incomplete information</li>
            <li>• Request deletion of your account and data</li>
            <li>• Opt out of marketing communications</li>
            <li>• Object to automated decision-making</li>
            <li>• Request data portability</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@promptek.ai" className="text-primary hover:underline">
              privacy@promptek.ai
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. After account deletion, we permanently remove your personal information within 30 days, except where we must retain it for legal compliance (e.g., billing records for tax purposes).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">7. Cookies and Tracking</h2>
          <p className="mb-3">
            We use cookies for authentication, preferences, and analytics. You can control cookie settings in your browser. Essential cookies are required for the platform to function.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">8. Children's Privacy</h2>
          <p>
            PrompTek is not intended for users under 13 years of age. We do not knowingly collect information from children.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">9. International Data Transfers</h2>
          <p>
            Your data may be processed in the United States and other countries. We ensure appropriate safeguards are in place for international transfers, including Standard Contractual Clauses.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="border-t border-primary/10 pt-6">
          <h2 className="text-xl font-semibold mb-3 text-foreground">Contact Us</h2>
          <p>
            For privacy-related questions or concerns, contact our Data Protection Officer at{' '}
            <a href="mailto:privacy@promptek.ai" className="text-primary hover:underline">
              privacy@promptek.ai
            </a>
          </p>
          <p className="mt-2 text-sm">
            PrompTek Inc.<br />
            123 AI Innovation Drive<br />
            San Francisco, CA 94103<br />
            United States
          </p>
        </section>
      </div>
    </DocsLayout>
  );
}
