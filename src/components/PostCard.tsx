
'use client';
import type { Post as PostType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ThumbsUp, MessageSquare, Flag, UserCircle2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import { CreatePostForm } from './CreatePostForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast'; // For client-side feedback

interface PostCardProps {
  post: PostType;
  // onReply now expects a Server Action or a function that calls one
  onReply: (
    topicId: string,
    content: string,
    parentPostId: string | undefined
  ) => Promise<{ success: boolean; error?: string; post?: PostType }>;
  topicId: string;
  level?: number;
  currentUserId?: string;
}

export function PostCard({ post, onReply, topicId, level = 0, currentUserId }: PostCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState(post.upvotes);
  const { toast } = useToast();

  const handleUpvote = () => {
    setOptimisticUpvotes(prev => prev + 1);
    // API call for upvote would go here
  };

  const handleReplySubmit = async (content: string) => {
    // onReply is the Server Action passed from the parent
    const result = await onReply(topicId, content, post.id);
    if (result.success) {
      setShowReplyForm(false);
      toast({
        title: "Reply Posted!",
        description: "Your reply has been added to the discussion.",
        variant: "default",
      });
      // Revalidation should refresh the posts list
    } else {
      toast({
        title: "Error Posting Reply",
        description: result.error || "Could not post your reply. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const isOwnPost = currentUserId && post.author.id === currentUserId;

  return (
    <Card className={`mb-4 ${level > 0 ? 'ml-4 md:ml-8' : ''} shadow-sm bg-card`}>
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatarUrl} alt={post.author.username} data-ai-hint="user avatar" />
            <AvatarFallback>
              <UserCircle2 className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{post.author.username}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Flag className="mr-2 h-4 w-4" /> Report
            </DropdownMenuItem>
            {isOwnPost && (
              <>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Delete</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 pt-2 text-foreground/90">
        {/* Ensure content is plain text or safely rendered HTML */}
        <p>{post.content}</p>
        {post.isFlagged && (
            <div className="mt-2 p-2 border border-destructive/50 bg-destructive/10 rounded-md text-destructive text-sm">
                <strong>Flagged:</strong> {post.flagReason || "This post may violate community guidelines."}
            </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-start space-x-4 p-4 pt-0">
        <Button variant="ghost" size="sm" onClick={handleUpvote} className="text-muted-foreground hover:text-primary">
          <ThumbsUp className="mr-1.5 h-4 w-4" /> {optimisticUpvotes}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="text-muted-foreground hover:text-primary">
          <MessageSquare className="mr-1.5 h-4 w-4" /> Reply
        </Button>
      </CardFooter>

      {showReplyForm && (
        <div className="p-4 border-t">
          <CreatePostForm
            // CreatePostForm's onSubmit expects (content: string, title?: string, tags?: string) => Promise<void>;
            // handleReplySubmit here takes only content.
            onSubmit={async (content) => await handleReplySubmit(content)}
            placeholder={`Replying to ${post.author.username}...`}
            submitButtonText="Post Reply"
            isReplyForm={true}
          />
        </div>
      )}

      {post.replies && post.replies.length > 0 && (
        <div className={`p-4 ${level === 0 ? 'border-t' : ''}`}>
          {post.replies.map(reply => (
            <PostCard 
              key={reply.id} 
              post={reply} 
              onReply={onReply} // Pass down the Server Action
              topicId={topicId} 
              level={level + 1} 
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
