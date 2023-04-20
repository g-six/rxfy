import { MLSProperty } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { DOMNode, domToReact } from 'html-react-parser';
import { ReactElement } from 'react';
export default function RxTable({ rows, data, rowClassName }: { rows: DOMNode[]; data: MLSProperty[]; rowClassName: string }) {
  const elements = domToReact(rows) as unknown as ReactElement[];
  const TableHeadComponents = elements.filter(el => el.props.className !== rowClassName);

  const row_items = elements.filter(el => el.props.className === rowClassName);

  return (
    <div className='building-and-sold-column'>
      {TableHeadComponents}

      {data.map(item => {
        return (
          <div key={item.MLS_ID} className={rowClassName} data-addr={item.Address}>
            {row_items[0].props.children.map((unit: ReactElement) => {
              if (unit.props.children === '{Other Unit No}') {
                return (
                  <a href={`/property?mls=${item.MLS_ID}`} key={unit.key} className={unit.props.className}>
                    Unit {item.AddressUnit}
                  </a>
                );
              }
              if (unit.props.children === '{Other MLS No}') {
                return (
                  <span key={unit.key} className={unit.props.className}>
                    {item.MLS_ID}
                  </span>
                );
              }
              if (unit.props.children === '{Other Price}') {
                return item.SoldPrice ? (
                  <span key={unit.key} className={unit.props.className}>
                    {formatValues(item, 'SoldPrice')}
                  </span>
                ) : null;
              }
              if (unit.props.children === '{Status Chg Date}') {
                return (
                  <span key={unit.key} className={unit.props.className}>
                    {formatValues(item, 'ListingDate')}
                  </span>
                );
              }
              if (unit.props.children === '{Status}') {
                return (
                  <span key={unit.key} className={unit.props.className}>
                    {formatValues(item, 'Status')}
                  </span>
                );
              }
              if (unit.props.children === '{Other Beds}') {
                return (
                  <span key={unit.key} className={unit.props.className}>
                    {item.L_BedroomTotal}
                  </span>
                );
              }
              if (unit.props.children === '{Other Sqft}') {
                return (
                  <span key={unit.key} className={unit.props.className}>
                    {formatValues(item, 'L_FloorArea_GrantTotal')}
                  </span>
                );
              }
              if (unit.props.children === '{Other Sqft}') {
                return (
                  <span key={unit.key} className={unit.props.className}>
                    {formatValues(item, 'L_FloorArea_GrantTotal')}
                  </span>
                );
              } else {
                return (
                  <span key={unit.key} className={unit.props.className}>
                    {formatValues(item, 'AskingPrice')}
                  </span>
                );
              }
            })}
          </div>
        );
      })}
    </div>
  );
}
