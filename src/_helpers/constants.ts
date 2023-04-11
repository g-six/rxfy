import { Filter } from './../_typings/filters_compare';
export const generic = {
  environments: { DEV: 'dev', PROD: 'prod' },
  routes: {
    HOME: '/',
    LIST: '/list',
    ITEM: '/property',
    SAVED: '/saved',
    COMPARE: '/compare',
    PROFILE: '/p',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT: '/forgot-password',
    RESET: '/reset-password',
    EXPIRED: '/expired',

    UNSUBSCRIBE: '/unsubscribe',
    DOCUMENT: '/documents',
    MORTGAGE: '/mortgage',
    ALERTS: '/alerts',
  } as { [key: string]: string }, // add index signature here
  backend: {
    API: process.env.NEXT_PUBLIC_STRAPI_URL,
    IMG: '',
  },
};

export const FILTERS: Filter[] = [
  // general
  { title: 'Age', urlKey: 'ba', keys: ['L_Age', 'Age'], types: ['general'], behaviors: ['default'] },
  { title: 'Build Year', keys: ['L_YearBuilt'], types: ['general'] },
  { title: 'Total Baths', keys: ['L_TotalBaths'], types: ['general'], behaviors: ['default'] },
  { title: 'Total Bedrooms', keys: ['L_BedroomTotal'], types: ['general'], behaviors: ['default'] },
  { title: 'Features', keys: ['LFD_FeaturesIncluded_55'], types: ['general'] },
  { title: 'Amenities', keys: ['LFD_Amenities_56'], types: ['general'] },
  { title: 'Title to Land', keys: ['LandTitle'], types: ['general'] },
  { title: 'View', keys: ['L_View_Desc'], types: ['general'] },
  { title: 'Property Type', keys: ['PropertyType'], types: ['general'] },
  { title: '# of Fireplaces', keys: ['field_3011', 'L_Fireplaces'], types: ['general'] },
  { title: '# of Kitchens', keys: ['field_3237', 'L_KitchensTotal'], types: ['general'] },
  { title: '# of Pets', keys: ['L_PetsTotal'], types: ['general'] },
  { title: 'Rentals Allowed', keys: ['LFD_BylawRestrictions_58'], types: ['general'] },
  // { title: 'Flood Plain', keys: ['FloodPlain'], types: ['general'] },
  { title: 'Locker', keys: ['field_3003', 'L_Locker'], types: ['general'], behaviors: ['default'] },
  // { title: 'Maint Fee Includes', keys: ['f_3195', 'B_Maintenance_Includes'], types: ['general'] },
  { title: 'Parking', keys: ['L_Parking_total'], types: ['general'], behaviors: ['default'] },
  { title: 'Parking Access', keys: ['f_3029', 'LFD_ParkingAccess_45'], types: ['general'] },
  // { title: 'Tax Utilities Incl', keys: ['TaxUtilitiesInclude'], types: ['general'] },
  { title: 'Zoning', keys: ['Zoning'], types: ['general'] },
  // { title: 'Rain Screen', keys: ['field_3190', 'RainScreen'], types: ['general'] },
  {
    title: 'Fuel/Heating',
    keys: ['f_130', 'B_Heating', 'LFD_FuelHeating_48'],
    types: ['general'],
    behaviors: ['default'],
  },

  // financial
  {
    title: 'List Date',
    keys: ['ListingDate'],
    types: ['financial'],
    var: 'date',
    behaviors: ['hideIfEmpty'],
  },
  { title: 'MLS #', keys: ['MLS_ID'], types: ['financial'], behaviors: ['default'] },
  {
    title: 'Price Per SQFT',
    keys: ['PricePerSQFT'],
    types: ['financial'],
    var: 'price',
    behaviors: ['hideIfEmpty', 'default'],
  },
  { title: 'Last Year Taxes', keys: ['tax'], types: ['financial'], var: 'price' },
  {
    title: 'Strata Maint Fee',
    keys: ['field_3021', 'L_StrataFee'],
    types: ['financial'],
    var: 'price',
    behaviors: ['hideIfEmpty'],
  },
  // {
  //   title: 'Land Lease Expiry Year',
  //   keys: ['field_3013', 'LandLease_ExpYear'],
  //   types: ['financial'],
  //   behaviors: ['hideIfEmpty', 'default'],
  // },

  // dimensions
  // { title: 'Frontage - Feet', keys: ['field_3017', 'L_Frontage_Feet'], types: ['dimensions'] },
  { title: 'Depth', keys: ['field_3018', 'B_Depth'], types: ['dimensions'] },
  { title: 'Floor Area Total Size', keys: ['L_FloorArea_GrantTotal'], types: ['dimensions'], behaviors: ['default'] },
  {
    title: 'Floor Area - Unfinished',
    keys: ['field_3128', 'L_FloorArea_Unfinished'],
    var: 'area',
    types: ['dimensions'],
  },
  {
    title: 'Floor Area Fin - Abv Main',
    keys: ['lot_area', 'L_FloorArea_Finished_AboveMainFloor'],
    var: 'area',
    types: ['dimensions'],
  },
  {
    title: 'Floor Area Fin - Basement',
    keys: ['field_3127', 'L_FloorArea_Basement'],
    var: 'area',
    types: ['dimensions'],
  },
  {
    title: 'Floor Area Fin - BLW Main',
    keys: ['field_3126', 'L_FloorArea_BelowMain'],
    var: 'area',
    types: ['dimensions'],
  },
  {
    title: 'Floor Area Fin - Main Flr',
    keys: ['field_3125', 'L_FloorArea_Main'],
    var: 'area',
    types: ['dimensions'],
  },
  // {
  //   title: 'Floor Area - Grand Total',
  //   keys: ['field_3129', 'L_FloorArea_GrantTotal'],
  //   var: 'area',
  //   types: ['dimensions'],
  // },
  { title: 'Basement Area', keys: ['f_137', 'B_Basement'], var: 'area', types: ['dimensions'] },
  { title: 'Lot Sz (Acres)', keys: ['field_3155', 'L_LotSize_Acres'], types: ['dimensions'] },

  // construction
  { title: 'Style of Home', keys: ['f_3023', 'LFD_StyleofHome_32'], types: ['construction'] },
  {
    title: 'Construction',
    keys: ['f_3027', 'B_Construction', 'LFD_Construction_41', 'LFD_Construction_72'],
    types: ['construction'],
    behaviors: ['default'],
  },
  {
    title: 'Floor Finish',
    keys: ['f_3032', 'L_Floor_Finish', 'LFD_FloorFinish_103', 'LFD_FloorFinish_50', 'LFD_FloorFinish_19'],
    types: ['construction'],
    behaviors: ['default'],
  },
  { title: 'Driveway Finish', keys: ['DrivewayFinish'], types: ['construction'] },
  {
    title: 'Exterior Finish',
    keys: ['f_3028', 'B_Exterior_Finish', 'LFD_ExteriorFinish_42', 'LFD_ExteriorFinish_73'],
    types: ['construction'],
    behaviors: ['default'],
  },
  { title: 'Roughed In Plumbing', keys: ['RoughedInPlumbing'], types: ['construction'] },
  { title: 'Services Connected', keys: ['f_3175', 'B_ServicesConnected'], types: ['construction'] },
  { title: 'Suite', keys: ['f_3025', 'B_Suite'], types: ['construction'] },
  {
    title: 'Total Units in Strata Plan',
    keys: ['field_3191', 'L_TotalUnits'],
    types: ['construction'],
    behaviors: ['hideIfEmpty', 'default'],
  },
  {
    title: 'Fireplace Fueled by',
    keys: ['f_3031', 'L_Fireplace_Fuel', 'LFD_FireplaceFueledby_49', 'LFD_FireplaceFueledby_80'],
    types: ['construction'],
    behaviors: ['default'],
  },
  {
    title: 'Foundation',
    keys: ['field_3189', 'Foundation', 'LFD_Foundation_155', 'LFD_Foundation_157'],
    types: ['construction'],
    behaviors: ['default'],
  },
  {
    title: 'Roof',
    keys: ['f_147', 'B_Roof', 'LFD_Roof_12', 'LFD_Roof_43', 'LFD_Roof_43', 'LFD_Roof_74'],
    types: ['construction'],
    behaviors: ['default'],
  },
  { title: 'Complex/Subdivision', keys: ['L_ComplexName'], types: ['construction'] },
  { title: 'Bylaw Restrictions', keys: ['field_3179', 'B_Bylaws'], types: ['construction'] },
  {
    title: 'Storeys in Building',
    keys: ['field_3016', 'L_Stories'],
    types: ['construction'],
    behaviors: ['hideIfEmpty'],
  },
  { title: '# Floor Levels', keys: ['field_3010', 'L_NoFloorLevels'], types: ['construction'] },

  // multifamily
  { title: '1-Bedrm Units', keys: ['L_Total1BedroomUnits'], types: ['multifamily'] },
  { title: '2-Bedrm Units', keys: ['L_Total2BedroomUnits'], types: ['multifamily'] },
  { title: '3-Bedrm Units', keys: ['field_3144', 'L_Total3BedroomUnits'], types: ['multifamily'] },
  { title: 'Bach./Studio Units', keys: ['L_TotalStudios'], types: ['multifamily'] },
  { title: 'Basement Area', keys: ['f_137', 'B_Basement'], types: ['multifamily'] },
  { title: 'ByLaw Infractions', keys: ['L_ByLawInfractions'], types: ['multifamily'] },
  //{ title: 'Features Included', keys:[ 'f_3033', 'L_Features' ], types: ['multifamily'] },
  { title: 'Fire Sprinkler System', keys: ['L_FireSprinkler'], types: ['multifamily'] },
  { title: 'Income As At Date', keys: ['L_IncomeDate'], types: ['multifamily'], var: 'date' },
  { title: 'Income Per Annum', keys: ['L_IncomePerAnnum'], types: ['multifamily'] },
  { title: 'Net Oper. Income', keys: ['L_Net_OperatingIncome'], types: ['multifamily'] },
  { title: 'Other Units', keys: ['field_3145', 'L_TotalOtherUnits'], types: ['multifamily'] },
  { title: 'Smoke Detectors', keys: ['L_SmokeDetectors'], types: ['multifamily'] },

  // land
  { title: 'Access to Property', keys: ['B_AccessToProperty'], types: ['land'] },
  {
    title: 'Adjustment Date',
    keys: ['field_3166', 'L_AdjustmentDate'],
    types: ['land'],
    var: 'date',
  },
  { title: 'Services Connected:', keys: ['B_ServicesConnected'], types: ['land'] },
  { title: 'Bldg Permit Approved', keys: ['L_Bath10_Ensuite'], types: ['land'] },
  { title: 'Building Plans', keys: ['B_Plans'], types: ['land'] },
  { title: 'Cable Service', keys: ['B_CableService'], types: ['land'] },
  { title: 'Development Permit', keys: ['Dev_Permit'], types: ['land'] },
  { title: 'Electricity', keys: ['L_Electricity'], types: ['land'] },
  { title: 'Fencing', keys: ['B_Fencing'], types: ['land'] },
  { title: 'Front Dir Exposure', keys: ['B_Land_Direction'], types: ['land'] },
  { title: 'Info Package Available', keys: ['B_InfoPackageAvailable'], types: ['land'] },
  { title: 'Natural Gas', keys: ['L_NaturalGas'], types: ['land'] },
  { title: 'Perc Test Available', keys: ['B_PercTest_AvailableYN'], types: ['land'] },
  { title: 'Perc Test Date', keys: ['L_PercTestDates'], types: ['land'], var: 'date' },
  { title: 'Permitted Land Use', keys: ['Permitted_Land_Use'], types: ['land'] },
  { title: 'Potential for Rezoning', keys: ['B_RezoningPotential'], types: ['land'] },
  { title: 'Prop in Lnd Reserve (ALR)', keys: ['B_LandReserve'], types: ['land'] },
  { title: 'Prospectus', keys: ['L_Prospectus'], types: ['land'] },
  { title: 'Restrictions', keys: ['f_3024', 'B_Restrictions'], types: ['land'] },
  { title: 'Sanitary Sewer', keys: ['L_SanitarySewer'], types: ['land'] },
  { title: 'Sign on Property', keys: ['B_SignOnPropertyYN'], types: ['land'] },
  { title: 'Sketch Attached', keys: ['B_SketchAttached'], types: ['land'] },
  { title: 'Storm Sewer', keys: ['L_StormSewer'], types: ['land'] },
  { title: 'Telephone Service', keys: ['L_TelephoneService'], types: ['land'] },
  { title: 'Trees(Logged in last 2yr)', keys: ['Trees'], types: ['land'] },
];

export const BTNS = [
  { title: 'General', type: 'general' },
  { title: 'Financial', type: 'financial' },
  { title: 'Construction', type: 'construction' },
  { title: 'Dimensions', type: 'dimensions' },
  { title: 'Multifamily', type: 'multifamily' },
  { title: 'Land only', type: 'land' },
];
export const keyCodes = {
  KEY_ESC: 27,
  KEY_ENTER: 13,
  KEY_BACKSPACE: 8,
};
export const filterCompare = {
  keys: {
    parking: 'parking',
    features: 'features',
    amenities: 'amenities',
    bathrooms: 'bathrooms',
    bedrooms: 'bedrooms',
    property_type: 'property_type',
  },
  keysOfTextFields: ['features', 'amenities', 'f_3195'],
  keysOfHidden: ['field_3144', 'f_137', 'field_3145', 'field_3166', 'f_3024', 'field_3002', 'price_sqft'],
};

// constant for replacers root nodes names of ids,classes,etc
export const webFlowAnchors = {
  propertyActions: 'section---top-stats',
  homeAlerts: 'home-alert---all-screens',
};
