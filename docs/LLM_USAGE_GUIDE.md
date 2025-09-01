# LLM Usage Guide for ResumeTex

## Table of Contents
1. [Overview](#overview)
2. [Choosing the Right LLM Model](#choosing-the-right-llm-model)
3. [Token Calculation & Management](#token-calculation--management)
4. [Prompt Engineering Best Practices](#prompt-engineering-best-practices)
5. [Character Limits & Optimization](#character-limits--optimization)
6. [Model-Specific Configuration](#model-specific-configuration)
7. [Cost Optimization](#cost-optimization)
8. [Troubleshooting](#troubleshooting)

## Overview

ResumeTex supports multiple Large Language Model (LLM) providers to optimize your resume content. This guide helps you understand how to choose the right model, manage tokens effectively, and craft optimal prompts for the best results.

## Choosing the Right LLM Model

### Supported Providers

#### OpenAI Models
- **GPT-4o** (Recommended)
  - **Best for**: High-quality resume optimization, complex formatting
  - **Context Window**: 128,000 tokens
  - **Cost**: Higher, but best quality
  - **Use Case**: Professional resumes requiring detailed analysis

- **GPT-4o-mini**
  - **Best for**: Quick optimizations, cost-effective processing
  - **Context Window**: 128,000 tokens
  - **Cost**: Lower cost alternative
  - **Use Case**: Budget-conscious users, simple resume updates

- **GPT-3.5-turbo**
  - **Best for**: Basic resume improvements
  - **Context Window**: 16,385 tokens
  - **Cost**: Most economical
  - **Use Case**: Simple resume formatting and basic content improvements

#### Anthropic Models
- **Claude-3-5-Sonnet**
  - **Best for**: Detailed analysis, professional writing
  - **Context Window**: 200,000 tokens
  - **Cost**: Premium pricing
  - **Use Case**: Executive resumes, detailed technical roles

- **Claude-3-Haiku**
  - **Best for**: Quick processing, basic improvements
  - **Context Window**: 200,000 tokens
  - **Cost**: Most economical Anthropic option
  - **Use Case**: Fast turnaround, simple optimizations

### Model Selection Guidelines

| Resume Type | Recommended Model | Reason |
|-------------|------------------|---------|
| Executive/Senior | GPT-4o or Claude-3-5-Sonnet | Complex analysis, professional language |
| Technical/Engineering | GPT-4o | Strong technical understanding |
| Entry-Level | GPT-4o-mini or Claude-3-Haiku | Cost-effective, sufficient capability |
| Academic/Research | Claude-3-5-Sonnet | Excellent at detailed, nuanced content |
| Creative Industries | GPT-4o | Creative language and formatting |

## Token Calculation & Management

### Understanding Tokens

**What are tokens?**
- Tokens are pieces of text that LLMs process
- Roughly 1 token = 4 characters in English
- Includes spaces, punctuation, and formatting

### Token Estimation

```
Approximate Token Count = Character Count ÷ 4
```

### Practical Examples

| Content Type | Character Count | Estimated Tokens |
|-------------|----------------|------------------|
| Short resume (1 page) | 2,000 chars | ~500 tokens |
| Medium resume (2 pages) | 4,000 chars | ~1,000 tokens |
| Long resume (3+ pages) | 6,000+ chars | ~1,500+ tokens |
| Job description | 1,200 chars | ~300 tokens |
| System prompt | 800 chars | ~200 tokens |

### Token Budget Planning

**Total tokens per request = Input + Output**

- **Input tokens**: Resume + Job Description + System Prompt
- **Output tokens**: Optimized resume (usually 20-50% more than input)

**Example calculation for medium resume:**
- Resume: 1,000 tokens
- Job description: 300 tokens  
- System prompt: 200 tokens
- Expected output: 1,300 tokens
- **Total**: ~2,800 tokens

## Prompt Engineering Best Practices

### Effective Resume Optimization Prompts

#### Basic Template
```
Optimize this resume for the following job description:

[JOB DESCRIPTION]

Current Resume:
[RESUME CONTENT]

Requirements:
- Maintain original formatting
- Highlight relevant experience
- Use action verbs
- Quantify achievements where possible
- Keep the same length
```

#### Advanced Template
```
You are a professional resume writer with 10+ years of experience. 

Job Target: [JOB TITLE] at [COMPANY TYPE]
Job Description: [JOB DESCRIPTION]

Current Resume: [RESUME CONTENT]

Please optimize this resume by:
1. Tailoring keywords to match job requirements
2. Quantifying achievements with specific metrics
3. Reordering bullet points by relevance
4. Strengthening action verbs
5. Ensuring ATS compatibility

Maintain:
- Original LaTeX formatting
- Professional tone
- Same overall length
- Contact information unchanged

Focus on: [SPECIFIC AREAS TO EMPHASIZE]
```

### Prompt Optimization Tips

1. **Be Specific**: Clear instructions yield better results
2. **Set Constraints**: Specify length, format, tone requirements
3. **Provide Context**: Include job description and target role
4. **Use Examples**: Show desired output format
5. **Iterate**: Refine prompts based on results

### Common Prompt Mistakes

❌ **Too Vague**: "Make my resume better"
✅ **Specific**: "Optimize my resume for a software engineering role by emphasizing Python and cloud experience"

❌ **No Constraints**: No length or format specifications
✅ **Clear Limits**: "Keep the same length and LaTeX formatting"

❌ **Missing Context**: Only providing resume without job description
✅ **Full Context**: Include both resume and target job description

## Character Limits & Optimization

### Provider-Specific Limits

| Provider | Model | Max Input Chars | Recommended Limit |
|----------|-------|----------------|-------------------|
| OpenAI | GPT-4o | ~500,000 | ~400,000 |
| OpenAI | GPT-3.5-turbo | ~65,000 | ~50,000 |
| Anthropic | Claude-3-5-Sonnet | ~800,000 | ~600,000 |
| Anthropic | Claude-3-Haiku | ~800,000 | ~600,000 |

### Content Optimization Strategies

#### For Large Resumes (>50,000 chars)
1. **Section Processing**: Process resume in sections
2. **Content Prioritization**: Focus on most relevant sections first
3. **Iterative Optimization**: Multiple rounds of smaller optimizations

#### For Long Job Descriptions
1. **Extract Key Requirements**: Summarize main qualifications
2. **Focus on Must-Haves**: Prioritize required vs. preferred skills
3. **Remove Redundancy**: Eliminate repetitive content

### Character Count Tools

```javascript
// Quick character count
const text = document.getElementById('resume-text').value;
const charCount = text.length;
const estimatedTokens = Math.ceil(charCount / 4);
console.log(`Characters: ${charCount}, Estimated tokens: ${estimatedTokens}`);
```

## Model-Specific Configuration

### OpenAI Configuration
```json
{
  "model": "gpt-4o",
  "temperature": 0.3,
  "max_tokens": 4000,
  "top_p": 0.9,
  "frequency_penalty": 0.1,
  "presence_penalty": 0.1
}
```

### Anthropic Configuration
```json
{
  "model": "claude-3-5-sonnet-20240620",
  "max_tokens": 4000,
  "temperature": 0.3,
  "top_p": 0.9
}
```

### Parameter Explanations

- **Temperature (0-1)**: Controls creativity
  - 0.1-0.3: Conservative, focused (recommended for resumes)
  - 0.7-0.9: More creative, varied
- **Max Tokens**: Maximum output length
- **Top P**: Controls response diversity
- **Frequency/Presence Penalty**: Reduces repetition

## Cost Optimization

### Cost-Effective Strategies

1. **Choose Appropriate Models**
   - Use GPT-4o-mini for simple updates
   - Reserve GPT-4o for complex optimizations

2. **Optimize Input Length**
   - Remove unnecessary whitespace
   - Summarize lengthy job descriptions
   - Focus on relevant resume sections

3. **Batch Processing**
   - Process multiple sections together
   - Combine similar optimization requests

4. **Template Reuse**
   - Save effective prompts for similar roles
   - Create role-specific prompt templates

### Cost Comparison (Approximate)

| Model | Input Cost (per 1K tokens) | Output Cost (per 1K tokens) |
|-------|---------------------------|------------------------------|
| GPT-4o | $0.005 | $0.015 |
| GPT-4o-mini | $0.0001 | $0.0004 |
| GPT-3.5-turbo | $0.001 | $0.002 |
| Claude-3-5-Sonnet | $0.003 | $0.015 |
| Claude-3-Haiku | $0.00025 | $0.00125 |

**Example cost for medium resume (2,800 total tokens):**
- GPT-4o: ~$0.056
- GPT-4o-mini: ~$0.0014
- Claude-3-Haiku: ~$0.0042

## Troubleshooting

### Common Issues

#### "Token limit exceeded"
- **Solution**: Reduce input length or switch to model with larger context window
- **Prevention**: Calculate tokens before processing

#### "Poor optimization quality"
- **Solution**: Improve prompt specificity, provide more context
- **Check**: Model temperature settings (should be 0.1-0.3 for resumes)

#### "Formatting lost"
- **Solution**: Explicitly mention format preservation in prompt
- **Add**: "Maintain exact LaTeX formatting and structure"

#### "Content too generic"
- **Solution**: Include specific job requirements in prompt
- **Improve**: Add company research and role-specific keywords

#### "Processing timeout"
- **Solution**: Reduce input size or split into smaller requests
- **Alternative**: Use faster model (GPT-4o-mini, Claude-3-Haiku)

### Performance Tips

1. **Monitor Token Usage**: Track actual vs. estimated tokens
2. **A/B Test Prompts**: Compare different prompt approaches
3. **Save Successful Patterns**: Document what works for different resume types
4. **Regular Model Updates**: Stay updated with new model releases

---

## Quick Reference

### Best Practices Checklist
- ✅ Choose model based on resume complexity and budget
- ✅ Calculate tokens before processing
- ✅ Include specific job description context
- ✅ Set appropriate temperature (0.1-0.3)
- ✅ Specify format preservation requirements
- ✅ Monitor costs and optimize accordingly
- ✅ Test prompts with different resume types
- ✅ Keep successful prompt templates

### Emergency Contacts
- **Technical Issues**: Check backend logs and API connectivity
- **API Limits**: Monitor rate limits and upgrade plans if needed
- **Quality Issues**: Review prompt engineering and model selection

---

*Last updated: September 1, 2025*
*ResumeTex Version: 1.0.0*