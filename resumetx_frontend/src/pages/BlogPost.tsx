import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { blogPosts } from './Blog';
import { Calendar, Clock, ArrowLeft, ArrowRight, Tag, Share2, Twitter, Linkedin, Link as LinkIcon } from 'lucide-react';

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Find related posts (same category, excluding current)
  const relatedPosts = blogPosts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  // Find prev/next posts
  const currentIndex = blogPosts.findIndex(p => p.id === post.id);
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  const shareUrl = window.location.href;
  const shareTitle = post.title;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  // Simple markdown-like rendering for content
  const renderContent = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 my-4 text-slate-600 dark:text-slate-400">
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    lines.forEach((line, index) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${index}`} className="bg-slate-900 dark:bg-black rounded-lg p-4 my-6 overflow-x-auto">
              <code className="text-sm text-slate-300 font-mono">
                {codeContent.join('\n')}
              </code>
            </pre>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} className="text-4xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
            {line.slice(2)}
          </h1>
        );
        return;
      }

      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
            {line.slice(3)}
          </h2>
        );
        return;
      }

      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3">
            {line.slice(4)}
          </h3>
        );
        return;
      }

      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        inList = true;
        listItems.push(line.trim().slice(2));
        return;
      }

      // Numbered list
      if (/^\d+\.\s/.test(line.trim())) {
        inList = true;
        listItems.push(line.trim().replace(/^\d+\.\s/, ''));
        return;
      }

      // If we were in a list but this line isn't a list item, flush the list
      if (inList && line.trim() !== '') {
        flushList();
      }

      // Empty lines
      if (line.trim() === '') {
        if (!inList) {
          flushList();
        }
        return;
      }

      // Bold text
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>');

      // Inline code
      processedLine = processedLine.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800 dark:text-slate-200">$1</code>');

      // Tables (simple detection)
      if (line.includes('|')) {
        // Skip table formatting for now, just show as text
        elements.push(
          <p key={index} className="text-slate-600 dark:text-slate-400 leading-relaxed my-4 font-mono text-sm">
            {line}
          </p>
        );
        return;
      }

      // Regular paragraph
      elements.push(
        <p
          key={index}
          className="text-slate-600 dark:text-slate-400 leading-relaxed my-4"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    });

    flushList();
    return elements;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to all posts
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium text-slate-600 dark:text-slate-400">
              {post.category}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 dark:text-slate-500 pb-8 border-b border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-slate-900 font-bold text-xs">
                RT
              </div>
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {post.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={16} className="text-slate-400" />
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm text-slate-600 dark:text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Share2 size={16} />
                Share this article
              </span>
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Twitter size={18} className="text-slate-600 dark:text-slate-400" />
                </a>
                <a
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Linkedin size={18} className="text-slate-600 dark:text-slate-400" />
                </a>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <LinkIcon size={18} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Post Navigation */}
      <section className="py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prevPost ? (
              <Link
                to={`/blog/${prevPost.slug}`}
                className="group p-6 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-sm text-slate-500 dark:text-slate-500 flex items-center gap-1 mb-2">
                  <ArrowLeft size={14} />
                  Previous
                </span>
                <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                  {prevPost.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {nextPost && (
              <Link
                to={`/blog/${nextPost.slug}`}
                className="group p-6 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right"
              >
                <span className="text-sm text-slate-500 dark:text-slate-500 flex items-center justify-end gap-1 mb-2">
                  Next
                  <ArrowRight size={14} />
                </span>
                <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                  {nextPost.title}
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={relatedPost.image}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-2">
                      {relatedPost.title}
                    </h3>
                    <span className="text-sm text-slate-500 dark:text-slate-500">
                      {relatedPost.readTime}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
