import { Children, ReactElement, cloneElement } from 'react';
import { AgentData } from '@/_typings/agent';
import MyListingsAiAssistantEditor from './ai-assistant.editor';
import { PrivateListingModel } from '@/_typings/private-listing';
import MyListingsAddressEditor from './address.editor';
import { MyListingsHomeSummaryEditor } from './home-summary.editor';
import { MyListingsSizeEditor } from './size.editor';
import { MyListingsRoomsEditor } from './rooms.editor';

function Rexify({ children, ...data }: { agent: AgentData; listing?: PrivateListingModel; children: ReactElement }) {
  const Rexified = Children.map(children, c => {
    if (c.props && c.props.children && typeof c.props.children !== 'string') {
      let { children: components, className = '', ...props } = c.props;
      className = `${className}${className && ' '}rexified`;

      // Rexify workspace tabs, TODO in Webflow - add data-group="ai | address | summary | etc..." use it instead
      // of data-w-tab
      if (props['data-w-tab']) {
        switch (props['data-w-tab']) {
          case 'ai':
            return cloneElement(
              c,
              { className, 'data-rx': 'MyListingsAiAssistantEditor' },
              <MyListingsAiAssistantEditor {...data}>{components}</MyListingsAiAssistantEditor>,
            );
          case 'Tab 2':
            return cloneElement(
              c,
              { className, 'data-rx': 'MyListingsAddressEditor' },
              <MyListingsAddressEditor {...data}>{components}</MyListingsAddressEditor>,
            );
          case 'Tab 3':
            return cloneElement(
              c,
              { className, 'data-rx': 'MyListingsHomeSummaryEditor' },
              <MyListingsHomeSummaryEditor {...data}>{components}</MyListingsHomeSummaryEditor>,
            );
          case 'Tab 4':
            return cloneElement(c, { className, 'data-rx': 'MyListingsSizeEditor' }, <MyListingsSizeEditor {...data}>{components}</MyListingsSizeEditor>);
          case 'Tab 5':
            return cloneElement(c, { className, 'data-rx': 'MyListingsRoomsEditor' }, <MyListingsRoomsEditor {...data}>{components}</MyListingsRoomsEditor>);
        }
      }

      return cloneElement(c, { className }, <Rexify {...data}>{components}</Rexify>);
    }
    return c;
  });
  return <>{Rexified}</>;
}

export default async function MyListingsWorkspacePanels({ children, ...data }: { agent: AgentData; listing?: PrivateListingModel; children: ReactElement }) {
  return <Rexify {...data}>{children}</Rexify>;
}
