export function searchByProp(propName: string, propValue: any): (node: React.ReactElement) => boolean {
  return (child: React.ReactElement) => {
    return child?.props?.[propName] === propValue;
  };
}

export function searchByClasses(classes: string[]): (node: React.ReactElement) => boolean {
  return (node: React.ReactElement) => classes.every(cls => node?.props?.className?.split(' ').includes(cls));
}

export function searchById(id: string): (node: React.ReactElement) => boolean {
  return (node: React.ReactElement) => node?.props?.id === id;
}

export function searchByTagName(tag_name: string): (node: React.ReactElement) => boolean {
  return (node: React.ReactElement) => node?.type === tag_name;
}
