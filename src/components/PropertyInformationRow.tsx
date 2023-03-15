import { HTMLNode } from '@/_typings/elements';
import { MLSProperty } from '@/_typings/property';
import {
  general_stats,
  financial_stats,
  formatValues,
  combineAndFormatValues,
  dimension_stats,
  construction_stats,
} from '@/_utilities/data-helpers/property-page';
import { Element } from 'domhandler';

export function PropertyInformationRow(
  props: Record<string, string>
) {
  return (
    <div className={props.wrapper_class}>
      <div className={props.label_class}>{props.label}</div>
      <div className={props.value_class}>{props.value}</div>
    </div>
  );
}

export function RexifyStatBlock({
  node,
  record,
  groupName,
}: {
  node: Element;
  record: MLSProperty;
  groupName:
    | 'propinfo'
    | 'financial'
    | 'dimensions'
    | 'construction';
}) {
  let stat_keys = general_stats;
  switch (groupName) {
    case 'financial':
      stat_keys = financial_stats;
      break;
    case 'dimensions':
      stat_keys = dimension_stats;
      break;
    case 'construction':
      stat_keys = construction_stats;
      break;
  }

  if (node instanceof Element && node.attribs) {
    if (
      node.attribs &&
      node.attribs.class &&
      node.attribs.class.indexOf(groupName) >= 0
    ) {
      const RowItem = node.children.find((child) => {
        const { attribs: wrapper_attribs } = child as {
          attribs: Record<string, string>;
        };

        return (
          wrapper_attribs.class &&
          wrapper_attribs.class.indexOf(
            'div-stat-name-and-result'
          ) >= 0
        );
      }) as HTMLNode | undefined;
      const SectionTitle = node.children.find((child) => {
        const { attribs: wrapper_attribs } = child as {
          attribs: Record<string, string>;
        };

        return (
          wrapper_attribs.class &&
          wrapper_attribs.class.indexOf('stat-name') >= 0
        );
      }) as HTMLNode | undefined;

      if (node.attribs.class && RowItem && SectionTitle) {
        return (
          <div className={node.attribs.class}>
            <div className={SectionTitle.attribs.class}>
              <div
                className={SectionTitle.firstChild.attribs.class}
              >
                {SectionTitle.firstChild.firstChild?.data}
              </div>
            </div>
            {Object.keys(stat_keys).map((key) => {
              let value = formatValues(
                record[key] as string | number,
                key
              );

              if (groupName === 'financial') {
                switch (key) {
                  case 'L_GrossTaxes':
                    value = combineAndFormatValues({
                      L_GrossTaxes: record.L_GrossTaxes,
                      ForTaxYear: record.ForTaxYear,
                    });
                    break;
                }
              }

              return (
                <PropertyInformationRow
                  key={key}
                  wrapper_class={RowItem.attribs.class}
                  label_class={RowItem.firstChild.attribs.class}
                  value_class={RowItem.lastChild.attribs.class}
                  label={stat_keys[key] as string}
                  value={value}
                />
              );
            })}
          </div>
        );
      }
    }
  }

  return <></>;
}
