'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Topic, Post as PostType } from '@/lib/types';
import { getPlaceholderTopicById, placeholderUser } from '@/lib/placeholder-data';
import { PostCard } from '@/components/PostCard';
import { CreatePostForm } from '@/components/CreatePostForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle2, CornerDownRight, Edit3, Trash2, ThumbsUp, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function TopicPage() {
  const params = useParams();
  const topicId = params.topicId as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]); // Store all posts for the topic including replies
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const currentUserId = placeholderUser.id; // Simulate logged-in user

  useEffect(() => {
    if (topicId) {
      const fetchedTopic = getPlaceholderTopicById(topicId);
      if (fetchedTopic) {
        setTopic(fetchedTopic);
        // For threaded view, the firstPost already contains its replies.
        // We can expand this to fetch all posts if needed, but for now, firstPost is the entry.
        setPosts([fetchedTopic.firstPost]); 
      }
      setIsLoading(false);
    }
  }, [topicId]);

  const handleCreateReply = async (content: string, parentPostId?: string) => {
    // This is a placeholder for API call
    console.log('Replying with:', { topicId, content, parentPostId });
    const newReply: PostType = {
      id: `reply-${Date.now()}`,
      author: placeholderUser, // Assuming current user is replying
      content,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      replies: [],
    };

    // Optimistically update UI
    setPosts(currentPosts => {
        const addReplyRecursive = (postList: PostType[]): PostType[] => {
            return postList.map(p => {
                if (p.id === parentPostId) {
                    return { ...p, replies: [...(p.replies || []), newReply] };
                }
                if (p.replies) {
                    return { ...p, replies: addReplyRecursive(p.replies) };
                }
                return p;
            });
        };
        // If no parentPostId, it's a reply to the main topic (handled by firstPost structure)
        // This logic assumes replies are nested under the specific post being replied to.
        // For a direct reply to topic (not specific post), you might add to a root list.
        // Given current PostCard structure, replies are nested.
        if (!parentPostId) { // This case might need adjustment based on how direct topic replies are handled
             // For now, if no parentPostId, assume it's a reply to the first post (main topic thread)
            if (currentPosts.length > 0 && currentPosts[0].id === topic?.firstPost.id) {
                const updatedFirstPost = {
                    ...currentPosts[0],
                    replies: [...(currentPosts[0].replies || []), newReply]
                };
                return [updatedFirstPost, ...currentPosts.slice(1)];
            }
        }
        return addReplyRecursive(currentPosts);
    });

    toast({
      title: "Reply posted!",
      description: "Your reply has been added to the discussion.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!topic) {
    return <p className="text-center text-lg text-muted-foreground">Topic not found.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-headline mb-2">
          {topic.title}
        </h1>
        <div className="flex items-center text-sm text-muted-foreground space-x-3">
          <Link href={`/profile/${topic.author.id}`} className="flex items-center hover:underline">
            <Avatar className="h-6 w-6 mr-1.5">
              <AvatarImage src={topic.author.avatarUrl} alt={topic.author.username} data-ai-hint="user avatar"/>
              <AvatarFallback><UserCircle2 className="h-6 w-6" /></AvatarFallback>
            </Avatar>
            <span>{topic.author.username}</span>
          </Link>
          <span>&bull;</span>
          <span>Posted on {format(new Date(topic.createdAt), "MMMM d, yyyy 'at' h:mm a")}</span>
           {topic.category && (
            <>
              <span>&bull;</span>
              <Link href={`/category/${topic.category.slug}`} className="text-accent hover:underline">
                <span>{topic.category.name}</span>
              </Link>
            </>
          )}
        </div>
        {topic.tags && topic.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
                {topic.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                        {tag}
                    </span>
                ))}
            </div>
        )}
      </header>

      <div className="space-y-6">
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onReply={(content, parentId) => handleCreateReply(content, parentId)} 
            topicId={topic.id}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-3 text-foreground font-headline">Join the Conversation</h2>
        <CreatePostForm
          onSubmit={(content) => handleCreateReply(content)} // Reply to the topic directly (or adjust if needs parent)
          placeholder="Write your reply..."
          submitButtonText="Post Reply"
          isReplyForm={true}
        />
      </div>
    </div>
  );
}
