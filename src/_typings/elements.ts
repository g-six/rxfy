export interface BaseNode {
  attribs: Record<string, string>;
  data: string;
}

export interface HTMLNode extends BaseNode {
  firstChild: HTMLNode;
  lastChild: HTMLNode;
  children: HTMLNode[];
}
