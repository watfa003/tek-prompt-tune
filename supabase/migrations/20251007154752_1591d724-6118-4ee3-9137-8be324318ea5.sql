-- Get the admin user ID
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'watfa003@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Productivity Templates
    INSERT INTO public.prompt_templates (user_id, title, description, template, category, output_type, is_official, is_public, tags)
    VALUES 
    (admin_user_id, 'Email Writer Pro', 'Generate professional emails with perfect tone and structure', 'Write a professional email about [TOPIC]. Keep it concise, clear, and action-oriented. Use proper business email structure with greeting, body, and closing.', 'Productivity', 'text', true, true, ARRAY['email', 'communication', 'business']),
    (admin_user_id, 'Meeting Notes Summarizer', 'Transform meeting notes into actionable summaries', 'Summarize these meeting notes into key points, action items, and decisions made: [NOTES]. Format with clear sections and assign owners to action items.', 'Productivity', 'text', true, true, ARRAY['meetings', 'summary', 'productivity']),
    (admin_user_id, 'Task Breakdown Assistant', 'Break down complex projects into manageable tasks', 'Break down this project into specific, actionable tasks: [PROJECT]. Create a step-by-step plan with estimated time for each task and dependencies.', 'Productivity', 'text', true, true, ARRAY['planning', 'tasks', 'project-management']);

    -- Writing Templates
    INSERT INTO public.prompt_templates (user_id, title, description, template, category, output_type, is_official, is_public, tags)
    VALUES
    (admin_user_id, 'Blog Post Generator', 'Create engaging blog posts with SEO optimization', 'Write a comprehensive blog post about [TOPIC]. Include: catchy headline, SEO-optimized intro, 3-5 main sections with subheadings, practical examples, and a strong conclusion with CTA.', 'Writing', 'text', true, true, ARRAY['blog', 'content', 'seo']),
    (admin_user_id, 'Social Media Caption Creator', 'Craft viral-worthy social media captions', 'Create 5 engaging social media captions for [TOPIC/PRODUCT]. Make them: attention-grabbing, include relevant hashtags, and have a clear call-to-action. Vary the tone from professional to casual.', 'Writing', 'text', true, true, ARRAY['social-media', 'marketing', 'engagement']),
    (admin_user_id, 'Story Plot Developer', 'Develop compelling story plots and characters', 'Create a detailed story plot for [GENRE] about [PREMISE]. Include: main characters with motivations, three-act structure, key plot points, conflicts, and resolution.', 'Writing', 'text', true, true, ARRAY['creative', 'storytelling', 'fiction']);

    -- Code Templates
    INSERT INTO public.prompt_templates (user_id, title, description, template, category, output_type, is_official, is_public, tags)
    VALUES
    (admin_user_id, 'React Component Builder', 'Generate production-ready React components', 'Create a React TypeScript component for [COMPONENT_NAME] that [FUNCTIONALITY]. Include: proper TypeScript types, error handling, responsive design with Tailwind CSS, and JSDoc comments.', 'Code', 'code', true, true, ARRAY['react', 'typescript', 'frontend']),
    (admin_user_id, 'API Endpoint Generator', 'Build secure REST API endpoints', 'Create a REST API endpoint for [RESOURCE] with [METHOD]. Include: input validation, error handling, authentication check, database queries, and proper HTTP status codes. Use TypeScript.', 'Code', 'code', true, true, ARRAY['api', 'backend', 'rest']),
    (admin_user_id, 'Database Schema Designer', 'Design optimized database schemas', 'Design a database schema for [APPLICATION/FEATURE]. Include: tables with columns and types, primary/foreign keys, indexes for performance, and RLS policies for security. Use PostgreSQL syntax.', 'Code', 'code', true, true, ARRAY['database', 'schema', 'sql']);

    -- Marketing Templates
    INSERT INTO public.prompt_templates (user_id, title, description, template, category, output_type, is_official, is_public, tags)
    VALUES
    (admin_user_id, 'Product Launch Announcement', 'Create buzz-worthy product launch content', 'Write a product launch announcement for [PRODUCT]. Highlight: key features and benefits, target audience pain points solved, unique value proposition, social proof, and compelling CTA.', 'Marketing', 'text', true, true, ARRAY['product', 'launch', 'announcement']),
    (admin_user_id, 'Ad Copy Generator', 'Generate high-converting ad copy', 'Create 3 versions of ad copy for [PRODUCT/SERVICE] targeting [AUDIENCE]. Each should: hook attention in first line, address pain point, present solution, and drive action. Limit to 150 characters.', 'Marketing', 'text', true, true, ARRAY['advertising', 'copywriting', 'conversion']),
    (admin_user_id, 'Customer Persona Builder', 'Develop detailed customer personas', 'Create a detailed customer persona for [PRODUCT/SERVICE]. Include: demographics, psychographics, goals, challenges, buying behavior, preferred channels, and messaging that resonates.', 'Marketing', 'text', true, true, ARRAY['persona', 'research', 'strategy']);

    -- Analytics Templates
    INSERT INTO public.prompt_templates (user_id, title, description, template, category, output_type, is_official, is_public, tags)
    VALUES
    (admin_user_id, 'Data Analysis Report', 'Generate comprehensive data analysis reports', 'Analyze this data and create a report: [DATA]. Include: key trends, anomalies, statistical significance, visualizations recommendations, actionable insights, and next steps.', 'Analytics', 'text', true, true, ARRAY['data', 'analysis', 'reporting']),
    (admin_user_id, 'KPI Dashboard Builder', 'Design effective KPI tracking dashboards', 'Design a KPI dashboard for [DEPARTMENT/PROJECT]. Define: 5-7 key metrics, data sources, visualization types, update frequency, and alert thresholds for each metric.', 'Analytics', 'text', true, true, ARRAY['kpi', 'metrics', 'dashboard']),
    (admin_user_id, 'A/B Test Analyzer', 'Analyze and interpret A/B test results', 'Analyze these A/B test results: [DATA]. Determine: statistical significance, winning variant, confidence level, impact size, and recommendations for implementation or further testing.', 'Analytics', 'text', true, true, ARRAY['ab-testing', 'experimentation', 'optimization']);

    -- Creative Templates
    INSERT INTO public.prompt_templates (user_id, title, description, template, category, output_type, is_official, is_public, tags)
    VALUES
    (admin_user_id, 'Brand Story Creator', 'Craft compelling brand narratives', 'Create a brand story for [COMPANY/PRODUCT]. Include: origin story, mission and values, unique approach, customer impact stories, and vision for the future. Make it emotional and memorable.', 'Creative', 'text', true, true, ARRAY['branding', 'storytelling', 'narrative']),
    (admin_user_id, 'Video Script Writer', 'Write engaging video scripts', 'Write a video script for [TOPIC] targeting [AUDIENCE]. Length: [DURATION]. Include: hook in first 5 seconds, clear structure, visual cues, emotional beats, and strong CTA. Format for teleprompter.', 'Creative', 'text', true, true, ARRAY['video', 'script', 'content']),
    (admin_user_id, 'Slogan Generator', 'Create memorable brand slogans', 'Generate 10 creative slogans for [BRAND/PRODUCT]. Each should: be memorable, reflect brand values, differentiate from competitors, and resonate with [TARGET_AUDIENCE]. Explain the thinking behind top 3.', 'Creative', 'text', true, true, ARRAY['slogan', 'branding', 'tagline']);

    -- Business Templates
    INSERT INTO public.prompt_templates (user_id, title, description, template, category, output_type, is_official, is_public, tags)
    VALUES
    (admin_user_id, 'Business Plan Builder', 'Create comprehensive business plans', 'Create a business plan for [BUSINESS_IDEA]. Include: executive summary, market analysis, competitive landscape, business model, marketing strategy, financial projections, and key milestones.', 'Business', 'text', true, true, ARRAY['planning', 'strategy', 'startup']),
    (admin_user_id, 'Pitch Deck Outline', 'Structure winning investor pitch decks', 'Create a pitch deck outline for [COMPANY]. Include 10-12 slides: problem, solution, market size, business model, traction, team, competition, go-to-market, financials, ask, and vision.', 'Business', 'text', true, true, ARRAY['pitch', 'investors', 'fundraising']),
    (admin_user_id, 'SWOT Analysis Generator', 'Generate strategic SWOT analyses', 'Perform a SWOT analysis for [COMPANY/PROJECT]. Identify: 5 strengths, 5 weaknesses, 5 opportunities, and 5 threats. Provide strategic recommendations based on the analysis.', 'Business', 'text', true, true, ARRAY['strategy', 'analysis', 'planning']);

    -- Education Templates
    INSERT INTO public.prompt_templates (user_id, title, description, template, category, output_type, is_official, is_public, tags)
    VALUES
    (admin_user_id, 'Lesson Plan Creator', 'Design comprehensive lesson plans', 'Create a lesson plan for [SUBJECT/TOPIC] for [GRADE_LEVEL]. Include: learning objectives, materials needed, warm-up activity, main lesson with examples, practice exercises, and assessment method.', 'Education', 'text', true, true, ARRAY['teaching', 'curriculum', 'lesson']),
    (admin_user_id, 'Study Guide Generator', 'Generate effective study guides', 'Create a study guide for [TOPIC]. Include: key concepts summary, important terms and definitions, practice questions with answers, mnemonics for memorization, and study tips.', 'Education', 'text', true, true, ARRAY['study', 'learning', 'exam-prep']),
    (admin_user_id, 'Quiz Builder', 'Create comprehensive quizzes', 'Create a quiz on [TOPIC] with [NUMBER] questions. Include: multiple choice, true/false, and short answer questions. Provide correct answers and brief explanations for each.', 'Education', 'text', true, true, ARRAY['quiz', 'assessment', 'testing']);

    -- Custom Templates (AI Tools)
    INSERT INTO public.prompt_templates (user_id, title, description, template, category, output_type, is_official, is_public, tags)
    VALUES
    (admin_user_id, 'Lovable App Builder Prompt', 'Optimize prompts for Lovable AI app generation', 'Build a [TYPE] web app that [FUNCTIONALITY]. Requirements: React + TypeScript + Tailwind CSS, responsive design, modern UI with shadcn components, proper error handling, and smooth user experience. Include [SPECIFIC_FEATURES].', 'Custom', 'text', true, true, ARRAY['lovable', 'web-app', 'ai']),
    (admin_user_id, 'Replit Project Prompt', 'Create detailed Replit project specifications', 'Create a [LANGUAGE] project in Replit that [FUNCTIONALITY]. Include: file structure, dependencies, main code with comments, README with setup instructions, and test cases. Make it beginner-friendly.', 'Custom', 'code', true, true, ARRAY['replit', 'project', 'coding']),
    (admin_user_id, 'Bolt App Generator Prompt', 'Generate Bolt-optimized app prompts', 'Generate a fullstack app using Bolt that [FUNCTIONALITY]. Specify: frontend framework, backend technology, database schema, API endpoints, authentication flow, and deployment requirements.', 'Custom', 'code', true, true, ARRAY['bolt', 'fullstack', 'app']),
    (admin_user_id, 'Cursor AI Code Prompt', 'Optimize code generation with Cursor AI', 'Using Cursor AI, help me [CODING_TASK]. Context: [PROJECT_CONTEXT]. Requirements: clean code, proper TypeScript types, error handling, unit tests, and inline documentation. Follow [FRAMEWORK] best practices.', 'Custom', 'code', true, true, ARRAY['cursor', 'ai-coding', 'development']);
  END IF;
END $$;