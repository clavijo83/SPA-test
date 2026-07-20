export interface TruckerToolsCarrier {
  carrier_name: string;
  mc: string;
  dot: string;
  scac: string | null;
  external_id: string;
  non_usa_mc: boolean;
  contact_name: string | null;
  contact_phone: string;
  contact_email: string;
  truck_numbers: number | null;
  in_network: boolean;
  book_it_now: boolean;
  rejected: number | null;
  carrierLevel: number | null;
}

export interface TruckerToolsCarrierList {
  carriers: TruckerToolsCarrier[];
}
