import Head from 'next/head';
import { initializeIcons } from '@fluentui/react';
import RoadmapDashboard from '../components/RoadmapDashboard';

// Initialize FluentUI icons
if (typeof window !== 'undefined') {
  initializeIcons();
}

export default function Home() {
  return (
    <>
      <Head>
        <title>ROADMAP 2025</title>
        <meta name="description" content="Interactive roadmap for ongoing projects that are being led, supported, or promoted" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ background: '#121212', color: '#ffffff', minHeight: '100vh' }}>
        <RoadmapDashboard />
      </main>
    </>
  );
}