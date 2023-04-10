import { ReactNode, ReactElement } from 'react';
export const searchByProp = (node: ReactNode, { propName, propValue }: { propName: string; propValue: any }): boolean => {
  return (node as ReactElement)?.props?.[propName] === propValue;
};

export function searchByClasses(classes: string[]): (node: React.ReactElement) => boolean {
  return (node: React.ReactElement) => classes.every(cls => node?.props?.className?.split(' ').includes(cls));
}

export function searchById(id: string): (node: React.ReactElement) => boolean {
  return (node: React.ReactElement) => node?.props?.id === id;
}
