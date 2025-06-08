
"use client";

import { useState, type FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface CreatePostFormProps {
  onSubmit: (content: string, title?: string, tags?: string) => Promise<any>; // Changed Promise<void> to Promise<any>
  placeholder?: string;
  submitButtonText?: string;
  isNewTopic?: boolean;
  isReplyForm?: boolean;
}

export function CreatePostForm({
  onSubmit,
  placeholder = "What's on your mind?",
  submitButtonText = "Post",
  isNewTopic = false,
  isReplyForm = false,
}: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content || (isNewTopic && !title)) {
      // Basic validation: content is always required. If it's a new topic, title is also required.
      // For replies, only content is required (title/tags inputs are not shown).
      if (isReplyForm && !content) return;
      if (isNewTopic && (!content || !title)) return;
      if (!isNewTopic && !isReplyForm && !content) return; // Generic post case if ever used
    }


    setIsLoading(true);
    try {
      await onSubmit(content, title, tags);
      // Clear form only on successful submission.
      // If onSubmit throws or returns error, form content is preserved.
      setContent('');
      if (isNewTopic) {
        setTitle('');
        setTags('');
      }
    } catch (error) {
      console.error("Failed to submit post via CreatePostForm:", error);
      // Error is handled by the caller (e.g. RootReplyFormWrapper shows a toast)
      // We don't clear the form here to allow user to retry.
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isNewTopic && (
        <>
          <div>
            <Label htmlFor="topic-title" className="mb-1 block font-medium">Title</Label>
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter topic title"
              required
              disabled={isLoading}
              className="bg-background"
            />
          </div>
        </>
      )}
      <div>
        {isNewTopic && <Label htmlFor="topic-content" className="mb-1 block font-medium">Your Post</Label>}
        {!isNewTopic && !isReplyForm && <Label htmlFor="post-content" className="mb-1 block font-medium">Your Post</Label>}
        <Textarea
          id={isNewTopic ? "topic-content" : (isReplyForm ? "reply-content" : "post-content")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          required
          rows={isNewTopic ? 5 : (isReplyForm ? 3 : 4)}
          disabled={isLoading}
          className="bg-background"
        />
      </div>
      {isNewTopic && (
         <div>
            <Label htmlFor="topic-tags" className="mb-1 block font-medium">Tags (optional, comma-separated)</Label>
            <Input
              id="topic-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., announcement, help, discussion"
              disabled={isLoading}
              className="bg-background"
            />
          </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !content.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isLoading ? "Submitting..." : submitButtonText}
        </Button>
      </div>
    </form>
  );

  if (isReplyForm) {
    return formContent; 
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">{isNewTopic ? "Create a New Topic" : "Write a Post"}</CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}

