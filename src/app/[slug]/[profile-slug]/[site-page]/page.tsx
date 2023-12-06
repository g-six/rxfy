import DefaultPage from '@/app/page';
import PropertyPage from '@/app/property/page';
import MyAllProperties from '../../my-all-properties/page';

export default function AgentHostedPage(props: any) {
  if (props.params?.['site-page'] === 'property') return <PropertyPage {...props} />;
  if (props.params?.['site-page'] === 'my-saved-properties') return <MyAllProperties {...props} />;
  return <DefaultPage {...props} />;
}
