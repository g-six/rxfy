export function convertDivsToSpans(el: React.ReactElement) {
  if (el.type === 'div') return <span {...el.props}>{el.props.children}</span>;
  return el;
}
