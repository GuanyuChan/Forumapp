"use client";

import { useState, type FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface CreatePostFormProps {
  onSubmit: (content: string, title?: string, tags?: string) => Promise<void>;
  placeholder?: string;
  submitButtonText?: string;
  isNewTopic?: boolean; // If true, will show title and tags input
  isReplyForm?: boolean; // Styles slightly differently for replies
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
  const [tags, setTags] = useState(''); // Comma-separated tags
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content || (isNewTopic && !title)) return; // Basic validation

    setIsLoading(true);
    try {
      await onSubmit(content, title, tags);
      setContent('');
      if (isNewTopic) {
        setTitle('');
        setTags('');
      }
    } catch (error) {
      console.error("Failed to submit post:", error);
      // Handle error (e.g., show toast notification)
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
        <Textarea
          id={isNewTopic ? "topic-content" : "reply-content"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          required
          rows={isNewTopic ? 5 : 3}
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
        <Button type="submit" disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isLoading ? "Submitting..." : submitButtonText}
        </Button>
      </div>
    </form>
  );

  if (isReplyForm) {
    return formContent; // Render form directly for replies
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
