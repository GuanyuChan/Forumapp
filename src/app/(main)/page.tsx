
import { Button } from '@/components/ui/button';
import { TopicListItem } from '@/components/TopicListItem';
import { placeholderTopics } from '@/lib/placeholder-data'; // Keep for recent topics for now
import type { Category } from '@/lib/types';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { fetchCategories } from '@/services/flarum'; // Import the new service

export default async function HomePage() {
  const categories: Category[] = await fetchCategories();

  return (
    <div className="space-y-8">
      <section className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
          Welcome to Zenith Forums
        </h1>
        <Link href="/new-topic">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Topic
          </Button>
        </Link>
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
                <p className="text-sm text-muted-foreground mb-3">{category.description || 'No description available.'}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>{category.topicCount} topics {category.postCount ? `· ${category.postCount} posts` : ''}</p>
                {category.lastTopic && (
                  <p className="mt-1 truncate">
                    Last: {category.lastTopic.title} 
                    {category.lastTopic.authorName ? ` by ${category.lastTopic.authorName}` : ''}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )) : (
          <p className="text-muted-foreground col-span-full text-center">No categories found or unable to load categories from the forum.</p>
        )}
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-foreground font-headline">Recent Topics (Placeholder)</h2>
        {/* Recent topics are still using placeholder data for now. We can integrate this next. */}
        {placeholderTopics.length > 0 ? (
          <div className="space-y-4">
            {placeholderTopics.map(topic => (
              <TopicListItem key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No topics yet. Be the first to create one!</p>
        )}
      </section>
    </div>
  );
}
