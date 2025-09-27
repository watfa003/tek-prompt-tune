import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Code, 
  FileText, 
  Database, 
  BookOpen, 
  Search,
  Star,
  Copy,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptTemplate {
  id: number;
  title: string;
  description: string;
  category: string;
  template: string;
  outputType: string;
  rating: number;
  usageCount: number;
  tags: string[];
}

const promptTemplates: PromptTemplate[] = [
  {
    id: 1,
    title: "Clean Code Function",
    description: "Generate well-documented, clean code functions with error handling",
    category: "Code",
    template: "You are an expert software engineer. Write a clean, well-documented {language} function that {task}. Include type hints, comprehensive docstrings, error handling, and follow best practices. The function should be production-ready and efficient.",
    outputType: "Code",
    rating: 5,
    usageCount: 1247,
    tags: ["programming", "documentation", "best-practices"]
  },
  {
    id: 2,
    title: "Technical Documentation",
    description: "Create comprehensive technical documentation with examples",
    category: "Documentation",
    template: "Create comprehensive technical documentation for {topic}. Include: 1) Overview and purpose, 2) Detailed explanation, 3) Code examples with comments, 4) Common use cases, 5) Best practices, 6) Troubleshooting guide. Make it accessible for both beginners and experienced developers.",
    outputType: "Essay",
    rating: 5,
    usageCount: 892,
    tags: ["documentation", "technical-writing", "examples"]
  },
  {
    id: 3,
    title: "JSON Schema Generator",
    description: "Generate valid JSON schemas with validation rules",
    category: "Data",
    template: "Generate a comprehensive JSON schema for {data_type}. Include: 1) All required and optional fields, 2) Proper data types and formats, 3) Validation rules and constraints, 4) Descriptive field documentation, 5) Example valid JSON data. Ensure the schema is draft-07 compliant.",
    outputType: "JSON",
    rating: 4,
    usageCount: 634,
    tags: ["json", "schema", "validation", "api"]
  },
  {
    id: 4,
    title: "API Endpoint Design",
    description: "Design RESTful API endpoints with proper documentation",
    category: "API",
    template: "Design RESTful API endpoints for {resource}. Include: 1) HTTP methods and routes, 2) Request/response schemas, 3) Status codes and error handling, 4) Authentication requirements, 5) Rate limiting considerations, 6) OpenAPI/Swagger documentation. Follow REST best practices.",
    outputType: "Structured Data",
    rating: 5,
    usageCount: 756,
    tags: ["api", "rest", "design", "documentation"]
  },
  {
    id: 5,
    title: "Database Schema Design",
    description: "Create optimized database schemas with relationships",
    category: "Database",
    template: "Design an optimized database schema for {domain}. Include: 1) Table structures with appropriate data types, 2) Primary and foreign key relationships, 3) Indexes for performance, 4) Constraints and validation rules, 5) Sample data, 6) Migration scripts. Consider normalization and query patterns.",
    outputType: "Structured Data",
    rating: 4,
    usageCount: 423,
    tags: ["database", "schema", "sql", "optimization"]
  },
  {
    id: 6,
    title: "Testing Strategy",
    description: "Generate comprehensive testing approaches and test cases",
    category: "Testing",
    template: "Create a comprehensive testing strategy for {feature/application}. Include: 1) Unit test cases with edge cases, 2) Integration test scenarios, 3) End-to-end test flows, 4) Performance test considerations, 5) Security test cases, 6) Test data setup and teardown. Provide specific examples and assertions.",
    outputType: "Essay",
    rating: 4,
    usageCount: 389,
    tags: ["testing", "qa", "unit-tests", "integration"]
  }
];

const categories = ["All", "Code", "Documentation", "Data", "API", "Database", "Testing"];

interface PromptTemplatesProps {
  onUseTemplate: (template: string, outputType: string) => void;
}

export const PromptTemplates = ({ onUseTemplate }: PromptTemplatesProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isSelectingForInfluence = searchParams.get('selectForInfluence') === 'true';

  const filteredTemplates = promptTemplates.filter(template => {
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const copyTemplate = (template: string) => {
    navigator.clipboard.writeText(template);
    toast({
      title: "Template copied",
      description: "Template has been copied to clipboard.",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Code": return Code;
      case "Documentation": return BookOpen;
      case "Data": return Database;
      case "API": return FileText;
      case "Database": return Database;
      case "Testing": return FileText;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Influence Selection Banner */}
      {isSelectingForInfluence && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h3 className="font-medium text-primary mb-1">Select a Template for Influence</h3>
          <p className="text-sm text-muted-foreground">
            Choose a template to influence your AI optimization process.
          </p>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Prompt Templates</h2>
          <p className="text-muted-foreground">
            {isSelectingForInfluence ? "Select a template to influence optimization" : "Start with proven templates for common AI tasks"}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="h-10"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const CategoryIcon = getCategoryIcon(template.category);
          
          return (
            <Card key={template.id} className="p-4 hover:shadow-card transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <CategoryIcon className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < template.rating 
                            ? "fill-primary text-primary" 
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-semibold text-sm">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{template.usageCount.toLocaleString()} uses</span>
                  <Badge variant="outline" className="text-xs">
                    {template.outputType}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (isSelectingForInfluence) {
                        navigate(`/app/ai-agent?selectedTemplate=${encodeURIComponent(template.template)}&selectedType=template`);
                      } else {
                        onUseTemplate(template.template, template.outputType);
                      }
                    }}
                    className="flex-1"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {isSelectingForInfluence ? 'Select for Influence' : 'Use Template'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyTemplate(template.template)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or category filter
          </p>
        </div>
      )}
    </div>
  );
};