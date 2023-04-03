import React from "react";

import { Events } from "@/_typings/events";

export default function useEvent(eventName: Events) {
  const [data, setData] = React.useState({});

  const onEvent = React.useCallback((e: CustomEvent) => setData(e.detail), []);

  React.useEffect(() => {
    document.addEventListener(eventName.toString(), onEvent as EventListener, false);
    return () => document.removeEventListener(eventName.toString(), onEvent as EventListener, false);
  }, [eventName]);

  const fireEvent = React.useCallback((data: Object) => {
    document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }, [eventName]);

  return { data, fireEvent };
}
