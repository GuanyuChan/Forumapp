import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ZenithForumsLogo } from "@/components/icons/ZenithForumsLogo";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl">
         <CardHeader className="text-center space-y-2">
          <Link href="/" className="inline-block mx-auto mb-4" aria-label="11A4008深论坛 首页">
            <ZenithForumsLogo className="h-10 w-auto" />
          </Link>
          <CardTitle className="text-2xl font-bold font-headline">创建账户</CardTitle>
          <CardDescription>立即加入 11A4008深论坛!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input id="username" placeholder="选择一个用户名" required className="bg-background"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" placeholder="you@example.com" required className="bg-background"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" type="password" required className="bg-background"/>
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirm-password">确认密码</Label>
            <Input id="confirm-password" type="password" required className="bg-background"/>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">注册</Button>
           <p className="text-center text-sm text-muted-foreground">
            已经有账户了?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
