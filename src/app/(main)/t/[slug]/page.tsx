
// This is now a Server Component.
// 'use client'; was removed to allow generateMetadata.

import { TopicListItem } from '@/components/TopicListItem';
import { fetchDiscussionsByTag, fetchCategoryDetailsBySlug } from '@/services/flarum';
import type { Topic, Category } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Rss, Home } from 'lucide-react'; // Added Home for breadcrumb

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;

  const categoryDetails: Category | null = await fetchCategoryDetailsBySlug(slug);

  if (!categoryDetails) {
    console.error(`Category with slug "${slug}" not found after fetch.`);
    notFound(); // Triggers the Next.js 404 page
  }

  const topics: Topic[] = await fetchDiscussionsByTag(slug);

  return (
    <div className="space-y-8">
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:underline flex items-center">
          <Home className="h-4 w-4 mr-1.5" />
          Home
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{categoryDetails.name}</span>
      </nav>

      <section className="pb-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline mb-1" style={categoryDetails.color ? { color: categoryDetails.color } : {}}>
                {categoryDetails.icon && <i className={`${categoryDetails.icon} mr-2`}></i>}
                {categoryDetails.name}
                </h1>
                {categoryDetails.description && (
                <p className="text-muted-foreground mt-1">{categoryDetails.description}</p>
                )}
            </div>
            <Link href={`/api/flarum/feed/tag/${slug}`} target="_blank" passHref>
                 <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-foreground/70">
                    <Rss className="h-4 w-4" />
                    RSS Feed
                </button>
            </Link>
        </div>
         <div className="text-sm text-muted-foreground mt-3">
            {categoryDetails.topicCount} {categoryDetails.topicCount === 1 ? 'topic' : 'topics'}
            {categoryDetails.lastTopic && (
                <span className="ml-2 text-xs">
                    Latest: <Link href={categoryDetails.lastTopic.id ? `/topics/${categoryDetails.lastTopic.id}` : '#'} className="hover:underline">{categoryDetails.lastTopic.title}</Link>
                    {categoryDetails.lastTopic.authorName && ` by ${categoryDetails.lastTopic.authorName}`}
                </span>
            )}
        </div>
      </section>

      {topics.length > 0 ? (
        <div className="space-y-4">
          {topics.map(topic => (
            <TopicListItem key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Rss className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" /> {/* Placeholder icon */}
          <h2 className="text-xl font-semibold text-foreground mb-2">No Topics Yet</h2>
          <p className="text-muted-foreground">
            There are no topics in the "{categoryDetails.name}" category. Why not be the first to post one?
          </p>
          <Link href="/new-topic" className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium">
              Create New Topic
          </Link>
        </div>
      )}
    </div>
  );
}

// Optional: Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = params;
  const categoryDetails = await fetchCategoryDetailsBySlug(slug);

  if (!categoryDetails) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${categoryDetails.name} - Zenith Forums`,
    description: categoryDetails.description || `Discussions in the ${categoryDetails.name} category.`,
  };
}
