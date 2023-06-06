import { PropertyInput } from '@/_typings/property';
export async function createPrivateListing(listing: PropertyInput, session_key: string) {
  console.log({
    listing,
    session_key,
  });
}

const gql_create = `mutation CreatePrivateListing($input: PrivateListingInput!) {
    createPrivateListing(data: $input) {
        data {
            id
            attributes {
                title
                building_unit
                city
                neighbourhood
                area
                lat
                lon
                postal_zip_code
                region
                state_province
                asking_price
                price_per_sqft
                gross_taxes
                tax_year
                baths
                full_baths
                half_baths
                bathroom_details
                beds
                room_details
                roofing
                depth
                year_built
                floor_levels
                floor_area
                floor_area_uom
                floor_area_main
                floor_area_basement
                floor_area_below_main
                floor_area_upper_floors
                floor_area_unfinished
                floor_area_total
                frontage_feet
                frontage_metres
                frontage_uom
                lot_sqm
                lot_sqft
                total_kitchens
                fireplace
                total_fireplaces
                complex_compound_name
                land_title
                garage
                total_covered_parking
                total_parking
                parkings {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                amenities {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                total_units_in_community
                strata_fee
                total_allowed_rentals
                by_law_restrictions {
                    data {
                        id
                        attributes {
                            is_allowed
                            name
                        }
                    }
                }
                appliances {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                allowed_pets {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                building_maintenance_items {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                connected_services {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                construction_information {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                dwelling_type {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                facilities {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                hvacs {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
                places_of_interest {
                    data {
                        id
                        attributes {
                            name
                        }
                    }
                }
            }
        }
    }
}
`;
