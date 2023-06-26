'use client';
import React from 'react';
import { LovedPropertyDataModel } from '@/_typings/property';

function getPrice({ asking_price }: LovedPropertyDataModel) {
  if (asking_price) return '$' + new Intl.NumberFormat().format(asking_price);
  return '';
}
function getFloorArea({ floor_area_total, floor_area_main }: LovedPropertyDataModel) {
  if (floor_area_total) return new Intl.NumberFormat().format(floor_area_total);
  if (floor_area_main) return new Intl.NumberFormat().format(floor_area_main);
  return '';
}

export default function StaticPropertyCard({ property }: { property: LovedPropertyDataModel }) {
  const [attributes, setAttributes] = React.useState<LovedPropertyDataModel>();

  React.useEffect(() => {
    setAttributes(property);
  }, [property]);

  React.useEffect(() => {
    setAttributes(property);
  }, []);
  return (
    <div className='property-card-map property-card'>
      <div className='propcard-image'>
        <div className='area-block'>
          <div className='area-text'>{`{PArea}`}</div>
        </div>
        <div className='compare-control-wrapper'>
          <div className='compare-control-default'>
            <div className='text-block-21'>ADD</div>
            <div className='icon-20 w-embed'>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z' fill='currentColor'></path>
              </svg>
            </div>
          </div>
          <div className='compare-control-added'>
            <div className='text-block-21'>ADDED</div>
          </div>
        </div>
        <div className='heart-empty w-embed'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M16.5 3C19.538 3 22 5.5 22 9C22 16 14.5 20 12 21.5C9.5 20 2 16 2 9C2 5.5 4.5 3 7.5 3C9.36 3 11 4 12 5C13 4 14.64 3 16.5 3ZM12.934 18.604C13.815 18.048 14.61 17.495 15.354 16.903C18.335 14.533 20 11.943 20 9C20 6.64 18.463 5 16.5 5C15.424 5 14.26 5.57 13.414 6.414L12 7.828L10.586 6.414C9.74 5.57 8.576 5 7.5 5C5.56 5 4 6.656 4 9C4 11.944 5.666 14.533 8.645 16.903C9.39 17.495 10.185 18.048 11.066 18.603C11.365 18.792 11.661 18.973 12 19.175C12.339 18.973 12.635 18.792 12.934 18.604V18.604Z'
              fill='currentColor'
            ></path>
          </svg>
        </div>
        <div className='heart-full w-embed'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              stroke='white'
              d='M16.5 3C19.538 3 22 5.5 22 9C22 16 14.5 20 12 21.5C9.5 20 2 16 2 9C2 5.5 4.5 3 7.5 3C9.36 3 11 4 12 5C13 4 14.64 3 16.5 3Z'
              fill='currentColor'
            ></path>
          </svg>
        </div>
        <div className='add-remove-wrapper'>
          <div className='add-to-compare w-embed'>
            <svg width='60' height='60' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M11 11V7H13V11H17V13H13V17H11V13H7V11H11ZM12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20V20Z'
                fill='currentColor'
              ></path>
            </svg>
          </div>
          <div className='remove-compare w-embed'>
            <svg width='60' height='60' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M11 11V7H13V11H17V13H13V17H11V13H7V11H11ZM12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20V20Z'
                fill='currentColor'
              ></path>
            </svg>
          </div>
        </div>
      </div>
      <div className='propcard-details'>
        <div className='price-heart'>
          <div className='price-sold-status'>
            {attributes && <div className='propcard-price map'>{getPrice(attributes)}</div>}
            <div className='sold-tag'>
              <div className='text-block-9'>
                <strong className='bold-text'>SOLD</strong>
              </div>
            </div>
          </div>
        </div>
        <div className='address-area'>
          {attributes && <div className='propcard-address map'>{attributes.title}</div>}
          {attributes && (
            <div className='area-text mobilecard hidden lg:block'>
              {attributes.area || attributes.city || attributes.subarea_community || attributes.complex_compound_name}
            </div>
          )}
        </div>
        <div className='propertycard-feature-row'>
          {attributes && attributes.beds ? (
            <div className='propertycard-feature map'>
              <div className='propcard-stat map bedroom-stat'>{attributes.beds}</div>
              <div className='propcard-stat map'>Bed</div>
            </div>
          ) : (
            <></>
          )}
          {attributes && attributes.baths ? (
            <div className='propertycard-feature map'>
              <div className='propcard-stat map bath-stat'>{attributes.baths}</div>
              <div className='propcard-stat map'>Bath</div>
            </div>
          ) : (
            <></>
          )}
          {attributes && (attributes.floor_area_total || attributes.floor_area_main) ? (
            <div className='propertycard-feature map'>
              <div className='propcard-stat map sqft-stat'>{getFloorArea(attributes)}</div>
              <div className='propcard-stat map'>Sqft</div>
            </div>
          ) : (
            <></>
          )}
          {attributes && attributes.year_built ? (
            <div className='propertycard-feature mobno'>
              <div className='propcard-stat map year-stat'>{attributes.year_built}</div>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
      <div className='status-viewed'></div>
    </div>
  );
}
