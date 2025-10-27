import { NavLink } from 'react-router-dom';
import { 
  Zap, 
  Code, 
  TestTube, 
  DollarSign, 
  BookOpen, 
  FileCode, 
  FileText, 
  PenTool,
  Building,
  Mail,
  Shield,
  ScrollText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const docsSections = [
  {
    title: 'Product',
    items: [
      { title: 'Optimizer Features', href: '/docs/features', icon: Zap },
      { title: 'Engineering Tool', href: '/docs/engineering', icon: Code },
      { title: 'AI Model Testing', href: '/docs/testing', icon: TestTube },
      { title: 'Pricing', href: '/docs/pricing', icon: DollarSign },
    ],
  },
  {
    title: 'Resources',
    items: [
      { title: 'Documentation', href: '/docs/documentation', icon: BookOpen },
      { title: 'API Reference', href: '/docs/api', icon: FileCode },
      { title: 'Prompt Templates', href: '/docs/templates', icon: FileText },
      { title: 'Blog', href: '/docs/blog', icon: PenTool },
    ],
  },
  {
    title: 'Company',
    items: [
      { title: 'About', href: '/docs/about', icon: Building },
      { title: 'Contact', href: '/docs/contact', icon: Mail },
      { title: 'Privacy Policy', href: '/docs/privacy', icon: Shield },
      { title: 'Terms of Service', href: '/docs/terms', icon: ScrollText },
    ],
  },
];

export function DocsSidebar() {
  return (
      <aside className="w-64 border-r border-primary/10 sticky top-0 h-[100vh] p-6 overflow-y-auto bg-background/95 backdrop-blur">
      <NavLink to="/" className="block mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          PrompTek Docs
        </h2>
      </NavLink>

      <nav className="space-y-8">
        {docsSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium border border-primary/40'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
