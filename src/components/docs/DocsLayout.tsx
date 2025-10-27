import { ReactNode } from 'react';
import { DocsSidebar } from './DocsSidebar';

interface DocsLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export function DocsLayout({ children, title, description }: DocsLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags - handled by parent component */}
      <div className="flex">
        <DocsSidebar />
        
        <main className="flex-1 p-6 md:p-10 lg:p-16 max-w-5xl">
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
          </div>
        </main>
      </div>
    </div>
  );
}
