import { Children, ReactElement, cloneElement } from 'react';
import { AgentData } from '@/_typings/agent';
import MyWebSiteSelectedTheme from './SelectedTheme.module';
import RxSearchEngineOptimizationTab from './seo.rexifier';
import RxTrackingCodes from './tracking-codes.rexifier';
import RxThemes from './themes-explorer.rexifier';
import DomainHowButton from './DomainHowButton.module';
import DomainHowModal from './DomainHowModal.module';
import { Events } from '@/hooks/useFormEvent';
import SaveWebsiteUrlButton from './website-url-save-button.module';
import WebsiteURLInput from './website-url-input.module';

export function Rexify({ children, ...props }: { children: ReactElement; realtor: AgentData }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children && typeof c.props?.children !== 'string') {
      const { className, children: sub, ...wrapper } = c.props;
      if (className?.includes('selected-theme')) {
        return <MyWebSiteSelectedTheme {...props}>{c}</MyWebSiteSelectedTheme>;
      }
      if (className?.includes('tab-pane')) {
        if (wrapper['data-w-tab'] === 'Tab 2') {
        }
        if (wrapper['data-w-tab'] === 'Tab 2') {
          return <RxSearchEngineOptimizationTab realtor={props.realtor}>{c}</RxSearchEngineOptimizationTab>;
        }
        if (wrapper['data-w-tab'] === 'Tab 3') {
          return <RxTrackingCodes realtor={props.realtor}>{c}</RxTrackingCodes>;
        }
        if (wrapper['data-w-tab'] === 'Tab 4') {
          return <RxThemes realtor={props.realtor}>{c}</RxThemes>;
        }
      }
      if (className?.includes('alert-regular')) {
        return <DomainHowButton className={className}>{sub}</DomainHowButton>;
      }
      if (className?.includes('domain-instructions')) {
        return <DomainHowModal className={className}>{sub}</DomainHowModal>;
      }
      return cloneElement(c, {}, <Rexify {...props}>{sub}</Rexify>);
    }

    if (c.props?.['data-input'] === 'domain_name') {
      return <WebsiteURLInput {...c.props} />;
    }

    if (c.props?.['data-action'] === 'save') {
      const { children: sub, className, ...wrapper } = c.props;
      return (
        <SaveWebsiteUrlButton {...wrapper} className={className}>
          {sub}
        </SaveWebsiteUrlButton>
      );
    }
    return c;
  });
  return <>{Rexified}</>;
}
