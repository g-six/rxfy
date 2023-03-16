export interface BaseNode {
  attribs: Record<string, string>;
  data?: string;
}

export interface HTMLNode extends BaseNode {
  name: string;
  firstChild: HTMLNode;
  lastChild: HTMLNode;
  children: HTMLNode[];
}
