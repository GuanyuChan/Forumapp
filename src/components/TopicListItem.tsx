
import Link from 'next/link';
import type { Topic, CategorySummary } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Eye, UserCircle2, Clock } from 'lucide-react'; // Removed Tag icon
import { formatDistanceToNow } from 'date-fns';

interface TopicListItemProps {
  topic: Topic;
  currentCategoryPageSlug?: string;
}

const DEFAULT_AVATAR_PLACEHOLDER = 'https://placehold.co/100x100.png';

export function TopicListItem({ topic, currentCategoryPageSlug }: TopicListItemProps) {
  // categoryToDisplay logic can be removed as it's no longer used for display in this simplified version
  
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
          {/* Tag display removed from here */}
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
        {/* Secondary tag display removed from here */}
      </CardContent>
    </Card>
  );
}
