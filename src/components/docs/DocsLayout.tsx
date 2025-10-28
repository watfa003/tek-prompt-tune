import { ReactNode } from 'react';
import { DocsSidebar } from './DocsSidebar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface DocsLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

const docsOrder = [
  '/docs/features',
  '/docs/engineering',
  '/docs/testing',
  '/docs/pricing',
  '/docs/documentation',
  '/docs/api',
  '/docs/templates',
  '/docs/blog',
  '/docs/about',
  '/docs/contact',
  '/docs/privacy',
  '/docs/terms',
];

export function DocsLayout({ children, title, description }: DocsLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentIndex = docsOrder.indexOf(location.pathname);
  const prevPage = currentIndex > 0 ? docsOrder[currentIndex - 1] : null;
  const nextPage = currentIndex < docsOrder.length - 1 ? docsOrder[currentIndex + 1] : null;

  const getPageTitle = (path: string) => {
    const titles: Record<string, string> = {
      '/docs/features': 'Optimizer Features',
      '/docs/engineering': 'Engineering Tool',
      '/docs/testing': 'AI Model Testing',
      '/docs/pricing': 'Pricing',
      '/docs/documentation': 'Documentation',
      '/docs/api': 'API Reference',
      '/docs/templates': 'Prompt Templates',
      '/docs/blog': 'Blog',
      '/docs/about': 'About',
      '/docs/contact': 'Contact',
      '/docs/privacy': 'Privacy Policy',
      '/docs/terms': 'Terms of Service',
    };
    return titles[path] || '';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* SEO Meta Tags - handled by parent component */}
      <div className="flex flex-1">
        <DocsSidebar />
        
        <main className="ml-64 flex-1 p-6 md:p-10 lg:p-16 max-w-5xl mx-auto min-w-0">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="space-y-3 pb-8 border-b border-primary/20">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                {description}
              </p>
            </div>

            {/* Page Content */}
            <div className="prose prose-invert max-w-none">
              {children}
            </div>

            {/* Navigation Between Pages */}
            <div className="flex items-center justify-between pt-8 mt-12 border-t border-primary/20">
              {prevPage ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(prevPage)}
                  className="group"
                >
                  <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Previous</div>
                    <div className="text-sm font-medium">{getPageTitle(prevPage)}</div>
                  </div>
                </Button>
              ) : (
                <div />
              )}

              {nextPage ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(nextPage)}
                  className="group"
                >
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Next</div>
                    <div className="text-sm font-medium">{getPageTitle(nextPage)}</div>
                  </div>
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
