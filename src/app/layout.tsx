import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🤖 AI Resume Screening System',
  description: 'Evaluate, score, and rank resumes against any job description using Gemini AI, complete with skill gap analysis and course recommendations.',
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
