import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { useEffect } from 'react';

export default function Blog() {
  useEffect(() => {
    document.title = 'Blog | PrompTek';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Articles about AI prompt engineering, optimization techniques, industry updates, and best practices from the PrompTek team.');
    }
  }, []);

  const posts = [
    {
      title: 'The Art of Prompt Engineering: A 2025 Guide',
      excerpt: 'Explore advanced techniques for crafting effective AI prompts that consistently deliver high-quality results across different models.',
      author: 'Sarah Chen',
      date: '2025-01-10',
      readTime: '8 min read',
      category: 'Best Practices',
    },
    {
      title: 'GPT-4 vs Claude 3.5: Performance Comparison',
      excerpt: 'In-depth analysis of prompt performance across leading AI models with real-world benchmarks and cost considerations.',
      author: 'Marcus Rodriguez',
      date: '2025-01-05',
      readTime: '12 min read',
      category: 'Analysis',
    },
    {
      title: 'Optimizing Prompts for Code Generation',
      excerpt: 'Best practices for creating prompts that generate clean, efficient, and maintainable code across programming languages.',
      author: 'Dev Team',
      date: '2024-12-28',
      readTime: '10 min read',
      category: 'Development',
    },
    {
      title: 'PrompTek 2.0: What\'s New',
      excerpt: 'Announcing major updates including adaptive learning, enhanced analytics, and cross-model intelligence features.',
      author: 'Product Team',
      date: '2024-12-20',
      readTime: '5 min read',
      category: 'Product Updates',
    },
    {
      title: 'Building Context-Aware AI Assistants',
      excerpt: 'Learn how to design prompts that maintain context and deliver personalized responses in conversational AI applications.',
      author: 'Dr. Emily Watson',
      date: '2024-12-15',
      readTime: '15 min read',
      category: 'Tutorials',
    },
    {
      title: 'Cost Optimization Strategies for AI APIs',
      excerpt: 'Practical tips for reducing AI API costs while maintaining output quality through smart prompt engineering.',
      author: 'Finance Team',
      date: '2024-12-10',
      readTime: '7 min read',
      category: 'Business',
    },
  ];

  return (
    <DocsLayout
      title="Blog"
      description="Insights, tutorials, and updates from the PrompTek team on AI prompt engineering and optimization."
    >
      <div className="space-y-6">
        {posts.map((post, index) => (
          <Card
            key={index}
            className="p-6 glass-card border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <Badge variant="outline" className="text-primary border-primary/40">
                {post.category}
              </Badge>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            
            <p className="text-muted-foreground text-sm mb-4">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">By {post.author}</span>
              <span className="text-sm text-primary group-hover:underline">Read more →</span>
            </div>
          </Card>
        ))}
      </div>

      <section className="border-t border-primary/10 pt-8 mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">
          Subscribe to Updates
        </h2>
        <p className="text-muted-foreground mb-4">
          Stay informed about the latest in prompt engineering, AI model updates, and PrompTek features.
          Subscribe to our newsletter for weekly insights delivered to your inbox.
        </p>
        <div className="flex gap-2 max-w-md">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-4 py-2 rounded-lg bg-muted/30 border border-primary/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-medium hover:opacity-90 transition-opacity">
            Subscribe
          </button>
        </div>
      </section>
    </DocsLayout>
  );
}
