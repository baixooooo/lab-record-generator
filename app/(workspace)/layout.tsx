import React from 'react';
import Header from '@/components/header';

export const dynamic = 'force-dynamic';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="labora-workspace min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#0E0E0F] text-[#171717] dark:text-[#F4F4F5] transition-colors duration-200">
      <Header />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
