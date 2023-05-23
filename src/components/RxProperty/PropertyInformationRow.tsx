import { HTMLNode } from '@/_typings/elements';
import { BathroomDetails, MLSProperty, PropertyDataModel } from '@/_typings/property';
import {
  general_stats,
  financial_stats,
  formatValues,
  combineAndFormatValues,
  dimension_stats,
  construction_stats,
  getRoomPlusLevelText,
} from '@/_utilities/data-helpers/property-page';
import { Element } from 'domhandler';

export function PropertyInformationRow(props: Record<string, string>) {
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
  record: PropertyDataModel;
  groupName: 'propinfo' | 'financial' | 'dimensions' | 'construction';
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
    if (node.attribs && node.attribs.class && node.attribs.class.indexOf(groupName) >= 0) {
      const RowItem = node.children.find(child => {
        const { attribs: wrapper_attribs } = child as {
          attribs: Record<string, string>;
        };

        return wrapper_attribs.class && wrapper_attribs.class.indexOf('div-stat-name-and-result') >= 0;
      }) as HTMLNode | undefined;
      const SectionTitle = node.children.find(child => {
        const { attribs: wrapper_attribs } = child as {
          attribs: Record<string, string>;
        };

        return wrapper_attribs.class && wrapper_attribs.class.indexOf('stat-name') >= 0;
      }) as HTMLNode | undefined;

      if (node.attribs.class && RowItem && SectionTitle) {
        return (
          <div className={node.attribs.class}>
            <div className={SectionTitle.attribs.class}>
              <div className={SectionTitle.firstChild.attribs.class}>{SectionTitle.firstChild.firstChild?.data}</div>
            </div>
            {Object.keys(stat_keys).map(key => {
              if (groupName === 'construction') {
                console.log({ groupName, key });
                if (record.build_features?.data) {
                  const build_data = record.build_features.data;
                  if (key === 'construction_information') {
                    const exterior = build_data
                      .filter(({ attributes }) => attributes.name.toLowerCase().indexOf('construction') >= 0)
                      .map(({ attributes }) => attributes.name.split(' - ').pop())
                      .join(' • ');
                    return (
                      <PropertyInformationRow
                        key={key}
                        wrapper_class={[RowItem.attribs.class, key].join(' ')}
                        label_class={RowItem.firstChild.attribs.class}
                        value_class={RowItem.lastChild.attribs.class}
                        label='Exterior'
                        value={exterior}
                      />
                    );
                  }
                  if (key === 'flooring') {
                    const flooring = build_data
                      .filter(({ attributes }) => attributes.name.toLowerCase().indexOf('flooring') >= 0)
                      .map(({ attributes }) => attributes.name.split(' - ').pop())
                      .join(' • ');
                    return (
                      flooring && (
                        <PropertyInformationRow
                          key={key}
                          wrapper_class={[RowItem.attribs.class, key].join(' ')}
                          label_class={RowItem.firstChild.attribs.class}
                          value_class={RowItem.lastChild.attribs.class}
                          label='Flooring'
                          value={flooring}
                        />
                      )
                    );
                  }
                }
              }
              let value = formatValues(record, key);

              // We don't want to display null values
              if (!value) return;

              if (groupName === 'financial') {
                switch (key) {
                  case 'gross_taxes':
                    value = combineAndFormatValues(record as unknown as Record<string, string | number>, 'gross_taxes', 'tax_year');
                    break;
                }
              }

              // Rooms
              if (key === 'room_details' && record.room_details) {
                let levels: {
                  [level: string]: {
                    name: string;
                    measurement: string;
                  }[];
                } = {};
                record.room_details.rooms.forEach(room => {
                  levels = {
                    ...levels,
                    [room.level]: [
                      ...(levels[room.level] || []),
                      {
                        name: room.type,
                        measurement: room.width && room.length ? [room.width, room.length].join(' x ') : '',
                      },
                    ],
                  };
                });
                return (
                  <>
                    {Object.keys(levels).map(lvl => {
                      return (
                        <div key={lvl} className={[RowItem.attribs.class, key].join(' ')}>
                          <div className={`${RowItem.firstChild.attribs.class} flex items-start self-start justify-start flex-grow h-full`}>
                            {lvl || 'Other'}
                          </div>
                          <div className={`${RowItem.lastChild.attribs.class} w-56`}>
                            <ul className='list-none w-full text-left p-0'>
                              {levels[lvl]
                                .filter(({ measurement }) => measurement)
                                .map((room, num) => (
                                  <li key={`${room.name}-${num + 1}`} className='flex text-left gap-2 items-center'>
                                    <span className='flex-1'>{room.name}</span> <span className='console'>{room.measurement}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                    {/* <div key={`${room.level}-${room.type}`} className={RowItem.firstChild.attribs.class}>{room.level ? getRoomPlusLevelText(room.type, room.level) : room.type}</div>;
                    <div key={`${room.level}-${room.type}`}>{room.level ? getRoomPlusLevelText(room.type, room.level) : room.type}</div>; */}
                  </>
                );
              }

              // Bathooms
              if (key === 'bathroom_details' && record.bathroom_details) {
                let levels: {
                  [level: string]: BathroomDetails[];
                } = {};
                record.bathroom_details.baths.forEach(room => {
                  levels = {
                    ...levels,
                    [room.level]: [...(levels[room.level] || []), room],
                  };
                });
                return (
                  <>
                    {Object.keys(levels).map(lvl => {
                      return (
                        <div key={lvl} className={[RowItem.attribs.class, key].join(' ')}>
                          <div className={`${RowItem.firstChild.attribs.class} flex items-start self-start justify-start flex-grow h-full`}>
                            {lvl || 'Other'} Bathrooms
                          </div>
                          <div className={RowItem.lastChild.attribs.class}>
                            <ul className='list-none p-0'>
                              {levels[lvl].map((room, num) => (
                                <li key={`${room.level}-${num + 1}`}>
                                  {room.pieces}
                                  {room.pieces && '-pc'} {room.ensuite === 'Yes' ? 'Ensuite' : ''} Bath
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                    {/* <div key={`${room.level}-${room.type}`} className={RowItem.firstChild.attribs.class}>{room.level ? getRoomPlusLevelText(room.type, room.level) : room.type}</div>;
                    <div key={`${room.level}-${room.type}`}>{room.level ? getRoomPlusLevelText(room.type, room.level) : room.type}</div>; */}
                  </>
                );
              }

              return value && (typeof value === 'string' || typeof value === 'number') ? (
                <PropertyInformationRow
                  key={key}
                  wrapper_class={[RowItem.attribs.class, key].join(' ')}
                  label_class={RowItem.firstChild.attribs.class}
                  value_class={RowItem.lastChild.attribs.class}
                  label={stat_keys[key] as string}
                  value={value}
                />
              ) : (
                <></>
              );
            })}
          </div>
        );
      }
    }
  }

  return <></>;
}
