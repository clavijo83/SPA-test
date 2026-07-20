export interface Location {
  id: number;
  name: string;
  plant: string;
  streetAddress: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  contact: string;
  country: string;
  email: string;
  countryCode?: string;
  timezone?: string;
  receivingHourStart?: number;
  receivingHourStop?: number;
}
