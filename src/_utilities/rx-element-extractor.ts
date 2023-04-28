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

//works this way - if one of provided @classes includes in one of splitted classNames from a child  returns true
export function searchByPartOfClass(classes: string[]): (node: React.ReactElement) => boolean {
  return (node: React.ReactElement) => {
    const nodeClasses = node?.props?.className?.split(' ');
    if (!nodeClasses) return false;
    return nodeClasses.some((nodeClass: string) => {
      return classes.some(part => nodeClass.includes(part));
    });
  };
}

export function searchByTagName(tag_name: string): (node: React.ReactElement) => boolean {
  return (node: React.ReactElement) => node?.type === tag_name;
}
