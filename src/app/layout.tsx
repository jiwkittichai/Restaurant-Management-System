import "./globals.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="font-kanit">{children}</body>
    </html>
  );
}
