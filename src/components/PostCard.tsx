
'use client';
import type { Post as PostType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MessageSquare, Flag, UserCircle2, MoreVertical } from 'lucide-react'; // ThumbsUp removed
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import { CreatePostForm } from './CreatePostForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: PostType;
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
  // Optimistic upvotes and handleUpvote removed
  const { toast } = useToast();

  const handleReplySubmit = async (content: string) => {
    const result = await onReply(topicId, content, post.id);
    if (result.success) {
      setShowReplyForm(false);
      toast({
        title: "Reply Posted!",
        description: "Your reply has been added to the discussion.",
        variant: "default",
      });
    } else {
      toast({
        title: "Error Posting Reply",
        description: result.error || "Could not post your reply. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const isOwnPost = currentUserId && post.author.id === currentUserId;
  const authorDisplayName = post.author?.username || 'Unknown User';
  const authorInitials = authorDisplayName.substring(0, 2).toUpperCase();


  return (
    <Card className={`mb-4 ${level > 0 ? 'ml-4 md:ml-8' : ''} shadow-sm bg-card`}>
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author?.avatarUrl} alt={authorDisplayName} data-ai-hint="user avatar" />
            <AvatarFallback className="text-sm font-semibold">
              {post.author?.avatarUrl ? authorInitials : <UserCircle2 className="h-10 w-10 text-muted-foreground" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{authorDisplayName}</p>
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
        <p>{post.content}</p>
        {post.isFlagged && (
            <div className="mt-2 p-2 border border-destructive/50 bg-destructive/10 rounded-md text-destructive text-sm">
                <strong>Flagged:</strong> {post.flagReason || "This post may violate community guidelines."}
            </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-start space-x-4 p-4 pt-0">
        {/* Like button and upvote count removed */}
        <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="text-muted-foreground hover:text-primary">
          <MessageSquare className="mr-1.5 h-4 w-4" /> Reply
        </Button>
      </CardFooter>

      {showReplyForm && (
        <div className="p-4 border-t">
          <CreatePostForm
            onSubmit={async (content) => await handleReplySubmit(content)}
            placeholder={`Replying to ${authorDisplayName}...`}
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
              onReply={onReply}
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
