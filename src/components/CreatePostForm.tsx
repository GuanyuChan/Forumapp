"use client";

import { useState, type FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreatePostFormProps {
  onSubmit: (content: string, title?: string, tags?: string) => Promise<any>;
  placeholder?: string;
  submitButtonText?: string;
  isNewTopic?: boolean;
  isReplyForm?: boolean;
}

export function CreatePostForm({
  onSubmit,
  placeholder = "你在想什么?",
  submitButtonText = "发布",
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
      if (isReplyForm && !content) return;
      if (isNewTopic && (!content || !title)) return;
      if (!isNewTopic && !isReplyForm && !content) return;
    }

    setIsLoading(true);
    try {
      await onSubmit(content, title, tags);
      setContent('');
      if (isNewTopic) {
        setTitle('');
        setTags('');
      }
    } catch (error) {
      console.error("通过CreatePostForm提交帖子失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isNewTopic && (
        <>
          <div>
            <Label htmlFor="topic-title" className="mb-1 block font-medium">标题</Label>
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入主题标题"
              required
              disabled={isLoading}
              className="bg-background"
            />
          </div>
        </>
      )}
      <div>
        {isNewTopic && <Label htmlFor="topic-content" className="mb-1 block font-medium">你的帖子</Label>}
        {!isNewTopic && !isReplyForm && <Label htmlFor="post-content" className="mb-1 block font-medium">你的帖子</Label>}
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
            <Label htmlFor="topic-tags" className="mb-1 block font-medium">标签 (可选, 逗号分隔)</Label>
            <Input
              id="topic-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如: 公告, 求助, 讨论"
              disabled={isLoading}
              className="bg-background"
            />
          </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !content.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isLoading ? "提交中..." : submitButtonText}
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
        <CardTitle className="font-headline">{isNewTopic ? "创建新主题" : "撰写帖子"}</CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}
