import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';

export function RxSmallPropertyCard(props: Record<string, string>) {
  const [photo] = (props.photos || []) as unknown as string[];
  return (
    <div className={classNames(props.className || '', 'property-card-small smaller relative')}>
      <div className='propcard-image-small shrink-0 w-24 aspect-square bg-cover bg-no-repeat' style={photo ? { backgroundImage: `url(${photo})` } : {}}></div>
      <div className='propcard-small-div'>
        <div className='div-block-9'>
          <div className='price-line'>
            <div className='propcard-price-small'>{formatValues(props, 'AskingPrice')}</div>
            <div className='pcard-small'>
              <div className='propertycard-feature'>
                <div className='propcard-stat'>{formatValues(props, 'L_BedroomTotal')}</div>
                <div className='propcard-stat'>Bed</div>
              </div>
              <div className='propertycard-feature'>
                <div className='propcard-stat'>{formatValues(props, 'L_TotalBaths')}</div>
                <div className='propcard-stat'>Bath</div>
              </div>
              <div className='propertycard-feature'>
                <div className='propcard-stat'>{formatValues(props, 'L_FloorArea_Total')}</div>
                <div className='propcard-stat'>Sqft</div>
              </div>
              <div className='propertycard-feature'>
                <div className='propcard-stat'>{props.year}</div>
              </div>
            </div>
          </div>
          <div className='sold-tag'>
            <div className='text-block-9'>
              <strong className='bold-text'>{props.sold && 'Sold'}</strong>
            </div>
          </div>
        </div>
        <div className='propcard-small-address'>
          <div className='propcard-address capitalize'>{props.address.toLowerCase()}</div>
          <div className='propcard-address truncate text-ellipsis overflow-hidden'>{props.area}</div>
        </div>
        <div className='propertycard-feature-row'>
          <div className='propertycard-feature'>
            <div className='propcard-stat'>{props.beds}</div>
            <div className='propcard-stat'>Bed</div>
          </div>
          <div className='propertycard-feature'>
            <div className='propcard-stat'>{props.baths}</div>
            <div className='propcard-stat'>Bath</div>
          </div>
          <div className='propertycard-feature'>
            <div className='propcard-stat'>{props.sqft}</div>
            <div className='propcard-stat'>Sqft</div>
          </div>
          <div className='propertycard-feature mobno'>
            <div className='propcard-stat'>{props.year}</div>
          </div>
        </div>
      </div>
      <a href={`/property?mls=${props.MLS_ID}`} className='absolute top-0 left-0 w-full h-full'>
        {' '}
      </a>
    </div>
  );
}
