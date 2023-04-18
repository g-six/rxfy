import { describe, it, expect } from 'vitest';
import { queryStringToObject } from './url-helper';

describe('queryStringToObject()', () => {
  it('should parse a query string and return an object of key-value pairs', () => {
    const queryString =
      'beds=2&baths=1&minprice=750000&maxprice=20000000&lat=49.0253085&lng=-122.802962&nelat=49.1253085&nelng=-122.702962&swlat=48.9253085&swlng=-122.90296199999999&zoom=15&type=R';
    const expected = {
      beds: 2,
      baths: 1,
      minprice: 750000,
      maxprice: 20000000,
      lat: 49.0253085,
      lng: -122.802962,
      nelat: 49.1253085,
      nelng: -122.702962,
      swlat: 48.9253085,
      swlng: -122.90296199999999,
      zoom: 15,
      type: 'R',
    };

    const actual = queryStringToObject(queryString);

    expect(actual).toEqual(expected);
  });
});

//beds=2&baths=1&minprice=750000&maxprice=20000000&lat=49.0253085&lng=-122.802962&nelat=49.1253085&nelng=-122.702962&swlat=48.9253085&swlng=-122.90296199999999&zoom=15&type=R
