export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p>&copy; {currentYear} Zenith Forums. All rights reserved.</p>
        <p className="mt-1">
          Powered by Next.js and a passion for community.
        </p>
      </div>
    </footer>
  );
}
