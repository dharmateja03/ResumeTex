import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'what-is-ats-applicant-tracking-system-explained',
    title: 'What is ATS? Applicant Tracking System Explained for Job Seekers',
    excerpt: 'Learn how Applicant Tracking Systems work, why 75% of resumes never get seen by humans, and how to optimize your resume to pass ATS screening.',
    content: `
# What is ATS? Applicant Tracking System Explained for Job Seekers

If you've ever applied to a job online and never heard back, there's a good chance your resume was filtered out by an **Applicant Tracking System (ATS)** before a human ever saw it. Understanding how ATS works is crucial for modern job seekers.

## What is an Applicant Tracking System?

An ATS is software that companies use to manage their recruitment process. It automatically scans, parses, and ranks resumes based on keywords, formatting, and relevance to the job description. Over 98% of Fortune 500 companies use ATS, and approximately 75% of all resumes are rejected by these systems before reaching a hiring manager.

## How Does ATS Work?

### 1. Resume Parsing
When you submit your resume, the ATS extracts information like:
- Contact details
- Work experience
- Education
- Skills
- Certifications

### 2. Keyword Matching
The system compares your resume content against the job description, looking for:
- Hard skills (Python, AWS, SQL)
- Soft skills (leadership, communication)
- Job titles and roles
- Industry-specific terminology

### 3. Ranking and Filtering
Resumes are scored and ranked. Only top-scoring candidates move forward to human review.

## Common ATS Software

- **Workday** - Used by many Fortune 500 companies
- **Greenhouse** - Popular among tech startups
- **Taleo** - Oracle's enterprise solution
- **iCIMS** - Mid-market favorite
- **Lever** - Modern, collaborative recruiting

## How to Beat the ATS

### Use Standard Formatting
- Stick to common fonts (Arial, Calibri, Times New Roman)
- Avoid tables, columns, and text boxes
- Use standard section headers (Experience, Education, Skills)

### Optimize for Keywords
- Mirror language from the job description
- Include both spelled-out terms and acronyms (Search Engine Optimization / SEO)
- Place important keywords in context, not just lists

### Choose the Right File Format
- PDF or DOCX are generally safe
- Avoid images, graphics, or fancy formatting
- LaTeX-generated PDFs work great when properly structured

### Tailor Every Application
- Customize your resume for each job
- Match your skills section to job requirements
- Use the exact job title when applicable

## The ResumeTx Advantage

Our AI-powered tool analyzes job descriptions and optimizes your LaTeX resume to pass ATS systems while maintaining professional formatting. We preserve your resume's structure while injecting the right keywords in natural contexts.

**Ready to beat the ATS?** Try ResumeTx free - just bring your own API key.
    `,
    author: 'ResumeTx Team',
    date: '2024-12-15',
    readTime: '8 min read',
    category: 'ATS & Job Search',
    tags: ['ATS', 'Resume Tips', 'Job Search', 'Career Advice'],
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800'
  },
  {
    id: '2',
    slug: 'latex-resume-benefits-why-professionals-choose-tex',
    title: 'Why LaTeX Resumes Stand Out: Benefits of Using TeX for Your CV',
    excerpt: 'Discover why software engineers, data scientists, and academics prefer LaTeX for resumes. Learn about version control, typography, and professional formatting.',
    content: `
# Why LaTeX Resumes Stand Out: Benefits of Using TeX for Your CV

While most job seekers use Word or Google Docs, technical professionals increasingly choose **LaTeX** for their resumes. Here's why TeX-based resumes are becoming the gold standard in tech.

## What is LaTeX?

LaTeX (pronounced "Lay-tech" or "Lah-tech") is a typesetting system widely used for technical and scientific documents. Unlike WYSIWYG editors, LaTeX uses markup commands to format text, giving you precise control over every aspect of your document.

## 7 Reasons to Use LaTeX for Your Resume

### 1. Professional Typography
LaTeX produces beautiful, professionally-typeset documents that look better than typical Word documents. The default Computer Modern font family is designed for maximum readability.

### 2. Perfect Consistency
Once you set up your formatting, LaTeX ensures every section, bullet point, and margin is perfectly consistent throughout your document.

### 3. Version Control Friendly
Because LaTeX files are plain text, you can:
- Track changes with Git
- Maintain different versions for different roles
- Collaborate with others
- Never lose your formatting again

### 4. Separation of Content and Style
LaTeX separates your resume content from its presentation. Change your entire resume's look by modifying a few lines of code.

### 5. Mathematical and Technical Content
For engineers, scientists, and academics, LaTeX handles equations, code snippets, and technical notation beautifully.

### 6. PDF Output Quality
LaTeX generates high-quality, searchable PDFs that look identical on every device and printer.

### 7. It Signals Technical Competence
Using LaTeX subtly demonstrates technical skill, attention to detail, and comfort with complex tools - all valuable traits for technical roles.

## Common LaTeX Resume Templates

- **ModernCV** - Clean, professional look
- **AltaCV** - Two-column modern design
- **Awesome-CV** - Popular GitHub template
- **Jake's Resume** - Simple, ATS-friendly

## Getting Started with LaTeX

### Online Editors
- **Overleaf** - Most popular, collaborative
- **ShareLaTeX** - Now merged with Overleaf
- **Papeeria** - Good free alternative

### Local Installation
- **TeX Live** - Cross-platform
- **MiKTeX** - Windows
- **MacTeX** - macOS

## LaTeX + AI: The Best of Both Worlds

ResumeTx combines LaTeX's precision with AI optimization. Our AST parser understands your .tex file's structure, injecting ATS-friendly keywords without breaking your carefully crafted formatting.

**Keep your LaTeX skills, gain ATS optimization.** Try ResumeTx today.
    `,
    author: 'ResumeTx Team',
    date: '2024-12-10',
    readTime: '7 min read',
    category: 'Resume Formats',
    tags: ['LaTeX', 'Resume Formats', 'Technical Resume', 'Software Engineering'],
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800'
  },
  {
    id: '3',
    slug: 'ai-resume-optimization-how-it-works',
    title: 'How AI Resume Optimization Works: Behind the Scenes',
    excerpt: 'Understand the technology behind AI-powered resume optimization. Learn about NLP, keyword extraction, and how modern tools analyze job descriptions.',
    content: `
# How AI Resume Optimization Works: Behind the Scenes

AI is transforming how job seekers create and optimize resumes. But what's actually happening when an AI tool "optimizes" your resume? Let's look under the hood.

## The Problem AI Solves

Traditional resume writing is a guessing game:
- Which keywords matter most?
- How should I phrase my experience?
- Will this pass the ATS?
- Is my resume tailored enough?

AI removes the guesswork by analyzing patterns across millions of job postings and successful resumes.

## How AI Resume Optimization Works

### Step 1: Job Description Analysis

The AI first analyzes the target job description using Natural Language Processing (NLP):

- **Named Entity Recognition** - Identifies skills, tools, certifications
- **Keyword Extraction** - Finds important terms and phrases
- **Semantic Analysis** - Understands context and requirements
- **Priority Ranking** - Determines which requirements matter most

### Step 2: Resume Parsing

Your resume is parsed to extract:
- Work experience and achievements
- Technical skills and tools
- Education and certifications
- Projects and accomplishments

### Step 3: Gap Analysis

The AI compares your resume against the job requirements:
- Missing keywords
- Underemphasized skills
- Formatting issues
- ATS compatibility problems

### Step 4: Intelligent Optimization

Here's where the magic happens:
- **Keyword Injection** - Adding relevant terms naturally
- **Achievement Quantification** - Suggesting metrics and numbers
- **Skill Highlighting** - Prioritizing relevant experience
- **Format Optimization** - Ensuring ATS compatibility

## What Makes ResumeTx Different

### Native LaTeX Understanding
Unlike tools that treat your resume as plain text, ResumeTx parses the **Abstract Syntax Tree** of your .tex file. This means:
- Your formatting stays intact
- Commands aren't broken
- Compilation still works perfectly

### BYO API Key Model
You use your own OpenAI or Anthropic API key, meaning:
- No monthly subscription
- Pay only for what you use
- Your data stays private
- Free forever access

### One-Click Application Suite
Generate optimized versions of:
- Resume
- Cover Letter
- Cold Email

All tailored to the specific job.

## The Future of AI Resumes

AI resume tools are evolving rapidly:
- Real-time optimization as you type
- Interview preparation based on resume content
- Salary negotiation insights
- Career path recommendations

**Ready to try AI-powered optimization?** Start with ResumeTx - bring your own API key, get unlimited optimizations.
    `,
    author: 'ResumeTx Team',
    date: '2024-12-05',
    readTime: '9 min read',
    category: 'AI & Technology',
    tags: ['AI', 'Resume Optimization', 'NLP', 'Machine Learning', 'Technology'],
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'
  },
  {
    id: '4',
    slug: 'software-engineer-resume-guide-2024',
    title: 'Software Engineer Resume Guide 2024: Tips, Examples & Templates',
    excerpt: 'Complete guide to writing a software engineer resume that lands interviews. Includes ATS tips, project showcasing, and what tech recruiters actually look for.',
    content: `
# Software Engineer Resume Guide 2024: Tips, Examples & Templates

The tech job market is competitive. Here's how to write a software engineer resume that stands out to both ATS systems and human recruiters.

## What Recruiters Look For

Tech recruiters spend an average of **7.4 seconds** on initial resume screening. They're looking for:

1. **Relevant tech stack** - Do your skills match the job?
2. **Impact metrics** - What did you accomplish?
3. **Company recognition** - FAANG, unicorns, or relevant industry
4. **Education signals** - CS degree, bootcamp, or equivalent
5. **Project complexity** - Can you handle their challenges?

## Essential Resume Sections

### Contact Information
\`\`\`
John Developer
San Francisco, CA | john@email.com
LinkedIn: linkedin.com/in/johndev
GitHub: github.com/johndev
Portfolio: johndev.io
\`\`\`

### Professional Summary (Optional but Recommended)
\`\`\`
Senior Software Engineer with 5+ years building scalable
distributed systems. Led migration of monolith to microservices
serving 10M+ users. Expert in Go, Kubernetes, and AWS.
\`\`\`

### Technical Skills
Organize by category:
- **Languages:** Python, JavaScript, Go, Rust
- **Frameworks:** React, Node.js, Django, FastAPI
- **Cloud/DevOps:** AWS, GCP, Kubernetes, Docker, Terraform
- **Databases:** PostgreSQL, MongoDB, Redis, Elasticsearch
- **Tools:** Git, CI/CD, Datadog, PagerDuty

### Work Experience
Use the **STAR method** with metrics:

\`\`\`
Senior Software Engineer | TechCorp | 2021-Present
• Architected event-driven microservices handling 50K req/sec
• Reduced API latency by 40% through Redis caching strategy
• Led team of 4 engineers to deliver payment system on schedule
• Mentored 3 junior developers through code reviews and pairing
\`\`\`

### Projects (Critical for Junior/Mid-Level)
\`\`\`
Open Source Contributions
• Contributed authentication module to [Project] (2K+ stars)
• Fixed critical memory leak in [Library], merged to main

Personal Projects
• Built real-time chat app with WebSocket, 1K active users
• Created CLI tool for AWS cost optimization, 500+ downloads
\`\`\`

## ATS Optimization Tips

### Keywords to Include
Based on job description analysis, always include:
- Programming languages mentioned
- Frameworks and tools specified
- Methodologies (Agile, Scrum, TDD)
- Soft skills (collaboration, mentorship)

### Formatting Rules
- Use standard section headers
- Avoid tables and columns
- Stick to 1-2 pages
- Save as PDF (LaTeX recommended)

## Common Mistakes to Avoid

1. **No metrics** - Always quantify impact
2. **Generic descriptions** - Tailor for each role
3. **Tech skill dumping** - Only relevant skills
4. **Outdated technologies** - Remove jQuery unless relevant
5. **Spelling errors** - Use spell check, always

## Resume vs. Job Level

### Junior (0-2 years)
- Focus on projects and education
- Include relevant coursework
- Highlight learning velocity

### Mid-Level (2-5 years)
- Emphasize growing responsibility
- Show progression and promotions
- Include team leadership moments

### Senior (5+ years)
- Focus on architecture decisions
- Show mentorship and leadership
- Highlight cross-team impact

## Use AI to Your Advantage

ResumeTx analyzes job descriptions and optimizes your LaTeX resume with the exact keywords recruiters are searching for - while keeping your formatting perfect.

**Try it free** - bring your own API key.
    `,
    author: 'ResumeTx Team',
    date: '2024-11-28',
    readTime: '12 min read',
    category: 'Career Guides',
    tags: ['Software Engineer', 'Resume Guide', 'Tech Career', 'Programming', 'FAANG'],
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800'
  },
  {
    id: '5',
    slug: 'data-scientist-resume-tips',
    title: 'Data Scientist Resume: Essential Skills, Projects & Keywords',
    excerpt: 'Craft a data scientist resume that showcases your ML expertise. Learn which skills to highlight, how to present projects, and keywords that pass ATS.',
    content: `
# Data Scientist Resume: Essential Skills, Projects & Keywords

Data science is one of the most competitive fields in tech. Here's how to build a resume that showcases your unique blend of statistics, programming, and domain expertise.

## What Makes Data Science Resumes Different

Data scientist roles vary wildly:
- ML Engineer (production systems)
- Research Scientist (R&D, papers)
- Analytics DS (business insights)
- Applied Scientist (product ML)

Your resume should clearly signal which type you are.

## Essential Technical Skills

### Programming Languages
- **Python** (pandas, NumPy, scikit-learn)
- **R** (for statistics-heavy roles)
- **SQL** (must-have for all roles)
- **Scala/Java** (for big data roles)

### Machine Learning
- Supervised Learning (regression, classification)
- Unsupervised Learning (clustering, dimensionality reduction)
- Deep Learning (PyTorch, TensorFlow)
- NLP (transformers, LLMs)
- Computer Vision (CNNs, YOLO)

### Tools & Platforms
- **MLOps:** MLflow, Kubeflow, SageMaker
- **Data Processing:** Spark, Airflow, dbt
- **Visualization:** Tableau, Matplotlib, Plotly
- **Cloud:** AWS, GCP, Azure ML

### Statistics
- Hypothesis testing
- A/B testing
- Bayesian methods
- Causal inference

## How to Present Projects

### Kaggle Competitions
\`\`\`
Kaggle Competition: [Competition Name]
• Achieved top 5% (silver medal) among 3,000+ participants
• Implemented ensemble of XGBoost and neural network models
• Feature engineering improved AUC from 0.82 to 0.91
\`\`\`

### Research & Publications
\`\`\`
"Efficient Transformer Architecture for Time Series" | NeurIPS 2024
• Proposed novel attention mechanism reducing inference time 40%
• Open-sourced implementation with 500+ GitHub stars
\`\`\`

### Industry Projects
\`\`\`
Recommendation System | E-commerce Company
• Built personalized recommendation engine serving 5M users
• Increased click-through rate by 25% vs. baseline
• Deployed with real-time inference using AWS SageMaker
\`\`\`

## Keywords That Matter

### For ML Engineers
- Model deployment, MLOps
- Production ML, scaling
- Feature stores, model monitoring
- A/B testing, experimentation

### For Research Scientists
- Novel architectures, SOTA
- Publications, conferences
- Benchmark improvements
- Open source contributions

### For Analytics DS
- Business impact, stakeholders
- Dashboards, reporting
- Product metrics, KPIs
- Cross-functional collaboration

## Resume Formatting Tips

1. **Lead with impact** - Start bullets with metrics
2. **Show technical depth** - Specific tools and techniques
3. **Balance skills** - Both breadth and depth
4. **Include links** - GitHub, Kaggle, papers

## Common Mistakes

- Listing every library you've touched
- No business impact, just technical details
- Missing production/scale experience
- Generic "data analysis" descriptions

## ATS Keywords for Data Scientists

Always include (if applicable):
- Machine Learning, Deep Learning
- Python, SQL, TensorFlow, PyTorch
- Statistical Analysis, A/B Testing
- Data Pipeline, ETL, Big Data
- Business Intelligence, Visualization

ResumeTx analyzes data science job descriptions and ensures your resume contains the right mix of technical and business keywords.

**Optimize your DS resume** - try ResumeTx free.
    `,
    author: 'ResumeTx Team',
    date: '2024-11-20',
    readTime: '10 min read',
    category: 'Career Guides',
    tags: ['Data Science', 'Machine Learning', 'Resume Tips', 'Career', 'Python'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'
  },
  {
    id: '6',
    slug: 'cover-letter-guide-ai-tips',
    title: 'How to Write a Cover Letter in 2024: AI-Powered Tips & Templates',
    excerpt: 'Master the art of cover letter writing with modern techniques. Learn what to include, how to personalize at scale, and when you actually need one.',
    content: `
# How to Write a Cover Letter in 2024: AI-Powered Tips & Templates

Do cover letters still matter? The short answer: **yes, but differently than before.** Here's how to write cover letters that get read in the age of AI.

## Do You Need a Cover Letter?

### When Cover Letters Matter
- **Small companies** - More likely to be read
- **Non-technical roles** - Communication is key
- **Career changers** - Explain your pivot
- **Referrals** - Personalize the introduction
- **Dream companies** - Show genuine interest

### When They're Optional
- **Large tech companies** - Often not read
- **High-volume applications** - Focus on resume
- **When explicitly stated** - "Cover letter optional"

## Cover Letter Structure

### Opening (2-3 sentences)
Hook them immediately:
- Why this specific company?
- What makes you uniquely qualified?
- Reference a mutual connection if applicable

**Bad:** "I am writing to apply for the Software Engineer position."

**Good:** "After using [Product] to solve [problem] at my current role, I'm excited to help build the next version as a Software Engineer."

### Body (2-3 paragraphs)

**Paragraph 1: Your Best Achievement**
\`\`\`
At TechCorp, I led the migration from a monolithic architecture
to microservices, reducing deployment time from 2 hours to 15
minutes. This required coordinating across 4 teams and making
difficult trade-offs - exactly the kind of challenge I see in
your [specific project/initiative].
\`\`\`

**Paragraph 2: Why This Company**
\`\`\`
Your recent blog post on [topic] resonated with my experience
building [relevant project]. I'm particularly drawn to how your
team approaches [specific aspect], which aligns with my belief
that [relevant philosophy].
\`\`\`

### Closing (2-3 sentences)
Clear call to action:
\`\`\`
I'd love to discuss how my experience with [skill] could
contribute to [team/project]. I'm available for a conversation
at your convenience.
\`\`\`

## AI-Powered Cover Letter Tips

### What AI Can Help With
- **Generating first drafts** - Start from job description
- **Matching keywords** - Align with requirements
- **Tone adjustments** - Formal vs. casual
- **Proofreading** - Grammar and clarity

### What You Must Personalize
- Specific company research
- Personal anecdotes and stories
- Genuine enthusiasm (AI can't fake this)
- Unique insights and perspectives

## Common Cover Letter Mistakes

1. **Too generic** - Could apply to any company
2. **Restating resume** - Add new information
3. **Too long** - Keep under 400 words
4. **No research** - Mention something specific
5. **Wrong tone** - Match company culture

## Cover Letter Keywords

Include these naturally:
- Company values from their website
- Specific products or initiatives
- Technologies from job description
- Team or department name
- Recent company news or achievements

## Templates That Work

### Tech Startup
Casual, enthusiastic, product-focused

### Enterprise/Corporate
Professional, achievement-focused, formal

### Startup to Enterprise (or vice versa)
Address the transition directly

## The ResumeTx Advantage

Our AI generates tailored cover letters alongside your optimized resume, both matched to the specific job description. One click = resume + cover letter + cold email.

**Generate your cover letter** - try ResumeTx free.
    `,
    author: 'ResumeTx Team',
    date: '2024-11-15',
    readTime: '8 min read',
    category: 'Application Materials',
    tags: ['Cover Letter', 'Job Application', 'Career Tips', 'Writing', 'AI Tools'],
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800'
  },
  {
    id: '7',
    slug: 'cold-email-for-jobs-templates',
    title: 'Cold Email for Jobs: Templates & Strategies That Get Responses',
    excerpt: 'Learn how to write cold emails that land interviews. Includes proven templates, subject lines, and follow-up strategies for job seekers.',
    content: `
# Cold Email for Jobs: Templates & Strategies That Get Responses

The hidden job market is real. Up to **70% of jobs are never posted publicly**. Cold emailing is your key to accessing these opportunities.

## Why Cold Emails Work

- Bypass the ATS entirely
- Reach decision-makers directly
- Less competition than job boards
- Show initiative and hustle
- Create opportunities that don't exist yet

## The Anatomy of a Great Cold Email

### Subject Line (Most Important)
Your email won't get opened without a compelling subject:

**What Works:**
- "Quick question about [team/project]"
- "[Mutual connection] suggested I reach out"
- "Loved your talk on [topic] - quick question"
- "[Specific skill] engineer interested in [company]"

**What Doesn't:**
- "Job Inquiry"
- "Looking for opportunities"
- "My Resume Attached"

### Opening Line
You have 5 seconds to hook them:

**Good:**
\`\`\`
"Your blog post on distributed systems at scale changed
how I approach caching at my current company."
\`\`\`

**Bad:**
\`\`\`
"I hope this email finds you well. My name is John and
I am a software engineer looking for new opportunities."
\`\`\`

### The Ask (Be Specific)
Don't ask for a job directly:

\`\`\`
"I'd love 15 minutes to learn how your team approaches
[specific challenge]. Would you be open to a brief call
next week?"
\`\`\`

### Your Credibility (Brief)
\`\`\`
"Quick context: I'm a senior engineer at [Company], where
I led our migration to Kubernetes, reducing deployment
time by 80%."
\`\`\`

## Cold Email Templates

### Template 1: The Admirer
\`\`\`
Subject: Your [blog/talk/project] inspired my approach to [topic]

Hi [Name],

Your [specific work] on [topic] has been incredibly helpful -
I applied [specific insight] to [your project] and saw [result].

I'm currently a [role] at [company], focused on [relevant area].
I'm exploring opportunities where I can work on similar challenges
at scale.

Would you have 15 minutes to chat about how [their team]
approaches [specific problem]?

Best,
[Your name]
\`\`\`

### Template 2: The Connection Leverage
\`\`\`
Subject: [Mutual connection] suggested I reach out

Hi [Name],

[Mutual connection] mentioned you're the person to talk to about
[area/team] at [company]. They spoke highly of the work you're
doing on [specific project].

I'm a [role] with experience in [relevant skills], currently
exploring my next opportunity. I'd love to learn more about
[specific aspect of their work].

Do you have 15 minutes for a quick call this week?

Best,
[Your name]
\`\`\`

### Template 3: The Value Add
\`\`\`
Subject: Idea for [company's specific challenge]

Hi [Name],

I noticed [company] recently [specific observation - feature launch,
blog post, news]. I've been working on a similar problem at [company]
and had some thoughts that might be helpful.

[1-2 sentence insight or idea]

Would you be open to a quick chat? I'm also exploring engineering
roles and would love to learn more about [team].

Best,
[Your name]
\`\`\`

## Follow-Up Strategy

### Timeline
- **Day 0:** Initial email
- **Day 3-4:** First follow-up
- **Day 10:** Second follow-up
- **Day 21:** Final follow-up (different angle)

### Follow-Up Template
\`\`\`
Subject: Re: [Original subject]

Hi [Name],

Just floating this to the top of your inbox - I know things
get busy. Still keen to chat about [topic] if you have time.

[Optional: Add new value - article, insight, relevant news]

Best,
[Your name]
\`\`\`

## Finding Who to Email

- LinkedIn (recruiters, hiring managers, engineers)
- Company blog (authors)
- GitHub (active contributors)
- Conference speakers
- Twitter/X profiles

## Common Mistakes

1. **Too long** - Keep under 150 words
2. **No research** - Mention something specific
3. **Asking for too much** - Start with a conversation
4. **No follow-up** - Most responses come after follow-ups
5. **Generic templates** - Personalize every email

## AI-Powered Cold Emails

ResumeTx generates personalized cold emails tailored to each job, using the same job description analysis that optimizes your resume.

**Generate cold emails** - try ResumeTx free.
    `,
    author: 'ResumeTx Team',
    date: '2024-11-10',
    readTime: '10 min read',
    category: 'Job Search Strategy',
    tags: ['Cold Email', 'Networking', 'Job Search', 'Career Strategy', 'Templates'],
    image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800'
  },
  {
    id: '8',
    slug: 'resume-keywords-optimization-guide',
    title: 'Resume Keywords: The Complete Guide to ATS Optimization',
    excerpt: 'Master resume keyword optimization with this comprehensive guide. Learn how to extract keywords from job descriptions and place them strategically.',
    content: `
# Resume Keywords: The Complete Guide to ATS Optimization

Keywords are the bridge between your resume and interview invitations. Here's everything you need to know about finding and using the right keywords.

## Why Keywords Matter

### The ATS Reality
- 75% of resumes are rejected before human review
- ATS systems scan for specific keywords
- Keyword match rate directly impacts ranking
- Both exact matches and semantic matches count

### The Human Factor
After passing ATS, recruiters scan for:
- Recognizable skills and tools
- Industry-standard terminology
- Role-specific language

## Types of Resume Keywords

### Hard Skills
Technical abilities that can be measured:
- Programming languages (Python, JavaScript, Go)
- Tools and platforms (AWS, Kubernetes, Docker)
- Frameworks (React, Django, TensorFlow)
- Certifications (AWS Solutions Architect, PMP)

### Soft Skills
Interpersonal and transferable abilities:
- Leadership
- Communication
- Problem-solving
- Collaboration
- Project management

### Industry Terms
Sector-specific vocabulary:
- Agile, Scrum, Sprint
- CI/CD, DevOps
- Microservices, REST API
- Machine Learning, NLP

### Action Verbs
Power words that convey impact:
- Architected, Built, Developed
- Led, Managed, Coordinated
- Optimized, Improved, Enhanced
- Launched, Delivered, Shipped

## How to Find the Right Keywords

### Step 1: Analyze the Job Description

Extract every requirement:
\`\`\`
Job Description Text:
"We're looking for a Senior Software Engineer with 5+ years
of experience building scalable distributed systems. You'll
work with Python, Go, and Kubernetes to build our next-gen
data platform."

Keywords Extracted:
- Senior Software Engineer
- 5+ years experience
- Scalable distributed systems
- Python, Go, Kubernetes
- Data platform
\`\`\`

### Step 2: Research the Company

Check their:
- Engineering blog (technical terms they use)
- Job postings (common requirements across roles)
- LinkedIn employees (skills listed)
- Tech talks and presentations

### Step 3: Industry Research

Look at similar jobs at:
- Competitor companies
- Industry job boards
- Professional associations

## Strategic Keyword Placement

### Skills Section
List relevant technical skills prominently:
\`\`\`
Technical Skills:
Languages: Python, Go, JavaScript, SQL
Cloud: AWS (EC2, Lambda, S3), Kubernetes, Docker
Data: PostgreSQL, Redis, Kafka, Spark
Tools: Git, Jenkins, Terraform, Datadog
\`\`\`

### Work Experience
Weave keywords naturally into achievements:
\`\`\`
• Architected distributed data pipeline using Python and Kafka,
  processing 1M events/day with 99.9% uptime
• Led team of 4 engineers to migrate monolith to Kubernetes-based
  microservices, reducing deployment time by 80%
\`\`\`

### Summary/Objective
Include high-priority keywords upfront:
\`\`\`
Senior Software Engineer with 6 years building scalable
distributed systems. Expert in Python, Go, and Kubernetes
with a track record of leading technical initiatives.
\`\`\`

## Keyword Density Tips

- **Don't keyword stuff** - Must read naturally
- **Context matters** - Use keywords in meaningful sentences
- **Variety helps** - Use synonyms (ML/Machine Learning)
- **Match format** - Both "JavaScript" and "JS" if in JD

## Common Keyword Mistakes

1. **Listing irrelevant skills** - Only include what's asked
2. **Missing obvious terms** - Include exact phrases from JD
3. **No context** - Keywords need surrounding sentences
4. **Outdated terms** - "Web 2.0" is dated
5. **Acronym only** - Include both "API" and "Application Programming Interface"

## AI-Powered Keyword Optimization

ResumeTx automatically:
- Extracts keywords from job descriptions
- Identifies gaps in your resume
- Suggests natural keyword placement
- Maintains ATS compatibility

**Optimize your keywords** - try ResumeTx free.
    `,
    author: 'ResumeTx Team',
    date: '2024-11-05',
    readTime: '11 min read',
    category: 'ATS & Job Search',
    tags: ['Keywords', 'ATS', 'Resume Optimization', 'Job Search', 'SEO'],
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800'
  },
  {
    id: '9',
    slug: 'resume-formatting-best-practices',
    title: 'Resume Formatting: Design Tips for ATS and Human Readers',
    excerpt: 'Learn how to format your resume for both ATS systems and human recruiters. Covers fonts, spacing, sections, and file formats.',
    content: `
# Resume Formatting: Design Tips for ATS and Human Readers

Good formatting makes your resume easy to scan for both algorithms and humans. Here's how to strike the perfect balance.

## The Dual Audience Problem

Your resume must satisfy two very different readers:

### ATS Systems Want:
- Simple, parseable structure
- Standard section headers
- No complex formatting
- Machine-readable text

### Human Recruiters Want:
- Visual hierarchy
- Easy scanning
- Professional appearance
- Memorable design

## Layout Principles

### One Column vs. Two Columns

**One Column (Recommended for ATS)**
- Maximum compatibility
- Clear reading order
- Works with all ATS systems

**Two Columns (Use Carefully)**
- More visually appealing
- Can confuse some ATS systems
- Best for creative roles

### Margins and Spacing
- **Margins:** 0.5" to 1" on all sides
- **Line spacing:** 1.0 to 1.15
- **Section spacing:** 12-16pt between sections
- **Bullet spacing:** 6-8pt between items

## Section Order

### For Experienced Professionals
1. Contact Information
2. Professional Summary
3. Work Experience
4. Skills
5. Education
6. Certifications (if relevant)

### For Recent Graduates
1. Contact Information
2. Education
3. Projects
4. Skills
5. Work Experience (internships)
6. Activities

## Font Selection

### ATS-Safe Fonts
- Arial
- Calibri
- Garamond
- Georgia
- Helvetica
- Times New Roman
- Verdana

### Avoid
- Decorative fonts
- Custom fonts (may not render)
- Very thin weights

### Font Sizes
- **Name:** 18-24pt
- **Section headers:** 12-14pt
- **Body text:** 10-12pt
- **Minimum:** Never go below 10pt

## Section Headers

### Use Standard Headers
ATS systems recognize these:
- Work Experience / Professional Experience
- Education
- Skills / Technical Skills
- Projects
- Certifications

### Avoid Creative Headers
Don't use:
- "Where I've Made Impact"
- "My Journey"
- "The Technical Stuff"

## Visual Elements

### Safe to Use
- Bold text (for emphasis)
- Italic text (sparingly)
- Standard bullet points
- Horizontal lines (simple)
- Consistent spacing

### Avoid
- Tables (ATS can't parse them)
- Text boxes
- Headers/footers (often skipped)
- Images or graphics
- Multiple columns (risky)
- Icons (parsed as gibberish)

## File Formats

### PDF (Recommended)
- Preserves formatting exactly
- LaTeX-generated PDFs work great
- Universal compatibility

### DOCX
- Some ATS prefer it
- Easier to parse
- Formatting may shift

### Never Use
- .doc (outdated)
- .pages (not universal)
- Images or scanned PDFs

## LaTeX Formatting Tips

If you use LaTeX:
- Avoid complex packages
- Test PDF parsing (copy-paste test)
- Use standard document classes
- Keep custom commands simple

\`\`\`latex
% Good: Simple, parseable
\\section{Experience}
\\textbf{Company Name} \\hfill Date \\\\
\\textit{Job Title}
\\begin{itemize}
  \\item Achievement with metrics
\\end{itemize}
\`\`\`

## The 6-Second Test

Recruiters spend ~6 seconds on initial scan. Ensure:
- Name is prominent
- Current role is visible
- Key skills stand out
- Dates are easy to find
- White space aids scanning

## Formatting Checklist

- [ ] Consistent font throughout
- [ ] Clear section headers
- [ ] Aligned dates
- [ ] Proper bullet formatting
- [ ] No spelling errors
- [ ] PDF renders correctly
- [ ] Copy-paste test passes

## The ResumeTx Advantage

Our AI preserves your LaTeX formatting while optimizing content. Your carefully crafted design stays intact while keywords are strategically injected.

**Optimize without breaking formatting** - try ResumeTx free.
    `,
    author: 'ResumeTx Team',
    date: '2024-10-30',
    readTime: '9 min read',
    category: 'Resume Formats',
    tags: ['Formatting', 'Design', 'ATS', 'Resume Tips', 'PDF'],
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800'
  },
  {
    id: '10',
    slug: 'career-change-resume-guide',
    title: 'Career Change Resume: How to Pivot Successfully',
    excerpt: 'Transitioning to a new field? Learn how to write a resume that highlights transferable skills and positions you as a strong candidate despite limited direct experience.',
    content: `
# Career Change Resume: How to Pivot Successfully

Switching careers is challenging but increasingly common. Here's how to write a resume that makes your transition compelling.

## The Career Change Challenge

You're competing against candidates with direct experience. Your resume must:
- Highlight transferable skills
- Show relevant learning/projects
- Explain the "why" behind your pivot
- Demonstrate commitment to the new field

## Common Career Transitions

### Into Tech
- Teacher → UX Designer
- Finance → Data Analyst
- Marketing → Product Manager
- Military → Project Manager
- Sales → Customer Success

### Within Tech
- Frontend → Full Stack
- Developer → Engineering Manager
- QA → Software Engineer
- IT Support → DevOps

## Resume Strategy

### Lead with Skills, Not Job Titles
Use a functional or combination format:

\`\`\`
RELEVANT SKILLS

Technical Skills
• Python programming (completed 3 projects, 500+ hours)
• Data analysis using pandas, SQL, and Tableau
• Machine learning fundamentals (Andrew Ng course)

Transferable Skills
• Analytical problem-solving from 5 years in finance
• Communication skills from client-facing roles
• Project management and stakeholder coordination
\`\`\`

### Reframe Your Experience

**Before (Finance Analyst):**
\`\`\`
• Created quarterly financial reports
• Analyzed budget variances
• Managed Excel spreadsheets
\`\`\`

**After (Pivoting to Data Science):**
\`\`\`
• Built automated reporting pipeline using Python, reducing
  report generation time by 60%
• Performed statistical analysis on budget data to identify
  trends and anomalies
• Developed advanced Excel models with VBA macros, processing
  10K+ rows of data
\`\`\`

### Add a Transition Section

Include relevant items before work experience:
\`\`\`
RELEVANT TRAINING & PROJECTS

Certifications
• Google Data Analytics Professional Certificate (2024)
• AWS Cloud Practitioner (2024)

Projects
• Personal Finance Dashboard: Built end-to-end data pipeline
  with Python, PostgreSQL, and Tableau
• Stock Analysis Tool: Created ML model predicting price
  movements with 65% accuracy
\`\`\`

## Transferable Skills by Field

### Moving into Software Engineering
From any field, highlight:
- Problem-solving and debugging
- Attention to detail
- Project management
- Technical documentation
- Collaboration and communication

### Moving into Data Science
Highlight:
- Analytical thinking
- Statistical knowledge
- Presentation skills
- Business acumen
- Excel/SQL experience

### Moving into Product Management
Highlight:
- Customer interaction
- Cross-functional coordination
- Strategic planning
- Data-driven decision making
- Communication skills

## Cover Letter is Essential

For career changers, the cover letter explains your "why":
\`\`\`
After 5 years analyzing financial data, I realized my favorite
part of the job was building automated tools in Python. I've
spent the past year deepening my skills through [specific
courses/projects], and I'm now ready to make engineering my
full-time focus.
\`\`\`

## Building Credibility

### Quick Wins
- Complete relevant certifications
- Build portfolio projects
- Contribute to open source
- Start a blog/write about learning

### Longer-Term
- Bootcamp or part-time degree
- Freelance/contract work
- Internal transfer at current company
- Volunteer technical work

## Keywords for Career Changers

Include both:
- New field keywords (what you're moving into)
- Transferable keywords (analytical, communication, project management)

## Common Mistakes

1. **Apologizing for lack of experience** - Lead with confidence
2. **Hiding previous career** - Show progression and skills
3. **No evidence of commitment** - Include projects/certifications
4. **Generic objective** - Specific is better
5. **Same old resume** - Complete rewrite needed

## AI Optimization for Career Changers

ResumeTx helps you:
- Identify transferable skills from your experience
- Match new field keywords appropriately
- Balance old experience with new skills
- Create compelling narrative through optimization

**Start your pivot** - try ResumeTx free.
    `,
    author: 'ResumeTx Team',
    date: '2024-10-25',
    readTime: '11 min read',
    category: 'Career Strategy',
    tags: ['Career Change', 'Transferable Skills', 'Career Pivot', 'Resume Tips', 'Career Strategy'],
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
  },
  {
    id: '11',
    slug: 'free-vs-paid-resume-tools-comparison',
    title: 'Free vs Paid Resume Tools: Which Should You Use in 2024?',
    excerpt: 'Compare the best free and paid resume tools. Learn what features matter, hidden costs of "free" tools, and how to maximize value.',
    content: `
# Free vs Paid Resume Tools: Which Should You Use in 2024?

The resume tool market is crowded. Here's an honest comparison to help you choose.

## The Resume Tool Landscape

### Types of Tools

1. **Resume Builders** - Create resumes from scratch
2. **Resume Optimizers** - Improve existing resumes
3. **ATS Checkers** - Analyze ATS compatibility
4. **AI Writers** - Generate content using AI

## "Free" Tools: The Reality

### What Free Usually Means
- **Freemium:** Basic free, features locked
- **Trial:** Free temporarily, then paid
- **Ad-supported:** Free with advertisements
- **Data harvesting:** Your data is the product

### Hidden Costs of Free Tools
- Watermarks on downloads
- Limited exports (1-3 resumes)
- Basic templates only
- No ATS optimization
- Your data sold to recruiters

## Paid Tool Pricing

### Common Pricing Models

**Monthly Subscription:** $10-30/month
- Examples: Jobscan, Resume.io, Novoresume
- Unlimited resumes and downloads
- Advanced features included

**Per-Resume:** $5-20 per download
- Pay for each final document
- Can get expensive with multiple applications

**Annual Plans:** $60-200/year
- Best per-month value
- Requires upfront commitment

### What You Get for Paying
- Unlimited downloads
- ATS optimization
- Premium templates
- AI suggestions
- No watermarks
- Priority support

## Popular Tools Compared

### Resume Builders

| Tool | Free Tier | Paid Price | Best For |
|------|-----------|------------|----------|
| Canva | Limited templates | $13/mo | Visual resumes |
| Resume.io | 1 download | $15/mo | Quick creation |
| NovoResume | Basic template | $20/mo | Modern designs |

### ATS Optimizers

| Tool | Free Tier | Paid Price | Best For |
|------|-----------|------------|----------|
| Jobscan | 5 scans/mo | $50/mo | Enterprise ATS |
| ResyMatch | 2 scans | $9/mo | Budget option |
| **ResumeTx** | **Unlimited*** | **BYO API** | **LaTeX users** |

*With your own OpenAI/Anthropic API key

## The ResumeTx Model: BYO API Key

We're different:
- **Free forever** - No subscription
- **Bring your own API key** - Pay OpenAI/Anthropic directly
- **Unlimited use** - No artificial limits
- **LaTeX native** - Keeps your formatting
- **One-click suite** - Resume + cover letter + cold email

### Cost Comparison

**Traditional Tools:** $20/month = $240/year

**ResumeTx with BYO API:**
- OpenAI GPT-4 Turbo: ~$0.01-0.03 per optimization
- 100 optimizations: ~$1-3 total
- Annual cost: < $50 for heavy users

## How to Choose

### Use Free Tools If:
- You need basic resume creation
- You're applying to < 5 jobs
- Budget is primary concern
- You don't need ATS optimization

### Use Paid Tools If:
- Actively job searching
- Applying to 20+ positions
- Need ATS optimization
- Want professional templates

### Use ResumeTx If:
- You use LaTeX for resumes
- You want to control costs
- You value privacy (BYO key)
- You need the full application suite

## Red Flags in Resume Tools

Watch out for:
- Forced account creation
- Unclear pricing
- Fake "AI" features
- Pressure tactics
- Data selling disclosures
- No way to delete account

## The Bottom Line

- **Most free tools** have hidden costs
- **Subscription tools** make sense for active searchers
- **ResumeTx** offers unlimited use with transparent API costs

**Try the BYO API approach** - ResumeTx is free forever.
    `,
    author: 'ResumeTx Team',
    date: '2024-10-20',
    readTime: '9 min read',
    category: 'Tools & Resources',
    tags: ['Resume Tools', 'Comparison', 'Free Tools', 'Career Resources', 'Job Search'],
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800'
  },
  {
    id: '12',
    slug: 'remote-job-resume-tips',
    title: 'Remote Job Resume Tips: Stand Out to Distributed Companies',
    excerpt: 'Learn how to optimize your resume for remote positions. Includes keywords, skills, and formatting tips specific to distributed work.',
    content: `
# Remote Job Resume Tips: Stand Out to Distributed Companies

Remote work is here to stay. Here's how to optimize your resume specifically for distributed positions.

## Why Remote Resumes Are Different

Remote hiring managers look for:
- **Self-motivation** - Can you work without oversight?
- **Communication** - Written communication is critical
- **Time management** - Async work requires discipline
- **Technical setup** - Are you equipped to work remotely?
- **Remote experience** - Have you done this before?

## Remote-Specific Keywords

### Include These Terms
- Remote work
- Distributed team
- Asynchronous communication
- Self-directed
- Cross-timezone collaboration
- Virtual collaboration
- Home office
- Remote-first

### Tools to Mention
- **Communication:** Slack, Microsoft Teams, Discord
- **Video:** Zoom, Google Meet, Around
- **Project Management:** Asana, Jira, Linear, Notion
- **Documentation:** Confluence, Notion, GitBook
- **Async Video:** Loom, Vidyard

## Highlighting Remote Experience

### If You Have Remote Experience
\`\`\`
Senior Software Engineer | Remote (PST)
TechCorp (Fully Distributed) | 2021-Present

• Collaborated with team across 8 time zones using async
  communication, maintaining 95% sprint velocity
• Led architecture discussions via RFC documents and
  asynchronous feedback cycles
• Mentored 3 engineers remotely through weekly 1:1s
  and pair programming sessions
\`\`\`

### If You Don't Have Remote Experience
Highlight adjacent skills:
\`\`\`
• Managed projects with offshore teams across 3 time zones
• Documented technical decisions for asynchronous review
• Led distributed team meetings and maintained written
  communication standards
\`\`\`

## Remote-Specific Skills Section

Add a dedicated section:
\`\`\`
Remote Work Capabilities:
• Proven track record of self-directed work
• Strong written communication (documentation, RFCs, PRs)
• Experience with async-first collaboration
• Home office with reliable internet (100+ Mbps)
• Flexible availability for cross-timezone meetings
\`\`\`

## Location on Resume

### For Global Remote Roles
\`\`\`
San Francisco, CA (Open to global remote)
\`\`\`

### For Timezone-Specific Roles
\`\`\`
Austin, TX (CST) | Open to US Remote
\`\`\`

### Visa/Work Authorization
If relevant:
\`\`\`
Berlin, Germany | EU Work Authorization | EMEA Timezones
\`\`\`

## Cover Letter for Remote Roles

Address remote work directly:
\`\`\`
I've worked remotely for the past 3 years and thrive in
async-first environments. My current team spans 6 time zones,
and I've developed strong practices around documentation,
clear written communication, and self-directed project
management.

My home office is equipped with [specs], and I'm comfortable
with your listed tools including Slack, Notion, and Linear.
\`\`\`

## Red Flags Remote Employers Watch For

- No mention of remote tools
- Vague time management claims
- No evidence of written communication
- Gaps suggesting supervision needs
- No location or timezone information

## Remote Job Search Tips

### Where to Find Remote Jobs
- **Tech:** RemoteOK, We Work Remotely, AngelList
- **General:** FlexJobs, Remote.co, LinkedIn
- **Specific:** Remotive, Working Nomads, JustRemote

### Timezone Considerations
- Know your flexibility
- State availability clearly
- Understand overlap expectations

### Interview Prep
- Test your video setup
- Choose professional background
- Prepare for async exercises
- Have technical setup ready

## ATS Keywords for Remote Jobs

Always include (if true):
- Remote work experience
- Distributed team collaboration
- Asynchronous communication
- Time zone flexibility
- Virtual meeting tools
- Self-management

## The Distributed Future

Companies are increasingly:
- Hiring globally
- Using async-first processes
- Evaluating written communication
- Looking for proven remote skills

Position yourself for this future by highlighting remote capabilities, even if your next role isn't fully remote.

**Optimize for remote roles** - try ResumeTx free.
    `,
    author: 'ResumeTx Team',
    date: '2024-10-15',
    readTime: '8 min read',
    category: 'Job Search Strategy',
    tags: ['Remote Work', 'Distributed Teams', 'Job Search', 'Work From Home', 'Career Tips'],
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
  }
];

export function Blog() {
  const categories = [...new Set(blogPosts.map(post => post.category))];
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const filteredPosts = selectedCategory
    ? blogPosts.filter(post => post.category === selectedCategory)
    : blogPosts;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Career Resources & Guides
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
            Expert advice on resume writing, ATS optimization, job search strategies, and landing your dream role in tech.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedCategory
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              All Posts
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
              >
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-400">
                      {post.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {post.readTime}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Optimize Your Resume?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Use AI to tailor your LaTeX resume for any job. Free forever with your own API key.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
          >
            Get Started Free
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
