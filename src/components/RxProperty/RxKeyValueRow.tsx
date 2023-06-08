type Props = {
  className?: string;
  label: string;
  value?: string;
};
export default function RxKeyValueRow(p: Props) {
  return <div {...p}>{p.value || ''}</div>;
}
