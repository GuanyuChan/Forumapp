'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Bell, HomeIcon } from 'lucide-react';
import { ZenithForumsLogo } from '@/components/icons/ZenithForumsLogo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '首页', icon: HomeIcon },
];

export function Header() {
  const pathname = usePathname();

  const NavLink = ({ href, label, icon: Icon }: typeof navItems[0] & { icon: React.ElementType }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        pathname === href ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
  
  const MobileNavLink = ({ href, label, icon: Icon }: typeof navItems[0] & { icon: React.ElementType }) => (
     <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
         pathname === href ? "bg-primary/10 text-primary" : "text-foreground/80 hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="11A4008深论坛 首页">
          <ZenithForumsLogo className="h-8 w-auto" />
        </Link>

        {navItems.length > 0 && (
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" aria-label="通知">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="打开菜单">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-4">
                <div className="flex flex-col space-y-3">
                  {navItems.map((item) => (
                     <MobileNavLink key={item.href} {...item} />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
