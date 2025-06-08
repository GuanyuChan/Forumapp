
'use client';
import { useParams, notFound as nextNotFound } from 'next/navigation'; // Renamed to avoid conflict
import { useEffect, useState } from 'react';
import type { Topic, Post as PostType, User } from '@/lib/types';
// import { getPlaceholderTopicById, placeholderUser } from '@/lib/placeholder-data'; // TODO: Replace with API call
import { fetchDiscussionDetails, submitReplyToDiscussion } from '@/services/flarum'; // Assuming these will be created
import { placeholderUser } from '@/lib/placeholder-data'; // Keep for currentUserId simulation

import { PostCard } from '@/components/PostCard';
import { CreatePostForm } from '@/components/CreatePostForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button'; // Not directly used now
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle2, CornerDownRight, Edit3, Trash2, ThumbsUp, MessageSquare, Tag, Clock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

// Helper function to simulate fetching current user details
const getCurrentUser = (): User => {
  // In a real app, this would come from an auth context or API call
  return placeholderUser; 
};


export default function TopicPage() {
  const params = useParams();
  // Flarum discussions can be identified by ID or slug. We'll assume ID for now from URL.
  // If using slug: const topicSlug = params.topicId as string;
  const topicIdFromParam = params.topicId as string; // This could be an ID or a slug

  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]); // All posts including firstPost and replies
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser(); // Simulate logged-in user

  useEffect(() => {
    async function loadDiscussion() {
      if (topicIdFromParam) {
        setIsLoading(true);
        // Assuming topicIdFromParam could be a slug or ID.
        // fetchDiscussionDetails needs to handle this or we decide on one format.
        // For now, let's assume fetchDiscussionDetails can take a slug or ID.
        const fetchedTopicAndPosts = await fetchDiscussionDetails(topicIdFromParam); 
        
        if (fetchedTopicAndPosts) {
          setTopic(fetchedTopicAndPosts.topic);
          setPosts(fetchedTopicAndPosts.posts);
        } else {
          // Topic not found or error fetching
          nextNotFound(); // Use Next.js notFound for 404
        }
        setIsLoading(false);
      }
    }
    loadDiscussion();
  }, [topicIdFromParam]);

  const handleCreateReply = async (content: string, parentPostId?: string) => {
    if (!topic) return;

    console.log('Replying with:', { topicId: topic.id, content, parentPostId });

    const newReplyData = await submitReplyToDiscussion(topic.id, content, currentUser);

    if (newReplyData) {
       // Optimistically update UI or re-fetch posts.
       // For simplicity, let's assume newReplyData is the newly created Post.
       // A more robust solution would re-fetch or integrate into the existing posts structure carefully.
       // This is a simplified optimistic update:
        const newPost: PostType = {
            ...newReplyData,
            author: currentUser, // Assuming submitReplyToDiscussion returns enough data or we map it
            replies: [], // New replies don't have replies yet
        };

        if (parentPostId) {
            setPosts(currentPosts => {
                const addReplyRecursive = (postList: PostType[]): PostType[] => {
                    return postList.map(p => {
                        if (p.id === parentPostId) {
                            return { ...p, replies: [...(p.replies || []), newPost] };
                        }
                        if (p.replies) {
                            return { ...p, replies: addReplyRecursive(p.replies) };
                        }
                        return p;
                    });
                };
                return addReplyRecursive(currentPosts);
            });
        } else {
            // Reply to the main topic (discussion)
            setPosts(currentPosts => [...currentPosts, newPost]);
        }


        toast({
            title: "Reply posted!",
            description: "Your reply has been added to the discussion.",
        });
    } else {
        toast({
            title: "Error",
            description: "Failed to post reply. Please try again.",
            variant: "destructive",
        });
    }
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
    // This case should ideally be handled by nextNotFound() in useEffect if API returns null
    return <p className="text-center text-lg text-muted-foreground">Topic not found.</p>;
  }

  // The first post is now part of the `posts` array from `fetchDiscussionDetails`
  // const firstPost = topic.firstPost; // This might be undefined if not explicitly set

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-headline mb-2">
          {topic.title}
        </h1>
        <div className="flex items-center text-sm text-muted-foreground space-x-3 flex-wrap gap-y-1">
          {topic.author && (
            <Link href={`/profile/${topic.author.username}`} className="flex items-center hover:underline"> {/* Assuming profile uses username */}
              <Avatar className="h-6 w-6 mr-1.5">
                <AvatarImage src={topic.author.avatarUrl} alt={topic.author.username} data-ai-hint="user avatar small"/>
                <AvatarFallback><UserCircle2 className="h-6 w-6" /></AvatarFallback>
              </Avatar>
              <span>{topic.author.username}</span>
            </Link>
          )}
          <span className="flex items-center">
            <Clock className="mr-1 h-4 w-4"/>
            {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
          </span>
           {/* Display primary category if available */}
           {topic.category && (
            <>
              <span>&bull;</span>
              <Link href={`/t/${topic.category.slug}`} className="hover:underline flex items-center" style={topic.category.color ? { color: topic.category.color } : {}}>
                {topic.category.icon && <i className={`${topic.category.icon} mr-1.5`}></i>}
                <span>{topic.category.name}</span>
              </Link>
            </>
          )}
        </div>
        {/* Display other tags */}
        {topic.tags && topic.tags.filter(t => t.id !== topic.category?.id).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
                {topic.tags.filter(t => t.id !== topic.category?.id).map(tag => (
                  <Link key={tag.id} href={`/t/${tag.slug}`}>
                    <span 
                        className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium hover:bg-secondary/80 transition-colors"
                        style={tag.color ? { backgroundColor: tag.color, color: 'white'} : {}} // Basic styling for colored tags
                    >
                        {tag.name}
                    </span>
                  </Link>
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
            topicId={topic.id} // Pass topic.id
            currentUserId={currentUser.id}
          />
        ))}
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-3 text-foreground font-headline">Join the Conversation</h2>
        <CreatePostForm
          onSubmit={(content) => handleCreateReply(content)} // Reply to the topic directly
          placeholder="Write your reply..."
          submitButtonText="Post Reply"
          isReplyForm={true}
        />
      </div>
    </div>
  );
}

// Optional: Generate metadata if this remains a server component or for build time
export async function generateMetadata({ params }: { params: { topicId: string }}) {
  const { topicId } = params; // This will be slug or ID
  const fetchedData = await fetchDiscussionDetails(topicId); // fetchDiscussionDetails needs to exist

  if (!fetchedData?.topic) {
    return {
      title: 'Topic Not Found',
    };
  }
  return {
    title: `${fetchedData.topic.title} - Zenith Forums`,
    description: fetchedData.topic.firstPost?.content.substring(0, 150) || `View the discussion on ${fetchedData.topic.title}.`,
  };
}
