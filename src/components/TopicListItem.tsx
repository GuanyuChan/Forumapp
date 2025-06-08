import Link from 'next/link';
import Image from 'next/image';
import type { Topic } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Eye, Tag, UserCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TopicListItemProps {
  topic: Topic;
}

export function TopicListItem({ topic }: TopicListItemProps) {
  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader className="pb-3">
        <Link href={`/topics/${topic.id}`} className="hover:underline">
          <CardTitle className="text-xl font-semibold text-primary hover:text-primary/80">
            {topic.title}
          </CardTitle>
        </Link>
        <CardDescription className="text-xs text-muted-foreground flex items-center flex-wrap gap-x-3 gap-y-1 pt-1">
          <span className="flex items-center">
            <Avatar className="h-5 w-5 mr-1.5">
              <AvatarImage src={topic.author.avatarUrl} alt={topic.author.username} data-ai-hint="user avatar" />
              <AvatarFallback>
                <UserCircle2 className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            {topic.author.username}
          </span>
          <span>
            {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
          </span>
          {topic.category && (
            <Link href={`/category/${topic.category.slug}`} className="text-xs text-accent hover:underline">
              <span>#{topic.category.name}</span>
            </Link>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between items-center text-sm text-muted-foreground pt-0">
        <div className="flex items-center space-x-4">
          <span className="flex items-center" title="Posts">
            <MessageSquare className="mr-1 h-4 w-4" /> {topic.postCount}
          </span>
          <span className="flex items-center" title="Views">
            <Eye className="mr-1 h-4 w-4" /> {topic.viewCount}
          </span>
        </div>
        {topic.tags && topic.tags.length > 0 && (
          <div className="flex items-center space-x-1">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {topic.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
                {tag}
              </span>
            ))}
            {topic.tags.length > 2 && (
                <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
                    +{topic.tags.length - 2} more
                </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
