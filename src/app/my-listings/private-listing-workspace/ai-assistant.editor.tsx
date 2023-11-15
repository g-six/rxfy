import { Children, ReactElement, cloneElement } from 'react';
import { AgentData } from '@/_typings/agent';
import { PrivateListingModel } from '@/_typings/private-listing';
import MyListingsPhotoUploaderComponent from './components/photo-uploader.component';
import MyListingsPhotoBucketComponent from './components/photo-bucket.component';
import MyListingAiAssistantButton from './components/ai-assistant/button.my-listing-ai-assistant';
import MyListingsAiInputComponent from './components/ai-input.component';
import MyListingsAddressInputComponent from './components/address-input.component';

function Rexify({ children, ...data }: { agent: AgentData; listing?: PrivateListingModel; children: ReactElement }) {
  const Rexified = Children.map(children, c => {
    if (c.props && c.props.children) {
      let { children: components, className = '', ...props } = c.props;
      className = `${className}${className && ' '}rexified`;

      if (typeof components !== 'string') {
        // Rexify workspace tabs
        if (className.includes('card-upload-wrapper')) {
          return (
            <MyListingsPhotoUploaderComponent listing={data.listing} className={className}>
              {components}
            </MyListingsPhotoUploaderComponent>
          );
        }
        if (className.includes('image-bank')) {
          return (
            <MyListingsPhotoBucketComponent listing={data.listing} className={className}>
              {components}
            </MyListingsPhotoBucketComponent>
          );
        }
        if (data.listing?.id) {
          if (className.includes('get-started')) {
            return <></>;
          }
        } else {
          if (className.includes('modal-base') && className.includes('existing')) {
            return <></>;
          }
        }
        return cloneElement(c, { className }, <Rexify {...data}>{components}</Rexify>);
      }

      if (className.includes('w-button') && components)
        return (
          <MyListingAiAssistantButton listing={data.listing} className={className}>
            <>{components}</>
          </MyListingAiAssistantButton>
        );
    }
    if (c.props?.className?.includes('ai-prompt-input')) {
      return <MyListingsAiInputComponent {...c.props} />;
    }
    if (c.props?.className?.includes('address-input')) {
      return <MyListingsAddressInputComponent {...c.props} />;
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default async function MyListingsAiAssistantEditor({ children, ...data }: { agent: AgentData; listing?: PrivateListingModel; children: ReactElement }) {
  return <Rexify {...data}>{children}</Rexify>;
}
