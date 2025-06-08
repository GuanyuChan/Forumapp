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
1. 互相尊重：禁止人身攻击、骚扰或仇恨言论。
2. 保持主题相关：讨论内容应与论坛分类相关。
3. 禁止垃圾信息或自我推广：除非在指定区域，否则不允许商业广告。
4. 禁止非法内容：不得分享或推广非法活动。
5. 使用恰当语言：避免过度使用亵渎性或冒犯性词语。
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
      setError("帖子内容不能为空。");
      return;
    }
    if (!communityGuidelines.trim()) {
        setError("社区准则不能为空。");
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
      console.error("审核错误:", err);
      setError(err instanceof Error ? err.message : "审核过程中发生未知错误。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center font-headline">AI 审核助手</CardTitle>
        <CardDescription className="text-center">
          输入帖子内容和社区准则以获取AI驱动的审核建议。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="postContent" className="text-lg font-medium">帖子内容</Label>
            <Textarea
              id="postContent"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="在此输入用户的帖子内容..."
              rows={6}
              required
              className="mt-2 text-base bg-background"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="communityGuidelines" className="text-lg font-medium">社区准则</Label>
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
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 分析中...
              </>
            ) : "分析帖子"}
          </Button>
        </form>
      </CardContent>
      {(result || error) && (
        <CardFooter className="flex flex-col items-start space-y-4 pt-6 border-t">
          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {result && (
            <Alert className={`w-full ${result.isFlagged ? 'border-destructive/50' : 'border-green-500/50'}`}>
              {result.isFlagged ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
              <AlertTitle className={`font-semibold ${result.isFlagged ? 'text-destructive' : 'text-green-700'}`}>
                审核结果
              </AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  <strong>状态:</strong> {result.isFlagged ? '标记为可能不当' : '看起来没问题'}
                </p>
                {result.isFlagged && result.flagReason && (
                  <p><strong>原因:</strong> {result.flagReason}</p>
                )}
                <div>
                  <p className="mb-1">
                    <strong>置信度:</strong> {(result.confidenceScore * 100).toFixed(0)}%
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
