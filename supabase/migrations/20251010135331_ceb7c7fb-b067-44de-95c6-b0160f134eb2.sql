-- Add professional web development templates
INSERT INTO public.prompt_templates (title, description, category, template, is_public, is_official, output_type, user_id)
VALUES
  -- Web Development Templates
  (
    'Full-Stack Web App Builder',
    'Professional template for building complete web applications with modern tech stack',
    'Web Development',
    'You are a professional full-stack web application developer.

Build a complete [WEB APP NAME] with the following specifications:

## Core Requirements
1. User authentication and authorization
2. Database schema and relationships
3. RESTful API endpoints
4. Responsive frontend interface
5. State management implementation
6. Form validation and error handling

## Technical Stack
- Frontend: React with TypeScript
- Backend: Node.js/Express or Supabase Edge Functions
- Database: PostgreSQL with proper RLS policies
- Styling: Tailwind CSS
- Authentication: Supabase Auth

## Features to Implement
[LIST YOUR SPECIFIC FEATURES]

## Deliverables
1. Complete database schema with migrations
2. Backend API with all endpoints
3. Frontend components with proper TypeScript types
4. Authentication flow (signup, login, logout)
5. Deployment-ready configuration
6. Basic documentation

## Security Considerations
- Input validation on all forms
- SQL injection prevention
- XSS protection
- CSRF tokens where needed
- Secure password handling
- Rate limiting on API endpoints

Please provide code with detailed comments and explain architectural decisions.',
    true,
    true,
    'code',
    (SELECT user_id FROM public.profiles LIMIT 1)
  ),
  
  (
    'Landing Page Generator',
    'Create high-converting landing pages with modern design',
    'Web Development',
    'You are a professional web designer and conversion optimization expert.

Create a high-converting landing page for [PRODUCT/SERVICE NAME].

## Page Structure
1. Hero Section
   - Compelling headline addressing main pain point
   - Supporting subheadline with key benefit
   - Primary CTA button
   - Hero image/video

2. Social Proof Section
   - Customer testimonials with photos
   - Company logos (if B2B)
   - Trust badges/certifications
   - Key metrics/statistics

3. Features Section
   - 3-6 key features with icons
   - Benefit-focused descriptions
   - Visual representations

4. How It Works
   - 3-step process
   - Simple, clear explanations
   - Supporting visuals

5. Pricing Section (if applicable)
   - Clear pricing tiers
   - Feature comparison
   - CTA for each tier

6. FAQ Section
   - 6-8 common questions
   - Clear, concise answers

7. Final CTA Section
   - Urgency/scarcity element
   - Strong call-to-action
   - Risk reversal (guarantee, free trial)

## Technical Requirements
- Fully responsive design (mobile-first)
- Fast loading (< 3 seconds)
- SEO optimized (meta tags, semantic HTML)
- Accessibility compliant (WCAG AA)
- Analytics tracking setup

## Design Guidelines
- Consistent color palette (provide hex codes)
- Modern, clean typography
- Whitespace for readability
- High-quality images (provide sources or descriptions)

Provide complete HTML, CSS (Tailwind), and any necessary JavaScript.',
    true,
    true,
    'code',
    (SELECT user_id FROM public.profiles LIMIT 1)
  ),

  (
    'SaaS Dashboard Builder',
    'Build complete admin dashboards with charts, tables, and analytics',
    'Web Development',
    'You are a professional SaaS application developer specializing in admin dashboards.

Build a comprehensive admin dashboard for [APPLICATION NAME] with the following components:

## Dashboard Overview Page
1. Key Metrics Cards
   - Total users, revenue, active sessions, growth rate
   - Comparison with previous period
   - Trend indicators

2. Analytics Charts
   - User growth over time (line chart)
   - Revenue by product (bar chart)
   - Geographic distribution (map)
   - Conversion funnel (funnel chart)

3. Recent Activity Feed
   - Real-time updates
   - User actions
   - System events

## Data Management
1. Users Table
   - Sortable columns
   - Search functionality
   - Filters (status, role, date joined)
   - Pagination
   - Bulk actions
   - Export to CSV

2. CRUD Operations
   - Create new records
   - Edit existing data
   - Delete with confirmation
   - Form validation

## Technical Implementation
- Use React with TypeScript
- State management (React Query or Zustand)
- Chart library (Recharts or Chart.js)
- Table component with sorting/filtering
- Responsive design for mobile
- Dark mode support
- Loading states and error handling

## Features
- Role-based access control
- Real-time data updates (optional)
- Customizable dashboard widgets
- Export functionality
- Notification system

Provide complete, production-ready code with proper TypeScript types and error handling.',
    true,
    true,
    'code',
    (SELECT user_id FROM public.profiles LIMIT 1)
  ),

  -- Content Writing Templates
  (
    'Blog Post Writer Pro',
    'Create SEO-optimized, engaging blog posts with proper structure',
    'Writing',
    'You are a professional content writer and SEO specialist.

Write a comprehensive blog post on: [TOPIC]

## Target Audience
[Describe your target audience]

## Article Structure

### 1. SEO-Optimized Title
- Include primary keyword
- 50-60 characters
- Compelling and click-worthy
- Number or power word if applicable

### 2. Meta Description
- 150-160 characters
- Include primary keyword
- Clear value proposition
- Call-to-action

### 3. Introduction (100-150 words)
- Hook to grab attention
- Address reader''s pain point
- Promise what they''ll learn
- Include primary keyword naturally

### 4. Main Content (1500-2000 words)
Organized with H2 and H3 subheadings:
- 5-7 main sections
- Short paragraphs (2-3 sentences)
- Bullet points for easy scanning
- Include relevant keywords naturally
- Add internal linking opportunities
- Suggest image/infographic placements

### 5. Actionable Takeaways
- 3-5 key points to remember
- Practical steps readers can implement
- Quick wins they can achieve

### 6. Conclusion (100-150 words)
- Summarize main points
- Reinforce value delivered
- Strong call-to-action
- Encourage comments/sharing

## SEO Requirements
- Primary keyword density: 1-2%
- Include LSI keywords
- Optimize for featured snippet
- Add FAQ section if relevant
- Suggest alt text for images

## Tone & Style
- [Professional/Conversational/Educational]
- Active voice
- Conversational but authoritative
- Include examples and case studies
- Use storytelling where appropriate

Provide the complete article ready for publishing.',
    true,
    true,
    'text',
    (SELECT user_id FROM public.profiles LIMIT 1)
  ),

  (
    'Social Media Campaign Creator',
    'Generate complete social media campaigns across platforms',
    'Marketing',
    'You are a professional social media strategist and content creator.

Create a comprehensive social media campaign for: [PRODUCT/SERVICE/EVENT]

## Campaign Overview
- Campaign Goal: [Awareness/Engagement/Conversion]
- Duration: [Timeline]
- Target Audience: [Demographics, interests, behaviors]
- Key Message: [Main theme]
- Campaign Hashtag: [Create unique, memorable hashtag]

## Platform-Specific Content

### Instagram (10 posts)
For each post provide:
1. Caption (2200 char max)
   - Hook in first line
   - Value/story in body
   - Call-to-action
   - 10-15 relevant hashtags
   - Emojis for engagement
2. Image description/concept
3. Best posting time
4. Story suggestions (3 per post)

### LinkedIn (5 posts)
For each post provide:
1. Professional copy (1300 char)
2. Thought leadership angle
3. Industry insights
4. Engagement question
5. Relevant hashtags (3-5)

### Twitter/X (15 tweets)
1. Thread starters (3 threads of 5-7 tweets)
2. Standalone tweets
3. Engagement tweets (polls, questions)
4. Quote-worthy snippets
5. Visual tweet suggestions

### Facebook (7 posts)
1. Longer-form content
2. Community building posts
3. User-generated content ideas
4. Event posts if applicable
5. Share-worthy content

## Content Calendar
- Organized week-by-week schedule
- Optimal posting times per platform
- Content mix (80/20 rule: value/promotion)
- Engagement strategy

## Engagement Strategy
- Comment response templates
- Community management guidelines
- User-generated content campaign
- Influencer outreach plan

## Metrics to Track
- Engagement rate per platform
- Reach and impressions
- Click-through rate
- Conversion tracking
- Hashtag performance

Provide all content in an organized, ready-to-schedule format.',
    true,
    true,
    'text',
    (SELECT user_id FROM public.profiles LIMIT 1)
  ),

  (
    'Email Marketing Sequence',
    'Create high-converting email sequences for any funnel',
    'Marketing',
    'You are a professional email marketing copywriter and conversion specialist.

Create a complete email marketing sequence for: [PRODUCT/SERVICE/COURSE]

## Sequence Overview
- Goal: [Welcome/Nurture/Sales/Re-engagement]
- Number of emails: [Typically 5-7]
- Timeline: [Days between emails]
- Target audience: [Description]

## For Each Email Provide:

### Email 1: Welcome/Introduction
**Subject Line** (3 options A/B test):
- Option A: [Subject]
- Option B: [Subject]  
- Option C: [Subject]

**Preview Text**: [First line that appears in inbox]

**Email Body**:
- Warm welcome
- Set expectations
- Immediate value delivery
- Call-to-action

**P.S.**: [Additional hook or value]

### Email 2: Value/Education
**Subject Line** (3 options):
**Email Body**:
- Address specific pain point
- Provide actionable solution
- Share case study/testimonial
- Soft CTA to product

### Email 3: Social Proof
**Subject Line** (3 options):
**Email Body**:
- Customer success stories
- Specific results/transformations
- Overcome objections
- Stronger CTA

### Email 4: Value Stack
**Subject Line** (3 options):
**Email Body**:
- Break down offer components
- Emphasize unique value
- Limited time element (if applicable)
- Direct CTA

### Email 5: Urgency/Final Call
**Subject Line** (3 options):
**Email Body**:
- Last chance messaging
- Remind of transformation
- Risk reversal (guarantee)
- Strong, clear CTA

## Technical Specifications
- Mobile-responsive formatting
- Plain text version included
- Personalization tokens marked
- Link tracking setup
- Unsubscribe compliant

## A/B Testing Recommendations
- Which subject lines to test
- CTA button copy variations
- Sending time tests

## Metrics to Track
- Open rates by email
- Click-through rates
- Conversion rate
- Unsubscribe rate
- Revenue per email

Provide all emails ready to load into email platform.',
    true,
    true,
    'text',
    (SELECT user_id FROM public.profiles LIMIT 1)
  ),

  -- Product/Business Templates
  (
    'Product Requirements Document',
    'Create comprehensive PRDs for new features or products',
    'Product',
    'You are a professional product manager with expertise in writing clear PRDs.

Create a Product Requirements Document for: [PRODUCT/FEATURE NAME]

## 1. Executive Summary
- One-paragraph overview
- Key objectives
- Success metrics
- Timeline

## 2. Background & Context
- Problem statement
- Why now?
- Market opportunity
- User research findings
- Competitive analysis

## 3. Goals & Objectives
**Business Goals**:
- Objective 1 (with metric)
- Objective 2 (with metric)
- Objective 3 (with metric)

**User Goals**:
- Goal 1
- Goal 2
- Goal 3

## 4. User Personas
For each persona include:
- Name and demographic
- Goals and motivations
- Pain points
- How this product helps them

## 5. Use Cases & User Stories
Format: "As a [user], I want [action] so that [benefit]"
- Write 10-15 user stories
- Include acceptance criteria for each
- Priority level (P0/P1/P2)

## 6. Functional Requirements
**Core Features** (Must Have):
- Feature 1: [Detailed description]
- Feature 2: [Detailed description]
- Feature 3: [Detailed description]

**Secondary Features** (Nice to Have):
- Feature 1
- Feature 2

## 7. Non-Functional Requirements
- Performance (load time, response time)
- Security requirements
- Scalability needs
- Accessibility standards
- Browser/device support

## 8. User Experience
- User flow diagrams (describe)
- Wireframe descriptions
- Key interactions
- Error states
- Loading states

## 9. Technical Considerations
- Architecture overview
- Data models
- API requirements
- Third-party integrations
- Security considerations

## 10. Success Metrics
**Primary Metrics**:
- Metric 1: [Current baseline → Target]
- Metric 2: [Current baseline → Target]

**Secondary Metrics**:
- Supporting metrics

## 11. Timeline & Milestones
- Phase 1: [Date range] - [Deliverables]
- Phase 2: [Date range] - [Deliverables]
- Phase 3: [Date range] - [Deliverables]
- Launch: [Target date]

## 12. Dependencies & Risks
**Dependencies**:
- Team/resource dependencies
- Technical dependencies
- External dependencies

**Risks**:
- Risk 1: [Description] - Mitigation
- Risk 2: [Description] - Mitigation

## 13. Open Questions
- Question 1
- Question 2
- Question 3

Provide a complete, stakeholder-ready PRD.',
    true,
    true,
    'text',
    (SELECT user_id FROM public.profiles LIMIT 1)
  ),

  (
    'UX Research Plan',
    'Design comprehensive user research studies',
    'Design',
    'You are a professional UX researcher with expertise in qualitative and quantitative methods.

Create a UX Research Plan for: [PRODUCT/FEATURE]

## 1. Research Overview
**Research Goals**:
- Primary goal
- Secondary goals
- What decisions will this research inform?

**Research Questions**:
1. [Specific question 1]
2. [Specific question 2]
3. [Specific question 3]

**Timeline**: [Start date → End date]
**Budget**: [If applicable]

## 2. Target Participants
**Primary User Group**:
- Demographics
- Psychographics  
- Usage patterns
- Sample size needed

**Secondary User Group** (if applicable):
- Same details as above

**Recruitment Criteria**:
- Must-have characteristics
- Nice-to-have characteristics
- Screening questions

## 3. Research Methodology

### Method 1: User Interviews
- Number of interviews: [8-12 recommended]
- Duration: [45-60 minutes]
- Format: [Remote/In-person]
- Incentive: [$X per participant]

**Interview Guide**:
1. Warm-up questions (5 min)
2. Current behavior questions (15 min)
3. Pain points exploration (15 min)
4. Solution reaction (if showing prototype) (15 min)
5. Closing questions (5 min)

### Method 2: Surveys
- Sample size: [100+ recommended]
- Distribution channels
- Survey questions (15-20 questions)
- Mix of quantitative and qualitative
- Estimated completion time: [10-15 minutes]

### Method 3: Usability Testing
- Number of participants: [5-8 per iteration]
- Tasks to test (5-7 tasks)
- Success metrics for each task
- Scenarios to present

## 4. Data Collection Plan
**What We''ll Measure**:
- Task completion rates
- Time on task
- Error rates
- Satisfaction scores (SUS, NPS)
- Qualitative feedback themes

**Tools Needed**:
- Screen recording software
- Survey platform
- Note-taking template
- Consent forms

## 5. Analysis Plan
**Qualitative Analysis**:
- Thematic analysis approach
- Affinity mapping
- Journey mapping

**Quantitative Analysis**:
- Statistical methods
- Benchmarking
- Significance testing

## 6. Deliverables
1. Research findings presentation
2. User journey maps
3. Persona updates
4. Prioritized recommendations
5. Video highlight reel

## 7. Timeline & Milestones
- Week 1: Recruit participants
- Week 2: Conduct research
- Week 3: Analysis
- Week 4: Findings presentation

## 8. Success Criteria
- [What makes this research successful?]
- [How will findings be actionable?]

Provide all necessary research materials and templates.',
    true,
    true,
    'text',
    (SELECT user_id FROM public.profiles LIMIT 1)
  ),

  (
    'Video Script Writer',
    'Create engaging video scripts for YouTube, TikTok, or ads',
    'Content',
    'You are a professional video script writer and content strategist.

Create a video script for: [VIDEO TOPIC/PRODUCT]

## Video Details
- Platform: [YouTube/TikTok/Instagram/Ad]
- Target Length: [X minutes/seconds]
- Target Audience: [Demographics]
- Video Style: [Educational/Entertainment/Sales]
- Tone: [Professional/Casual/Humorous]

## Script Format

**[OPENING - First 3-5 seconds]**
VISUAL: [What viewer sees]
AUDIO/VOICEOVER: [Exact words]
TEXT ON SCREEN: [Any text overlays]

**Hook to grab attention immediately**
- State the benefit/result
- Ask intriguing question
- Make bold statement
- Show transformation

**[INTRODUCTION - 5-10 seconds]**
VISUAL:
AUDIO:
- Brief intro of who you are
- What this video is about
- What viewer will learn/gain

**[MAIN CONTENT - Bulk of video]**

**Point 1**
VISUAL:
AUDIO:
B-ROLL SUGGESTIONS:
TEXT ON SCREEN:

**Point 2**
[Same format]

**Point 3**
[Same format]

**[TRANSITION MOMENTS]**
- Identify 2-3 places for pattern interrupts
- Keep engagement high
- Use music/sound effect suggestions

**[CALL-TO-ACTION - Final 10-15 seconds]**
VISUAL:
AUDIO:
- Clear next step
- Where to click/go
- Benefit of taking action

**[END SCREEN]**
- Suggested next video
- Subscribe animation
- Social media handles

## Production Notes
**Filming Requirements**:
- Camera angles needed
- Lighting suggestions
- Props required
- Location suggestions

**Editing Notes**:
- Cuts and transitions
- Music style
- Sound effects
- Graphic overlays
- Pacing notes

**B-Roll List**:
1. [B-roll clip 1 description]
2. [B-roll clip 2 description]
3. [B-roll clip 3 description]

## SEO & Metadata
**Title Options** (3 variations):
1. [Title with keywords]
2. [Title with intrigue]
3. [Title with numbers]

**Description**:
- First 150 characters (appears before "show more")
- Timestamps for each section
- Links to resources
- Hashtags

**Tags**: [15-20 relevant tags]

**Thumbnail Concept**:
- Main visual element
- Text overlay (3-5 words max)
- Facial expression/emotion
- Color scheme

## Engagement Boosters
**Pattern Interrupts at**:
- [Timestamp]: [What happens]
- [Timestamp]: [What happens]

**Questions for Comments**:
1. [Engagement question 1]
2. [Engagement question 2]

Provide complete, production-ready script with all details.',
    true,
    true,
    'text',
    (SELECT user_id FROM public.profiles LIMIT 1)
  );

-- Make sure the user_id is set to the first available admin user
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the first admin user
  SELECT user_id INTO admin_user_id 
  FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1;
  
  -- Update the templates to use this admin user if found
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.prompt_templates 
    SET user_id = admin_user_id 
    WHERE title IN (
      'Full-Stack Web App Builder',
      'Landing Page Generator',
      'SaaS Dashboard Builder',
      'Blog Post Writer Pro',
      'Social Media Campaign Creator',
      'Email Marketing Sequence',
      'Product Requirements Document',
      'UX Research Plan',
      'Video Script Writer'
    );
  END IF;
END $$;