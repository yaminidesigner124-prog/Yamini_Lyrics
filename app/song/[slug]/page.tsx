import React from 'react';
import { notFound } from 'next/navigation';
import { getSongBySlug, getSongs, incrementSongStat } from '@/lib/d1';
import SongClientView from '@/components/SongClientView';

interface SongPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const songs = await getSongs({});
  return songs.map((s) => ({
    slug: s.slug,
  }));
}

export async function generateMetadata({ params }: SongPageProps) {
  const { slug } = await params;
  const song = await getSongBySlug(slug);
  if (!song) return { title: 'Song Not Found' };

  return {
    title: `${song.title_roman} • Yamini Lyrics`,
    description: `Complete lyrics for ${song.title_roman} in Telugu script, Roman pronunciation, and English meaning. 1-Click sacred PDF temple border download.`,
  };
}

export default async function SongPage({ params }: SongPageProps) {
  const { slug } = await params;
  const song = await getSongBySlug(slug);

  if (!song) {
    notFound();
  }

  // Increment view count
  await incrementSongStat(slug, 'view');

  // Fetch related songs from same deity
  const relatedSongs = (await getSongs({ categoryId: song.category_id, limit: 4 })).filter(
    (s) => s.id !== song.id
  );

  return <SongClientView song={song} relatedSongs={relatedSongs} />;
}
