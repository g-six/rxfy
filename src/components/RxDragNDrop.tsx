import React, { ReactElement, cloneElement, useState } from 'react';
import { DndContext, closestCenter, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
interface ImagePreview extends File {
  preview: string;
}
type Props = {
  files: ImagePreview[];
  reorderFiles: (newOrder: ImagePreview[]) => void;
  deleteFile: (id: number) => void;
  template: ReactElement;
};
interface Item {
  id: string;
  content: string;
  bg: string;
}

export default function RxDragNDrop({ files, template, deleteFile, reorderFiles }: Props) {
  const [templates] = useState(captureMatchingElements(template, [{ elementName: 'item', searchFn: searchByPartOfClass(['card-upload-icon']) }]));

  const sensors = useSensors(useSensor(MouseSensor));
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };
  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (active.las !== over.id) {
      const oldIndex = files.findIndex(item => item.lastModified === active.id);
      const newIndex = files.findIndex(item => item.lastModified === over.id);
      const newItems = [...files];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      reorderFiles(newItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={event => {
        console.log('dragEnd called');
      }}
    >
      <SortableContext items={files.map(item => item.lastModified)} strategy={horizontalListSortingStrategy}>
        <div className={template.props.className}>
          {files.map(item => (
            <SortableItem template={templates.item} item={item} key={item.lastModified} id={item.lastModified} deleteFile={deleteFile} />
          ))}
        </div>
      </SortableContext>
      {/* <DragOverlay>{activeId ? <SortableItem item={templates.item} id={activeId} active={true} /> : null}</DragOverlay> */}
    </DndContext>
  );
}

interface SortableItemProps {
  id: number;
  deleteFile: (id: number) => void;
  template: ReactElement;
  item: ImagePreview;
}

const SortableItem = ({ id, template, item, deleteFile }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const [temaplates] = useState(
    captureMatchingElements(template, [
      {
        elementName: 'preview',
        searchFn: searchByPartOfClass(['card-upload-icon']),
      },
      {
        elementName: 'closeIcon',
        searchFn: searchByPartOfClass(['delete-icon']),
      },
    ]),
  );

  return (
    <div ref={setNodeRef} style={style} className='relative group opacity-100 '>
      {cloneElement(
        temaplates.preview,
        {
          ...listeners,
          ...attributes,
          className: `${temaplates.preview.props.className} `,
          style: {
            cursor: `${isDragging ? 'grabbing' : 'grab'}`,
            backgroundImage: item.preview ? `url(${item.preview})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: '0% 50%',
            backgroundRepeat: 'no-repeat',
            opacity: '1',
            objectFit: 'cover',
          },
        },
        [],
      )}{' '}
      {cloneElement(temaplates.closeIcon, {
        className: `${temaplates.closeIcon.props.className} hidden group-hover:flex cursor-pointer z-100`,
        onClick: () => {
          deleteFile(id);
        },
      })}
    </div>
  );
};
