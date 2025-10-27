import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageSquare, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    document.title = 'Contact Us | PrompTek';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Get in touch with the PrompTek team for support, sales inquiries, partnerships, or general questions.');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Message Sent!',
      description: 'We\'ll get back to you within 24 hours.',
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <DocsLayout
      title="Contact Us"
      description="Get in touch with our team. We're here to help with any questions or feedback."
    >
      <div className="space-y-12">
        <section>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 glass-card border-primary/20 text-center">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit mx-auto">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">General Inquiries</h3>
              <a href="mailto:hello@promptek.ai" className="text-sm text-primary hover:underline">
                hello@promptek.ai
              </a>
            </Card>

            <Card className="p-6 glass-card border-primary/20 text-center">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit mx-auto">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Support</h3>
              <a href="mailto:support@promptek.ai" className="text-sm text-primary hover:underline">
                support@promptek.ai
              </a>
            </Card>

            <Card className="p-6 glass-card border-primary/20 text-center">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit mx-auto">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Sales</h3>
              <a href="mailto:sales@promptek.ai" className="text-sm text-primary hover:underline">
                sales@promptek.ai
              </a>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Send us a Message
          </h2>
          <Card className="p-8 glass-card border-primary/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  required
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  required
                  rows={6}
                  className="bg-background/50 resize-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Send Message
              </Button>
            </form>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Office Location
          </h2>
          <Card className="p-6 glass-card border-primary/20">
            <p className="text-muted-foreground mb-2">
              <strong className="text-foreground">PrompTek Inc.</strong>
            </p>
            <p className="text-muted-foreground">
              123 AI Innovation Drive<br />
              San Francisco, CA 94103<br />
              United States
            </p>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Response Time
          </h2>
          <p className="text-muted-foreground">
            We aim to respond to all inquiries within 24 hours during business days. For urgent support
            issues, Pro and Enterprise customers can access priority support channels in their account
            dashboard.
          </p>
        </section>
      </div>
    </DocsLayout>
  );
}
