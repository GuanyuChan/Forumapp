export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p>&copy; {currentYear} 11A4008深论坛. 版权所有.</p>
        <p className="mt-1">
          由 Next.js 和对社区的热情驱动.
        </p>
      </div>
    </footer>
  );
}
