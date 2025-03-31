import { useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

// Use React's built-in HTMLAttributes type for div elements
export default function ClientOnly({ 
  children, 
  ...delegated 
}: { 
  children: React.ReactNode; 
} & HTMLAttributes<HTMLDivElement>) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <div {...delegated}>{children}</div>;
}