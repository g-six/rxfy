import { useEffect, RefObject, useCallback } from 'react';

type CallbackFunction = () => void;

const useOutsideClick = (ref: RefObject<HTMLElement> | null, callback: CallbackFunction, refMap?: Map<any, any>) => {
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (ref && ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      } else if (refMap && Array.from(refMap.values()).length) {
        Array.from(refMap.values()).forEach(el => {
          if (!el.contains(event.target as Node)) {
            callback();
          }
        });
      }
    },
    [ref, refMap, callback],
  );

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return ref;
};

export default useOutsideClick;
