import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function PromptTemplates() {
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Prompt Templates Library | PrompTek';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Browse PrompTek\'s library of optimized prompt templates for marketing, coding, creative writing, and more.');
    }
  }, []);

  const templates = [
    {
      category: 'Code Review',
      title: 'Comprehensive Code Reviewer',
      description: 'Analyze code for bugs, security issues, and best practices',
      prompt: `You are an expert code reviewer. Analyze the following code:

{{code}}

Provide feedback on:
1. Potential bugs or errors
2. Security vulnerabilities
3. Performance issues
4. Code style and maintainability
5. Suggested improvements

Be specific and actionable.`,
      tags: ['Development', 'QA', 'Security'],
    },
    {
      category: 'Marketing',
      title: 'Social Media Campaign Creator',
      description: 'Generate engaging social media content for campaigns',
      prompt: `Create a social media campaign for:
Product: {{product_name}}
Target Audience: {{audience}}
Goal: {{goal}}
Platform: {{platform}}

Generate:
- 5 engaging post variations
- Relevant hashtags
- Call-to-action recommendations
- Optimal posting times`,
      tags: ['Marketing', 'Social Media', 'Content'],
    },
    {
      category: 'Creative Writing',
      title: 'Story Plot Generator',
      description: 'Generate creative story plots and narrative structures',
      prompt: `Create a compelling story plot with:
Genre: {{genre}}
Setting: {{setting}}
Themes: {{themes}}

Include:
- Main characters with motivations
- Central conflict
- Plot progression (setup, rising action, climax, resolution)
- Potential subplots
- Unique twist or hook`,
      tags: ['Creative', 'Writing', 'Storytelling'],
    },
    {
      category: 'Data Analysis',
      title: 'Data Insights Analyzer',
      description: 'Extract insights and patterns from datasets',
      prompt: `Analyze this dataset and provide insights:

{{data}}

Focus on:
- Key patterns and trends
- Anomalies or outliers
- Correlations between variables
- Actionable recommendations
- Statistical significance

Present findings clearly with supporting evidence.`,
      tags: ['Analytics', 'Data Science', 'Business'],
    },
    {
      category: 'Education',
      title: 'Lesson Plan Creator',
      description: 'Generate structured lesson plans for any subject',
      prompt: `Create a detailed lesson plan:
Subject: {{subject}}
Grade Level: {{grade}}
Duration: {{duration}}
Learning Objectives: {{objectives}}

Include:
- Introduction/Hook
- Main activities with timing
- Assessment methods
- Materials needed
- Differentiation strategies`,
      tags: ['Education', 'Teaching', 'Planning'],
    },
    {
      category: 'Customer Support',
      title: 'Support Response Template',
      description: 'Craft professional, empathetic customer support responses',
      prompt: `Draft a customer support response for:
Issue: {{issue}}
Customer Tone: {{tone}}
Company Policy: {{policy}}

Response should:
- Show empathy and understanding
- Address the specific concern
- Provide clear solution or next steps
- Maintain professional, friendly tone
- Include relevant resources`,
      tags: ['Support', 'Communication', 'Service'],
    },
  ];

  const copyTemplate = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: 'Copied!',
      description: 'Template copied to clipboard',
    });
  };

  return (
    <DocsLayout
      title="Prompt Templates Library"
      description="Production-ready prompt templates for common use cases. Copy, customize, and optimize for your needs."
    >
      <div className="space-y-8">
        {templates.map((template, index) => (
          <Card key={index} className="p-6 glass-card border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge variant="outline" className="mb-2 text-primary border-primary/40">
                  {template.category}
                </Badge>
                <h3 className="text-xl font-semibold text-foreground">{template.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyTemplate(template.prompt)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm mb-4">
              <pre className="text-foreground whitespace-pre-wrap">{template.prompt}</pre>
            </div>

            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        ))}

        <section className="border-t border-primary/10 pt-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Using Templates
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Templates use variable placeholders in the format{' '}
              <code className="text-primary">{'{{variable_name}}'}</code>. Replace these with your
              specific content before running the prompt.
            </p>
            <p>
              After copying a template, paste it into the PrompTek optimizer to test performance across
              multiple AI models and receive optimization suggestions.
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Pro tip:</strong> Save frequently used templates to
              your personal library for quick access and version tracking.
            </p>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
