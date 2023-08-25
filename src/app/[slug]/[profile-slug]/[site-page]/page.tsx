import DefaultPage from '@/app/page';
import PropertyPage from '@/app/property/page';

export default function AgentHostedPage(props: any) {
  if (props.params?.['site-page'] === 'property') return <PropertyPage {...props} />;
  return <DefaultPage {...props} />;
}
