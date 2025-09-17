import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Raspay Demo',
  description: 'Prototipo de raspadita liviana',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
