'use client';
import React from 'react';
import styles from './RxMyCompareDashboardPage.module.scss';
import { LoveDataModel } from '@/_typings/love';
import { RxButton } from '../RxButton';
import { Events } from '@/_typings/events';
import { RxEmail } from '../RxEmail';
import { RxPassword } from '../RxPassword';
import RxPropertyCard from '../RxPropertyCard';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import { AgentData } from '@/_typings/agent';
import { MLSProperty, PropertyDataModel } from '@/_typings/property';
type MyCompareDashboardPage = {
  className: string;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  ['agent-data']: AgentData;
  ['data-loved']: PropertyDataModel[];
};

function PageIterator(props: MyCompareDashboardPage) {
  const wrappedChildren = React.Children.map(props.children, child => {
    const child_node = child as React.ReactElement;

    if (child_node.type === 'input') {
      if (child_node.props.type === 'submit') {
        return (
          <RxButton {...child_node.props} rx-event={Events.Login} id={`${Events.Login}-trigger`} disabled={props.disabled} loading={props.loading}>
            {child_node.props.value}
          </RxButton>
        );
      }
      if (child_node.props.className) {
        if (child_node.props.className.split(' ').includes('txt-email')) {
          return <RxEmail {...child_node.props} rx-event={Events.Login} name='email' />;
        }
        if (child_node.props.className.split(' ').includes('txt-password')) {
          return <RxPassword {...child_node.props} rx-event={Events.Login} name='password' />;
        }
      }
      return <input {...child_node.props} className={[child_node.props.className || '', 'rexified'].join(' ')} />;
    } else if (child_node.props && child_node.props.children) {
      if (child_node.props.className && child_node.props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.MY_COMPARE_DASHBOARD_LEFT)) {
        // Property Cards
        const [PlaceholderCard] = child_node.props.children.filter((c: React.ReactElement) =>
          c.props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.PROPERTY_CARD),
        );
        return (
          <section className={`${child_node.props.className} rexified`}>
            {child_node.props.children.filter((c: React.ReactElement) => {
              return c.props.className && !c.props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.PROPERTY_CARD);
            })}
            {props['data-loved'].map((p: PropertyDataModel, sequence_no: number) => {
              const { mls_id: MLS_ID, title: Address, asking_price: AskingPrice, area: Area, beds, baths, sqft, ...listing } = p;
              return (
                <RxPropertyCard
                  key={p.mls_id}
                  listing={{
                    ...(listing as unknown as MLSProperty),
                    MLS_ID,
                    Address,
                    AskingPrice,
                    Area,
                    L_BedroomTotal: beds || 1,
                    L_TotalBaths: baths || 1,
                    L_FloorArea_Total: sqft || 0,
                  }}
                  sequence={sequence_no}
                  agent={props['agent-data'].id}
                >
                  {PlaceholderCard}
                </RxPropertyCard>
              );
            })}
          </section>
        );
      }
      return React.cloneElement(
        {
          ...child_node,
        },
        {
          ...child_node.props,
          // Wrap grandchildren too
          children: <PageIterator {...props}>{child_node.props.children}</PageIterator>,
        },
      );
    } else return child;
  });

  return <>{wrappedChildren}</>;
}

export default function RxMyCompareDashboardPage(props: MyCompareDashboardPage) {
  const agent_data = props['agent-data'];
  const [properties, setProperties] = React.useState<PropertyDataModel[]>([]);
  let local_loves: string[] = [];
  const processLovedHomes = ({ records }: { records: LoveDataModel[] }) => {
    local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
    const loved: PropertyDataModel[] = [];
    records.forEach(({ property }) => {
      loved.push(property);
      if (!local_loves.includes(property.mls_id)) {
        local_loves.push(property.mls_id);
      }
    });
    setProperties(loved);
    setData(Events.LovedItem, JSON.stringify(local_loves));
  };
  React.useEffect(() => {
    getLovedHomes().then(processLovedHomes);
  }, []);
  return (
    <section className={`${styles.Wrapper} ${props.className} rexified`} data-agent-id={agent_data.agent_id}>
      <PageIterator {...props} data-loved={properties} />
    </section>
  );
}
