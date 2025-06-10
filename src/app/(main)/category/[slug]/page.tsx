
// This is now a Server Component.
// 'use client'; was removed to allow generateMetadata.

import { TopicListItem } from '@/components/TopicListItem';
import { fetchDiscussionsByTag, fetchCategoryDetailsBySlug } from '@/services/flarum';
import type { Topic, Category } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Rss, ArrowLeft } from 'lucide-react'; 

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  const categoryDetails: Category | null = await fetchCategoryDetailsBySlug(slug);

  if (!categoryDetails) {
    console.error(`未找到 slug 为 "${slug}" 的分类。`);
    notFound(); 
  }

  const topics: Topic[] = await fetchDiscussionsByTag(slug);

  return (
    <div className="space-y-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" passHref>
          <button className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-foreground/80">
            <ArrowLeft className="h-4 w-4" />
            返回论坛
          </button>
        </Link>
      </div>

      {topics.length > 0 ? (
        <div className="space-y-4">
          {topics.map(topic => (
            <TopicListItem key={topic.id} topic={topic} currentCategoryPageSlug={slug} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Rss className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">暂无主题</h2>
          <p className="text-muted-foreground">
            “{categoryDetails.name}” 分类下还没有主题。要不要成为第一个发帖的人？
          </p>
          <Link href="/new-topic" className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium">
              创建新主题
          </Link>
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
  const categoryDetails = await fetchCategoryDetailsBySlug(slug);

  if (!categoryDetails) {
    return {
      title: '分类未找到',
    };
  }

  return {
    title: `${categoryDetails.name} - 11A4008深论坛`,
    description: categoryDetails.description || `“${categoryDetails.name}”分类下的讨论。`,
  };
}
