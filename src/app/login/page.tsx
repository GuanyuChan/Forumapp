import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ZenithForumsLogo } from "@/components/icons/ZenithForumsLogo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <Link href="/" className="inline-block mx-auto mb-4" aria-label="11A4008深论坛 首页">
            <ZenithForumsLogo className="h-10 w-auto" />
          </Link>
          <CardTitle className="text-2xl font-bold font-headline">欢迎回来!</CardTitle>
          <CardDescription>登录以继续访问 11A4008深论坛。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" placeholder="you@example.com" required className="bg-background" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
              <Link href="#" className="text-xs text-primary hover:underline">
                忘记密码?
              </Link>
            </div>
            <Input id="password" type="password" required className="bg-background"/>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full bg-primary hover:bg-primary/90">登录</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
