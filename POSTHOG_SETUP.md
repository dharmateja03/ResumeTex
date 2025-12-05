# PostHog Analytics Integration

PostHog has been successfully integrated into the Resume Optimizer app! 🎉

## What is PostHog?

PostHog is an open-source product analytics platform that helps you track user behavior, understand how users interact with your app, and make data-driven decisions.

## Setup Instructions

### 1. Create a PostHog Account

1. Go to [PostHog Cloud](https://app.posthog.com/signup) or [self-host PostHog](https://posthog.com/docs/self-host)
2. Create a new account (free tier available)
3. Create a new project for "Resume Optimizer"
4. Copy your **Project API Key** from the project settings

### 2. Configure Environment Variables

Update the `.env.development` file with your PostHog credentials:

```bash
# PostHog Analytics
VITE_POSTHOG_KEY=phc_your_actual_key_here
VITE_POSTHOG_HOST=https://us.i.posthog.com  # or https://eu.i.posthog.com or your self-hosted URL
```

### 3. Restart the Frontend

After updating the environment variables, restart your frontend server:

```bash
npm run dev
```

## Events Being Tracked

The following events are automatically tracked:

### User Authentication
- `user_logged_in` - When a user logs in
  - Properties: `method` (dev_bypass, clerk, etc.)
  - User properties set: `email`, `name`

### Resume Upload
- `resume_uploaded` - When user uploads their resume
  - Properties:
    - `file_name`
    - `file_size`
    - `content_length`

### Resume Optimization
- `resume_optimization_started` - When a user starts an optimization
  - Properties:
    - `company_name`
    - `job_title` (extracted from job description)
    - `llm_provider`
    - `llm_model`
    - `has_custom_instructions`
    - `generate_cold_email`
    - `generate_cover_letter`
    - `job_description_length`
    - `timestamp`

- `resume_optimization_completed` - When optimization succeeds
  - Properties:
    - `optimization_id`
    - `processing_time`
    - `provider`
    - `model`
    - `has_pdf`
    - `has_cold_email`
    - `has_cover_letter`
    - `total_user_optimizations` (cumulative count)
    - `is_regeneration` (true if user has optimized more than once)

- `resume_optimization_failed` - When optimization fails
  - Properties:
    - `optimization_id`
    - `error`

### Downloads
- `resume_pdf_downloaded` - When user downloads PDF
  - Properties:
    - `optimization_id`
    - `company_name`

### Traffic Attribution
Automatically captured on first page load:
- `initial_referrer` - Where the user came from (direct, google.com, etc.)
- `utm_source` - Marketing campaign source
- `utm_medium` - Marketing campaign medium
- `utm_campaign` - Marketing campaign name
- `utm_term` - Marketing campaign keywords
- `utm_content` - Marketing campaign content variation

### Automatic Tracking
PostHog also automatically captures:
- Page views
- Page leaves
- Clicks and interactions (autocapture)
- Session recordings (if enabled)

## PostHog Features You Can Use

### 1. **Dashboards**
Create custom dashboards to visualize:
- Daily active users
- Resume optimizations per day
- Success/failure rates
- Most popular LLM providers
- PDF download rates

### 2. **Funnels**
Track conversion funnels:
- Login → Upload Resume → Optimize → Download PDF
- Identify where users drop off

### 3. **Retention**
Measure user retention:
- How many users come back after first use?
- Weekly/monthly retention cohorts

### 4. **Session Recordings**
Watch actual user sessions to understand:
- Where users get stuck
- UX issues
- Feature usage patterns

### 5. **Feature Flags**
Gradually roll out new features:
- A/B test different LLM models
- Test new UI designs
- Beta features for specific users

### 6. **User Segmentation**
Segment users by:
- LLM provider preference
- Number of optimizations
- Cold email/cover letter usage
- Company types

## Key Metrics & PostHog Insights

Here are the specific metrics you requested and how to track them in PostHog:

### 1. **Total Resumes Generated Today/This Week**
```
Event: resume_optimization_completed
Date range: Today / Last 7 days
Aggregation: Total count
```

### 2. **Conversion Rate: Upload → Get Resume**
```
Funnel:
1. resume_uploaded
2. resume_optimization_started
3. resume_optimization_completed
Formula: (Step 3 / Step 1) * 100
```

### 3. **Average Time from Upload → Download**
```
Events:
- resume_uploaded (capture timestamp)
- resume_pdf_downloaded (capture timestamp)

Custom insight:
- Calculate time difference between events
- Group by user
- Average the time differences
```

### 4. **Most Common Job Titles Users Apply For**
```
Event: resume_optimization_started
Property: job_title
Aggregation: Count
Breakdown: job_title
Sort: Descending
Top 10
```

### 5. **% of Users Who Regenerate >1 Time**
```
Event: resume_optimization_completed
Property: is_regeneration = true
Formula: (users with is_regeneration=true / total unique users) * 100
```

### 6. **User Came From (UTM or Referrer)**
```
User Property: initial_referrer
Breakdown: initial_referrer
Or breakdown by:
- utm_source
- utm_medium
- utm_campaign
```

## Additional PostHog Queries

### 7. Optimization Success Rate
```
Events: resume_optimization_completed, resume_optimization_failed
Formula: (completed / (completed + failed)) * 100
```

### 8. Average Processing Time by LLM
```
Event: resume_optimization_completed
Breakdown: provider
Aggregation: Average of processing_time
```

### 9. Most Active Users
```
Event: resume_optimization_started
Group by: user_id
Count: total events
```

### 10. Popular Companies Users Apply To
```
Event: resume_optimization_started
Property: company_name
Breakdown: company_name
Top 20
```

## Privacy & Compliance

PostHog is GDPR-compliant and you have full control over:
- What data is collected
- Where it's stored (EU/US data centers or self-hosted)
- User data retention policies
- Cookie consent management

## Useful Links

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog Dashboard](https://app.posthog.com)
- [Event Definitions](https://posthog.com/docs/data/events)
- [Session Recordings](https://posthog.com/docs/session-replay)
- [Feature Flags](https://posthog.com/docs/feature-flags)

## Troubleshooting

### Events Not Showing Up?

1. **Check Console** - Look for PostHog initialization message:
   ```
   PostHog initialized successfully
   ```

2. **Verify API Key** - Make sure `VITE_POSTHOG_KEY` is set correctly

3. **Check Network Tab** - Look for requests to `i.posthog.com`

4. **Development Mode** - PostHog might filter out localhost events by default. You can disable this in PostHog settings.

### Warning in Console?

If you see `⚠️ PostHog key not found. Analytics disabled.` - this means the env variable is not set. Add it to `.env.development` and restart the server.

## Next Steps

1. Set up your first dashboard in PostHog
2. Create alerts for critical events (high failure rates, etc.)
3. Set up user cohorts for power users
4. Enable session recordings to watch real user interactions
5. Create A/B tests with feature flags

Enjoy your analytics! 📊
