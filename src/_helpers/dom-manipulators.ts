import { cloneDeep } from 'lodash';
import React, { Children, cloneElement, ReactElement, ReactNode } from 'react';

interface Props {
  [key: string]: any;
}

interface Match {
  propName: string;
  propValue: any;
  addedProps?: Props | undefined;
  transformChild?: (child: React.ReactElement) => React.ReactElement;
}

export type BracesReplacements = { [key: string]: any };

export function addPropsToMatchingElements(children: React.ReactNode, matches: Match[]): React.ReactNode {
  return Children.map(children, child => {
    if (React.isValidElement(child)) {
      let newProps = { ...child.props };
      matches.forEach(({ propName, propValue, addedProps = {} }) => {
        if (child.props[propName] === propValue) {
          newProps = { ...newProps, ...addedProps };
        }
      });
      if (child.props.children) {
        const newChildren = addPropsToMatchingElements(child.props.children, matches);
        return cloneElement(child, newProps, newChildren);
      }
      return cloneElement(child, newProps);
    }
    return child;
  });
}

export function changePropsToMatchingElements(children: React.ReactNode, matches: Match[]): React.ReactNode {
  return Children.map(children, child => {
    if (React.isValidElement(child)) {
      let newProps = { ...child.props };
      matches.forEach(({ propName, propValue, addedProps }) => {
        if (child.props[propName] === propValue) {
          newProps = { ...newProps, ...(addedProps || {}) };
        }
      });
      if (child.props.children) {
        const newChildren = changePropsToMatchingElements(child.props.children, matches);
        return cloneElement(child, newProps, newChildren);
      }
      return cloneElement(child, newProps);
    }
    return child;
  });
}

export function replaceElements(nodes: React.ReactNode[], capturedElements: { element: React.ReactElement | React.ReactNode; path: number[] }[]) {
  const replacedNodes = [...nodes];

  capturedElements.forEach(({ element, path }) => {
    let currentNode: any = [...nodes];

    for (let i = 0; i < path.length - 1; i++) {
      currentNode = currentNode?.[path[i]]?.props?.children;
    }
    if (currentNode) {
      replacedNodes[path[path.length - 1]] = element;
    }
  });

  return replacedNodes;
}

export function changeElementTag(element: React.ReactElement, newTag: string): React.ReactElement {
  const { type: OldTag, key, ref, ...otherProps } = element.props;

  return React.createElement(newTag, { key, ref, ...otherProps }, element.props.children);
}
type Element = React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactNode;

export interface tMatch {
  searchFn: (node: ReactElement) => boolean;
  transformChild: (child: ReactElement) => ReactElement;
}

export function transformMatchingElements(nodes: ReactNode, matches: tMatch[]): ReactNode {
  return React.Children.map(nodes, node => {
    if (React.isValidElement(node)) {
      const match = matches.find(m => m.searchFn(node));
      if (match) {
        const transformedChild = match.transformChild(node);
        return React.cloneElement(transformedChild, {
          children: transformMatchingElements(transformedChild.props.children, matches),
        });
      } else {
        return React.cloneElement(node as ReactElement, {
          children: transformMatchingElements(node.props.children, matches),
        });
      }
    } else {
      return node;
    }
  });
}

// FUNCTION FOR CAPTURING ELEMENTS for example - element templates
interface ElementCapturer {
  searchFn: (child: React.ReactElement) => boolean;
  elementName: string;
}

export function captureMatchingElements(
  nodes: React.ReactNode,
  elementsToCapture: ElementCapturer[],
  capturedElements: Record<string, React.ReactElement> = {},
): Record<string, React.ReactElement> {
  React.Children.forEach(nodes, (node: React.ReactNode) => {
    if (!React.isValidElement(node)) {
      return;
    }

    const child = node as React.ReactElement;

    elementsToCapture.forEach(elementToCapture => {
      const { searchFn, elementName } = elementToCapture;

      if (searchFn(child) && !capturedElements[elementName]) {
        capturedElements[elementName] = child;
      }
    });

    if (child.props.children) {
      captureMatchingElements(child.props.children, elementsToCapture, capturedElements);
    }
  });

  return capturedElements;
}

export function replaceTextWithBraces(node: React.ReactNode, replacement: string): React.ReactNode {
  if (typeof node === 'string') {
    return node.replace(/{.+}/, replacement);
  } else if (React.isValidElement(node)) {
    const { children, ...props } = node.props;
    const newChildren = React.Children.map(children, child => replaceTextWithBraces(child, replacement));
    return React.createElement(node.type, props, newChildren);
  } else if (Array.isArray(node)) {
    return node.map(child => replaceTextWithBraces(child, replacement));
  }

  return node;
}

export function removeKeys<T extends object, K extends keyof T>(obj: T, keysToRemove: K[]): Omit<T, K> {
  const newObj = { ...cloneDeep(obj) } as any;

  keysToRemove.forEach(key => {
    delete newObj[key];
  });

  return newObj;
}

export function replaceAllTextWithBraces(element: React.ReactNode, replacements: BracesReplacements): React.ReactNode {
  if (typeof element === 'string') {
    let result = element;
    Object.entries(replacements).forEach(([brValue, rValue]) => {
      const pattern = new RegExp(`{${brValue}}`, 'g');
      result = result.replace(pattern, rValue);
    });
    return result;
  } else if (Array.isArray(element)) {
    return element.map(child => replaceAllTextWithBraces(child, replacements));
  } else if (React.isValidElement(element)) {
    const props = { ...element.props };
    if (props.children) {
      props.children = replaceAllTextWithBraces(props.children, replacements);
    }
    return React.cloneElement(element, props);
  } else {
    return element;
  }
}
