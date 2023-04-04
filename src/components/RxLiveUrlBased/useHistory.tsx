'use client';
import React from 'react';

const useHistory = () => {
  const [location, setLocation] = React.useState<Location>();

  React.useEffect(() => {
    const fnListener = () => {
      if (typeof window.location !== 'undefined') {
        console.log('test');
        setLocation(window.location);
      }
    };
    window.addEventListener('popstate', fnListener);

    return () => {
      window.removeEventListener('popstate', fnListener);
    };
  }, []);

  return location;
};

export default useHistory;
