import Link from 'next/link';
import type { Topic, CategorySummary } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Eye, UserCircle2, Clock, TagIcon as Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TopicListItemProps {
  topic: Topic;
  currentCategoryPageSlug?: string;
}

const DEFAULT_AVATAR_PLACEHOLDER = 'https://placehold.co/100x100.png';

export function TopicListItem({ topic, currentCategoryPageSlug }: TopicListItemProps) {
  let categoryToDisplay: CategorySummary | undefined = undefined;

  if (currentCategoryPageSlug && topic.tags) {
    categoryToDisplay = topic.tags.find(tag => tag.slug === currentCategoryPageSlug);
  }

  if (!categoryToDisplay) {
    categoryToDisplay = topic.category || (topic.tags && topic.tags.length > 0 ? topic.tags[0] : undefined);
  }
  
  const author = topic.author || { id: 'unknown', username: '未知用户', avatarUrl: DEFAULT_AVATAR_PLACEHOLDER, joinedAt: new Date().toISOString() };
  const authorDisplayName = author.username;
  const authorAvatarUrl = author.avatarUrl;
  const authorInitials = authorDisplayName.substring(0, 2).toUpperCase();

  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader className="pb-3">
        <Link href={topic.slug ? `/topics/${topic.slug}` : `/topics/id/${topic.id}`} className="hover:underline">
          <CardTitle className="text-xl font-semibold text-primary hover:text-primary/80">
            {topic.title}
          </CardTitle>
        </Link>
        <CardDescription className="text-xs text-muted-foreground flex items-center flex-wrap gap-x-3 gap-y-1 pt-1">
          <span className="flex items-center">
            <Avatar className="h-5 w-5 mr-1.5">
              <AvatarImage 
                src={authorAvatarUrl === DEFAULT_AVATAR_PLACEHOLDER ? undefined : authorAvatarUrl} 
                alt={authorDisplayName} 
                data-ai-hint="user avatar small"
              />
              <AvatarFallback className="flex items-center justify-center">
                 {(authorDisplayName !== '未知用户' && authorAvatarUrl !== DEFAULT_AVATAR_PLACEHOLDER) ? (
                    <span className="text-xs font-semibold">{authorInitials}</span>
                 ) : (
                    <UserCircle2 className="h-full w-full text-muted-foreground" />
                 )}
              </AvatarFallback>
            </Avatar>
            {authorDisplayName}
          </span>
          <span className="flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true, locale: zhCN })}
          </span>
          {categoryToDisplay && (
            <Link href={`/t/${categoryToDisplay.slug}`} className="text-xs text-accent hover:underline flex items-center">
              <Tag className="mr-1 h-3 w-3" />
              <span style={categoryToDisplay.color ? { color: categoryToDisplay.color } : {}}>
                #{categoryToDisplay.name}
              </span>
            </Link>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between items-center text-sm text-muted-foreground pt-0">
        <div className="flex items-center space-x-4">
          <span className="flex items-center" title="帖子数">
            <MessageSquare className="mr-1 h-4 w-4" /> {topic.postCount}
          </span>
          <span className="flex items-center" title="浏览量">
            <Eye className="mr-1 h-4 w-4" /> {topic.viewCount}
          </span>
          {topic.participantCount && (
            <span className="flex items-center" title="参与者">
                <UserCircle2 className="mr-1 h-4 w-4" /> {topic.participantCount}
            </span>
          )}
        </div>
        {topic.tags && topic.tags.filter(t => t.id !== categoryToDisplay?.id).length > 0 && (
            <div className="flex items-center space-x-1 flex-wrap gap-1">
                {topic.tags.filter(t => t.id !== categoryToDisplay?.id).slice(0, 2).map(tagObject => (
                  <Link key={tagObject.id} href={`/t/${tagObject.slug}`}>
                    <span
                        className="inline-flex items-center px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs hover:bg-secondary/80 transition-colors"
                        style={tagObject.color ? { backgroundColor: tagObject.color, color: 'white' } : {}}
                    >
                        <Tag className="h-3 w-3 mr-1" />
                        {tagObject.name}
                    </span>
                  </Link>
                ))}
                {topic.tags.filter(t => t.id !== categoryToDisplay?.id).length > 2 && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
                        +{topic.tags.filter(t => t.id !== categoryToDisplay?.id).length - 2} 更多
                    </span>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
