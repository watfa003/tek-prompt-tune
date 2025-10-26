import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const Footer = () => {
  const footerLinks = [
    { label: "About", href: "/about" },
    { label: "Community", href: "/community" },
    { label: "Docs", href: "/docs" },
    { label: "API", href: "/api" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative mt-20 border-t border-white/10"
    >
      {/* Gradient Divider */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent" />
      
      <div className="page-container section-y">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 <span className="gradient-text font-semibold">PrompTek</span> — The Ultimate AI Prompt Engineering Platform
            </p>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1 flex-wrap justify-center"
          >
            {footerLinks.map((link, index) => (
              <span key={link.label} className="flex items-center gap-1">
                <Link
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:shimmer px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  {link.label}
                </Link>
                {index < footerLinks.length - 1 && (
                  <span className="text-muted-foreground/50">•</span>
                )}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
};
