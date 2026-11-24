'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/manage');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian text-gold-radiant">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gold-radiant border-t-transparent rounded-full animate-spin" />
        <span className="font-cinzel text-sm text-gold-champagne tracking-wider">
          Entering Admin Studio...
        </span>
      </div>
    </div>
  );
}
