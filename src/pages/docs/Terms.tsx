import { DocsLayout } from '@/components/docs/DocsLayout';
import { useEffect } from 'react';

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Service | PrompTek';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'PrompTek Terms of Service - legal agreement governing use of the platform, user responsibilities, and service guarantees.');
    }
  }, []);

  return (
    <DocsLayout
      title="Terms of Service"
      description="Legal terms governing your use of PrompTek. Last updated: January 2025."
    >
      <div className="space-y-8 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using PrompTek ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. We reserve the right to modify these Terms at any time, and your continued use constitutes acceptance of changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">2. Description of Service</h2>
          <p className="mb-3">
            PrompTek is a SaaS platform that provides AI prompt optimization, testing, and analytics tools. The Service includes:
          </p>
          <ul className="space-y-2 ml-4">
            <li>• Prompt testing across multiple AI models</li>
            <li>• Quality scoring and optimization suggestions</li>
            <li>• Template library and version management</li>
            <li>• Analytics and performance tracking</li>
            <li>• API access (Pro and Enterprise tiers)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">3. Account Registration</h2>
          <p className="mb-3">
            To use PrompTek, you must:
          </p>
          <ul className="space-y-2 ml-4">
            <li>• Provide accurate and complete registration information</li>
            <li>• Maintain the security of your account credentials</li>
            <li>• Be at least 13 years old (or legal age in your jurisdiction)</li>
            <li>• Notify us immediately of any unauthorized access</li>
          </ul>
          <p className="mt-3">
            You are responsible for all activities under your account. We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">4. Acceptable Use Policy</h2>
          <p className="mb-3">
            You agree NOT to:
          </p>
          <ul className="space-y-2 ml-4">
            <li>• Use the Service for illegal purposes or to violate any laws</li>
            <li>• Reverse engineer, decompile, or attempt to extract source code</li>
            <li>• Interfere with or disrupt the Service or servers</li>
            <li>• Share account credentials with unauthorized users</li>
            <li>• Use the Service to generate harmful, abusive, or offensive content</li>
            <li>• Attempt to bypass rate limits or usage restrictions</li>
            <li>• Scrape or extract data through automated means without permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">5. Subscription and Billing</h2>
          <div className="space-y-3">
            <p>
              <strong className="text-foreground">Free Tier:</strong> Limited features with usage caps as specified on our pricing page.
            </p>
            <p>
              <strong className="text-foreground">Paid Subscriptions:</strong> Billed monthly or annually. Fees are non-refundable except as required by law. You may cancel anytime, with service continuing until the end of the billing period.
            </p>
            <p>
              <strong className="text-foreground">Price Changes:</strong> We may modify pricing with 30 days notice. Continued use after notice constitutes acceptance.
            </p>
            <p>
              <strong className="text-foreground">API Usage:</strong> AI model costs from third-party providers (OpenAI, Anthropic, Google) are separate and billed directly by those providers.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">6. Intellectual Property</h2>
          <div className="space-y-3">
            <p>
              <strong className="text-foreground">Our IP:</strong> PrompTek owns all rights to the platform, including software, algorithms, design, and documentation. You receive a limited, non-exclusive license to use the Service.
            </p>
            <p>
              <strong className="text-foreground">Your Content:</strong> You retain ownership of prompts, templates, and data you create. You grant us a license to process your content solely to provide the Service.
            </p>
            <p>
              <strong className="text-foreground">AI-Generated Content:</strong> Outputs from AI models are subject to the respective provider's terms. We make no warranty regarding ownership or copyright of AI-generated content.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">7. Privacy and Data</h2>
          <p>
            Your use of PrompTek is governed by our Privacy Policy. By using the Service, you consent to our data practices as described in the Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">8. Service Availability and Support</h2>
          <div className="space-y-3">
            <p>
              <strong className="text-foreground">Uptime:</strong> We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be communicated in advance when possible.
            </p>
            <p>
              <strong className="text-foreground">Support:</strong> Email support for all users. Pro/Enterprise customers receive priority support with faster response times.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">9. Disclaimers and Limitation of Liability</h2>
          <div className="space-y-3">
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              WE ARE NOT LIABLE FOR:
            </p>
            <ul className="space-y-2 ml-4">
              <li>• Accuracy or quality of AI-generated outputs</li>
              <li>• Data loss or security breaches beyond our reasonable control</li>
              <li>• Third-party AI model availability or performance</li>
              <li>• Indirect, incidental, or consequential damages</li>
            </ul>
            <p>
              Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">10. Indemnification</h2>
          <p>
            You agree to indemnify and hold PrompTek harmless from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">11. Termination</h2>
          <p>
            Either party may terminate this agreement at any time. We may suspend or terminate your account immediately for Terms violations. Upon termination, your right to use the Service ceases, and we may delete your data per our retention policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">12. Governing Law and Disputes</h2>
          <p className="mb-3">
            These Terms are governed by the laws of the State of California, USA, without regard to conflict of law provisions.
          </p>
          <p>
            Disputes shall be resolved through binding arbitration in San Francisco, California, except where prohibited by law. You waive the right to participate in class actions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">13. Miscellaneous</h2>
          <ul className="space-y-2 ml-4">
            <li>• <strong className="text-foreground">Entire Agreement:</strong> These Terms constitute the entire agreement between you and PrompTek.</li>
            <li>• <strong className="text-foreground">Severability:</strong> If any provision is unenforceable, the remainder remains in effect.</li>
            <li>• <strong className="text-foreground">No Waiver:</strong> Failure to enforce any right does not constitute a waiver.</li>
            <li>• <strong className="text-foreground">Assignment:</strong> You may not assign these Terms without our consent.</li>
          </ul>
        </section>

        <section className="border-t border-primary/10 pt-6">
          <h2 className="text-xl font-semibold mb-3 text-foreground">Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@promptek.ai" className="text-primary hover:underline">
              legal@promptek.ai
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
