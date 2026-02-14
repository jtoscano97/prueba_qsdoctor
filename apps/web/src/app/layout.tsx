import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RedactGuard — Zero-Trust Data Sanitization',
  description: 'Erradica filtraciones por redacciones defectuosas. Motor de destrucción criptográfica irreversible.',
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
