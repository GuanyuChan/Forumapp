'use client';
import type { Post as PostType, User } from '@/lib/types';
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

interface PostCardProps {
  post: PostType;
  onReply: (topicId: string, content: string, parentPostId?: string) => Promise<void>; // Assuming topicId is available or passed down
  topicId: string; 
  level?: number;
  currentUserId?: string; // Optional: to enable edit/delete for own posts
}

export function PostCard({ post, onReply, topicId, level = 0, currentUserId }: PostCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState(post.upvotes);

  const handleUpvote = () => {
    // In a real app, this would be an API call
    setOptimisticUpvotes(prev => prev + 1);
  };

  const handleReplySubmit = async (content: string) => {
    await onReply(topicId, content, post.id);
    setShowReplyForm(false);
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
            onSubmit={handleReplySubmit}
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
