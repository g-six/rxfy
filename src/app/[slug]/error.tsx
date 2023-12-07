'use client'; // Error components must be Client Components

import { consoler } from '@/_helpers/consoler';
import { useEffect } from 'react';
const FILE = 'app/[slug]/error.tsx';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    consoler(FILE, 'An unhandled client error has occurred', error);
    console.error(error);
    console.log(error.digest);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  );
}
