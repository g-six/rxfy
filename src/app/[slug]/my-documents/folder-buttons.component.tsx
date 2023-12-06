import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { ReactElement } from 'react';

export default function MyDocumentsToggleFolderActions({ children, ...attr }: { children: ReactElement; 'folder-id': number }) {
  const { data, fireEvent } = useEvent(Events.DocFolderShow);
  const { active_folder } = data as unknown as { active_folder: number };
  return (
    <button
      {...attr}
      onClick={() => {
        if (active_folder) fireEvent({ active_folder: undefined } as unknown as EventsData);
        else fireEvent({ active_folder: attr['folder-id'] } as unknown as EventsData);
      }}
    >
      {children}
    </button>
  );
}
