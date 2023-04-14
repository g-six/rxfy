import { useEffect, useRef, RefObject } from 'react';

type CallbackFunction = () => void;

const useOutsideClick = (ref: RefObject<HTMLElement>, callback: CallbackFunction) => {
  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return ref;
};

export default useOutsideClick;
