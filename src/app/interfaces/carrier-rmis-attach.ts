export interface CarrierRMISAttach {
  RMISAttachCarrier: RMISAttachCarrier;
}

export interface RMISAttachCarrier {
  Header: Header;
}

export interface Header {
  TimeStamp: string;
  API: string;
  Result: string;
  ConfirmationID?: string;
  Errors?: Errors;
}

export interface Errors {
  Error: string;
}

export interface CarrierInfo {
  CompanyName: string;
  RMISCarrierID: any;
  MCNumber: string;
  DOTNumber: string;
  Address1: string;
  Address2: any;
  City: string;
  St: string;
  Zip: string;
  Contact: any;
  Title: any;
  Phone: string;
  Fax: any;
  Email: any;
  CorporateContact: any;
}
