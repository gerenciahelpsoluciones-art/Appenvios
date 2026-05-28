import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, Calendar, Share2 } from 'lucide-react';
import { blogPosts } from '@/data/blog';

// Generate static params for all posts
export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  const shortTitle = post.title.length > 55 ? post.title.substring(0, 52) + '...' : post.title;
  return {
    title: shortTitle,
    description: post.excerpt,
    alternates: {
      canonical: `https://www.helpsoluciones.com.co/blog/${slug}`,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `https://www.helpsoluciones.com.co/blog/${slug}`,
      images: [{ url: post.image, width: 1200, height: 630 }],
      publishedTime: post.date,
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image,
    "datePublished": post.date,
    "author": {
      "@type": "Person",
      "name": post.author.name,
      "jobTitle": post.author.role,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Help Soluciones",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.helpsoluciones.com.co/images/logo.png",
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.helpsoluciones.com.co/blog/${slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <main className="min-h-screen bg-slate-50">
      
      {/* Article Header */}
      <div className="bg-[#0f172a] pt-40 pb-32">
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <Link href="/blog" className="inline-flex items-center text-primary hover:text-[#38bdf8] transition-colors mb-8 font-bold text-sm uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Blog
          </Link>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {post.category}
            </span>
            <span className="text-slate-400 text-sm font-semibold flex items-center">
              <Calendar className="w-4 h-4 mr-1.5" />
              {post.date}
            </span>
            <span className="text-slate-400 text-sm font-semibold flex items-center">
               • {post.readTime}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-8">
            {post.title}
          </h1>

          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image 
                src={post.author.avatar} 
                alt={post.author.name} 
                fill 
                className="rounded-full border-2 border-white/10 object-cover" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-wide">{post.author.name}</span>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{post.author.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 max-w-4xl -mt-16 relative z-20 mb-20">
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
          <div className="relative aspect-video w-full bg-slate-200">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          <div className="p-8 md:p-12 lg:p-16">
            <div 
              className="prose prose-slate lg:prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-loose prose-a:text-primary hover:prose-a:text-primary/80"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">#IT</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">#Corporativo</span>
              </div>
              
              <button className="flex items-center text-slate-500 hover:text-primary transition-colors font-bold text-sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>

    </main>
    </>
  );
}
