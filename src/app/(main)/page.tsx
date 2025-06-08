import { Button } from '@/components/ui/button';
import { TopicListItem } from '@/components/TopicListItem';
import { placeholderTopics, placeholderCategories } from '@/lib/placeholder-data';
import type { Category } from '@/lib/types';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
          Welcome to Zenith Forums
        </h1>
        <Link href="/new-topic" passHref>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Topic
          </Button>
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {placeholderCategories.map((category: Category) => (
          <Link key={category.id} href={`/category/${category.slug}`} className="block">
            <div className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-card h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">{category.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>{category.topicCount} topics · {category.postCount} posts</p>
                {category.lastTopic && (
                  <p className="mt-1 truncate">
                    Last: {category.lastTopic.title} by {category.lastTopic.author.username}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-foreground font-headline">Recent Topics</h2>
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
