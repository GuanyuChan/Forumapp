
import Link from 'next/link';
import type { Topic, CategorySummary } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Eye, UserCircle2, Clock, TagIcon as Tag } from 'lucide-react'; // Aliased TagIcon to Tag
import { formatDistanceToNow } from 'date-fns';

interface TopicListItemProps {
  topic: Topic;
  currentCategoryPageSlug?: string; // This prop helps determine which tag to highlight
}

const DEFAULT_AVATAR_PLACEHOLDER = 'https://placehold.co/100x100.png';

export function TopicListItem({ topic, currentCategoryPageSlug }: TopicListItemProps) {
  let categoryToDisplay: CategorySummary | undefined = undefined;

  if (currentCategoryPageSlug && topic.tags) {
    categoryToDisplay = topic.tags.find(tag => tag.slug === currentCategoryPageSlug);
  }

  if (!categoryToDisplay) {
    // Fallback: use topic.category (primary tag from Flarum) or the first tag if topic.category is not set
    categoryToDisplay = topic.category || (topic.tags && topic.tags.length > 0 ? topic.tags[0] : undefined);
  }
  
  const author = topic.author || { id: 'unknown', username: 'Unknown User', avatarUrl: DEFAULT_AVATAR_PLACEHOLDER, joinedAt: new Date().toISOString() };
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
                 {(authorDisplayName !== 'Unknown User' && authorAvatarUrl !== DEFAULT_AVATAR_PLACEHOLDER) ? (
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
            {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
          </span>
          {/* Display primary-like category/tag here */}
          {categoryToDisplay && (
            <Link href={`/t/${categoryToDisplay.slug}`} className="text-xs text-accent hover:underline flex items-center">
              <Tag className="mr-1 h-3 w-3" /> {/* Using the aliased Tag icon */}
              <span style={categoryToDisplay.color ? { color: categoryToDisplay.color } : {}}>
                #{categoryToDisplay.name} {/* Added # for tag-like appearance */}
              </span>
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
          {topic.participantCount && (
            <span className="flex items-center" title="Participants">
                <UserCircle2 className="mr-1 h-4 w-4" /> {topic.participantCount}
            </span>
          )}
        </div>
        {/* Display other tags (secondary tags) */}
        {topic.tags && topic.tags.filter(t => t.id !== categoryToDisplay?.id).length > 0 && (
            <div className="flex items-center space-x-1 flex-wrap gap-1">
                {/* Optional: Add a generic tag icon if desired before the list of secondary tags */}
                {/* <Tag className="h-4 w-4 text-muted-foreground" /> */}
                {topic.tags.filter(t => t.id !== categoryToDisplay?.id).slice(0, 2).map(tag => (
                  <Link key={tag.id} href={`/t/${tag.slug}`}>
                    <span
                        className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs hover:bg-secondary/80"
                        style={tag.color ? { backgroundColor: tag.color, color: 'white' } : {}}
                    >
                        {tag.name}
                    </span>
                  </Link>
                ))}
                {topic.tags.filter(t => t.id !== categoryToDisplay?.id).length > 2 && (
                    <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
                        +{topic.tags.filter(t => t.id !== categoryToDisplay?.id).length - 2} more
                    </span>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
