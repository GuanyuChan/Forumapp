
import { Button } from '@/components/ui/button';
import { TopicListItem } from '@/components/TopicListItem';
import { placeholderTopics } from '@/lib/placeholder-data'; 
import type { Category } from '@/lib/types';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { fetchCategories } from '@/services/flarum';

export default async function HomePage() {
  const categories: Category[] = await fetchCategories();

  return (
    <div className="space-y-8">
      <section className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
          欢迎来到 11A4008深论坛
        </h1>
        {/* "创建新主题" button removed from here */}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.length > 0 ? categories.map((category: Category) => (
          <Link key={category.id} href={`/t/${category.slug}`} className="block">
            <div className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-card h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2" style={category.color ? { color: category.color } : {}}>
                  {category.icon && <i className={`${category.icon} mr-2`}></i>}
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{category.description || '暂无描述.'}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>{category.topicCount} 个主题 {category.postCount ? `· ${category.postCount} 个帖子` : ''}</p>
                {category.lastTopic && (
                  <p className="mt-1 truncate">
                    最新: {category.lastTopic.title} 
                    {category.lastTopic.authorName ? ` 由 ${category.lastTopic.authorName}` : ''}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )) : (
          <p className="text-muted-foreground col-span-full text-center">未找到分类或无法从论坛加载分类。</p>
        )}
      </section>
      
      {/* "最近主题" section removed */}
    </div>
  );
}
