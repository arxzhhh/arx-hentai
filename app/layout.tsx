export const metadata = {
  title: 'Hentai Booru Viewer',
  description: 'Browse hentai images with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
