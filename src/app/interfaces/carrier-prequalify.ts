export interface CarrierPrequalify {
  NonAttachedCarrierStatusRequestAPI: NonAttachedCarrierStatusRequestAPI;
}

export interface NonAttachedCarrierStatusRequestAPI {
  Header: Header;
  ExistsInRMISSystem: ExistsInRMISSystem;
  ActiveCOIOnFile: ActiveCOIOnFile;
  CarrierInfo: CarrierInfo;
  MeetsClientRules: MeetsClientRules;
}

export interface ActiveCOIOnFile {
  Coverage: Coverage[];
}

export interface Coverage {
  CoverageDescription: string;
  _CoverageDescription: string;
}

export interface CarrierInfo {
  CompanyName: string;
  RMISCarrierID: string;
  MCNumber: string;
  DOTNumber: string;
  Address1: string;
  Address2: string;
  City: string;
  St: string;
  Zip: string;
  Contact: string;
  Title: string;
  Phone: string;
  Fax: string;
  Email: string;
  CorporateContact: CorporateContact;
}

export interface CorporateContact {
  Type: string;
  CompanyName: string;
  Name: string;
  Title: string;
  Phone: string;
  Fax: string;
  Cell: string;
  Email: string;
  _Type: string;
}

export interface ExistsInRMISSystem {
  ExistsInRMISSystem: string;
}

export interface Header {
  TimeStamp: string;
  API: string;
  Version: string;
  Result: string;
}

export interface MeetsClientRules {
  DOT_OK: string;
  Insurance_OK: string;
}
