"use client";

import { useState, type FormEvent } from 'react';
import { moderatePost, type ModeratePostInput, type ModeratePostOutput } from '@/ai/flows/ai-moderation-assistance';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const defaultCommunityGuidelines = `
1. Be respectful: No personal attacks, harassment, or hate speech.
2. Stay on topic: Keep discussions relevant to the forum category.
3. No spam or self-promotion: Commercial advertising is not allowed unless in designated areas.
4. No illegal content: Do not share or promote illegal activities.
5. Use appropriate language: Avoid excessive profanity or offensive terms.
`;

export function ModerationAssistant() {
  const [postContent, setPostContent] = useState('');
  const [communityGuidelines, setCommunityGuidelines] = useState(defaultCommunityGuidelines);
  const [result, setResult] = useState<ModeratePostOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      setError("Post content cannot be empty.");
      return;
    }
    if (!communityGuidelines.trim()) {
        setError("Community guidelines cannot be empty.");
        return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const input: ModeratePostInput = { postContent, communityGuidelines };
      const moderationResult = await moderatePost(input);
      setResult(moderationResult);
    } catch (err) {
      console.error("Moderation error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during moderation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center font-headline">AI Moderation Assistant</CardTitle>
        <CardDescription className="text-center">
          Enter post content and community guidelines to get an AI-powered moderation suggestion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="postContent" className="text-lg font-medium">Post Content</Label>
            <Textarea
              id="postContent"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Enter the user's post content here..."
              rows={6}
              required
              className="mt-2 text-base bg-background"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="communityGuidelines" className="text-lg font-medium">Community Guidelines</Label>
            <Textarea
              id="communityGuidelines"
              value={communityGuidelines}
              onChange={(e) => setCommunityGuidelines(e.target.value)}
              rows={8}
              required
              className="mt-2 text-sm bg-background"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full text-lg py-3 bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
              </>
            ) : "Analyze Post"}
          </Button>
        </form>
      </CardContent>
      {(result || error) && (
        <CardFooter className="flex flex-col items-start space-y-4 pt-6 border-t">
          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {result && (
            <Alert className={`w-full ${result.isFlagged ? 'border-destructive/50' : 'border-green-500/50'}`}>
              {result.isFlagged ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
              <AlertTitle className={`font-semibold ${result.isFlagged ? 'text-destructive' : 'text-green-700'}`}>
                Moderation Result
              </AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  <strong>Status:</strong> {result.isFlagged ? 'Flagged as potentially inappropriate' : 'Seems OK'}
                </p>
                {result.isFlagged && result.flagReason && (
                  <p><strong>Reason:</strong> {result.flagReason}</p>
                )}
                <div>
                  <p className="mb-1">
                    <strong>Confidence Score:</strong> {(result.confidenceScore * 100).toFixed(0)}%
                  </p>
                  <Progress value={result.confidenceScore * 100} className={`h-2 ${result.isFlagged ? '[&>*]:bg-destructive' : '[&>*]:bg-green-600'}`} />
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
