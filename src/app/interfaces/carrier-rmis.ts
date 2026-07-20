export interface CarrierRMIS {
  RMISCarrierStatusExpanded: RMISCarrierStatusExpanded;
}

export interface RMISCarrierStatusExpanded {
  Header: Header;
  Carrier: Carrier;
  Agreement: Agreement;
  W9: W9;
  CarrierProfile: CarrierProfile;
  CertificationStatus: CertificationStatus;
  Coverages: Coverages;
  DOT: Dot;
  DOTTestingInfo: DOTTestingInfo;
  DOTSMSSafetyCollection: DOTSMSSafetyCollection;
}

export interface Agreement {
  Date: string;
  Contact: string;
  Title: string;
  Agree: string;
}

export interface Carrier {
  CompanyName: string;
  RMISCarrierID: string;
  TaxID: string;
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
  Payto: string;
  PaytoAddress: string;
  PaytoCity: string;
  PaytoSt: string;
  PaytoZip: string;
  ClientsCarrierID: string;
  insdIntraStateNumber: string;
  insdIntraStateState: string;
  DUNs: string;
  PaytoAddress2: string;
  PaytoCountry: string;
  Contacts: Contacts;
  ClientsCarrierIDs: ClientsCarrierIDs;
}

export interface ClientsCarrierIDs {
  ClientsCarrierID: string[];
}

export interface Contacts {
  Contact: Contact[];
}

export interface Contact {
  '@Type': string;
  Type?: string;
  CompanyName: string;
  Name: string;
  Title: string;
  Phone: string;
  Fax: string;
  Cell: string;
  Email: string;
  '#text'?: string;
}

export interface CarrierProfile {
  YearsInBusiness: string;
  FlatBeds: string;
  DryVans: string;
  RefrigeratedVans: string;
  RGN: string;
  StepDecks: string;
  Maxi: string;
  DoubleDrops: string;
  PayeeType: string;
  PaymentMethod: string;
  AccountsPayableContact: string;
  AccountsPayablePhone: string;
  DispatchContact: string;
  DispatchPhone: string;
  DrAfterHrsContact: string;
  DrAfterHrsPhone: string;
  OtherContact: string;
  OtherPhone: string;
  ExpectFirstMoveTime: string;
  EmailReceived: string;
  PreferredOrigins: string;
  PreferredDestinations: string;
  DifficultiesLoadsState: string;
  PreferredLanes: string;
  CompanyRep: string;
  IsSpecialContract: string;
  PrimaryEquipmentType: string;
  DaysToPay: string;
  Factory: string;
  SCAC: string;
  HasSmartwayCert: string;
  HasFastCert: string;
  HasCarbCert: string;
  HasTwicCert: string;
  HazMatCertified: string;
  HazMatExpirationDate: string;
  HazMatCertVerifiedByRMIS: string;
  HasSafetyPermitHM232: string;
  TractorCount: string;
  IntermodalTrailerCount: string;
  TankerTrailerCount: string;
  BulkTrailerCount: string;
  OtherTrailerCount: string;
  MinorityWomanOwned: string;
  SmallBusinessType: string;
  DiversityCertAgency: string;
  SafetyMsgAgreement: string;
  NoW9: string;
  WcWaiverDate: string;
  WcWaiverContact: string;
  Vans48foot: string;
  Reefer48foot: string;
  Vans53foot: string;
  Reefer53foot: string;
  CompanyDrivers: string;
  Teams: string;
  OwnerOperators: string;
  HasMexInterchange: string;
  HasCanAuth: string;
  PadWrap: string;
  Straps: string;
  TriAxleVans: string;
  VentedVans: string;
  HeatedVans: string;
  GarmentTrailer: string;
  SuperVan: string;
  WalkingFloor: string;
  OpenTop: string;
  StraightTrucks: string;
  CargoVan: string;
  Hopper: string;
  Dump: string;
  HasCTPATCert: string;
  OperatingArea: OperatingArea;
  Modes: Modes;
  Commodities: Commodities;
  CorrectiveActionPlans: CorrectiveActionPlans;
  AdditionalFields: AdditionalFields;
  '#text': string;
}

export interface AdditionalFields {
  AdditionalField: AdditionalField[];
}

export interface AdditionalField {
  Description: string;
  Value: null | string;
}

export interface Commodities {
  Commodity: string[];
}

export interface CorrectiveActionPlans {
  CAP: Cap[];
}

export interface Cap {
  DateTime: string;
  Text: string;
  '#text'?: string;
}

export interface Modes {
  Mode: string[];
}

export interface OperatingArea {
  Area: Area[];
}

export interface Area {
  '@Description': string;
  '@Description1': string;
  '@Description2': string;
  '@Description3': string;
  '#text': string;
}

export interface Coverages {
  Coverage: Coverage[];
}

export interface Coverage {
  '@CoverageDescription': string;
  '@Status': string;
  CoverageDescription: string;
  Status: string;
  EffectiveDate: null | string;
  ExpirationDate: null | string;
  CancelDate: string;
  PolicyNumber: string;
  Producer: null | string;
  ProducerPhone: null | string;
  ProducerFax: null | string;
  ProducerEmail: string;
  Underwriter: null | string;
  Confidence: null | string;
  RMISCertID: null | string;
  RMISCovgID: null | string;
  LastCertUpdate: null | string;
  ConfidenceMsg: null | string;
  RMISImageID: string;
  Limit: LimitElement[] | LimitElement;
  CoverageDetail: CoverageDetail | string;
  '#text'?: string;
}

export interface CoverageDetail {
  Description: string;
}

export interface LimitElement {
  '@LimitDescription': string;
  '@LimitAmount': string;
  '@IsCargoSynonym': string;
  '@IsAutoSynonym': string;
  LimitDescription: string;
  LimitAmount: string;
  RMISLimitID: string;
  '#text'?: string;
}

export interface Dot {
  dot_DocketNumber: string;
  dot_USDOTNumber: string;
  dot_CommonAuthority: string;
  dot_ContractAuthority: string;
  dot_BrokerAuthority: string;
  dot_PendingCommonAuthority: string;
  dot_PendingContractAuthority: string;
  dot_PendingBrokerAuthority: string;
  dot_CommonAuthRevocation: string;
  dot_ContractAuthRevocation: string;
  dot_BrokerAuthorityRevocation: string;
  dot_Freight: string;
  dot_Passenger: string;
  dot_HouseholdGoods: string;
  dot_BIPDRequired: string;
  dot_CargoRequired: string;
  dot_BondSuretyRequired: string;
  dot_BIPDOnFile: string;
  dot_CargoOnFile: string;
  dot_BondSuretyOnFile: string;
  dot_AddressStatus: string;
  dot_DBAName: string;
  dot_LegalName: string;
  dot_Business_Addr: string;
  dot_Business_City: string;
  dot_Business_St: string;
  dot_Business_Country: string;
  dot_Business_Zip: string;
  dot_Business_Phone: string;
  dot_Business_Fax: string;
  dot_Mailing_Addr: string;
  dot_Mailing_City: string;
  dot_Mailing_St: string;
  dot_Mailing_Country: string;
  dot_Mailing_Zip: string;
  dot_Mailing_Phone: string;
  dot_Mailing_Fax: string;
  dot_dateLastUpdated: string;
}

export interface DOTSMSSafetyCollection {
  DOTSMSSafety: DOTSMSSafety;
}

export interface DOTSMSSafety {
  dotSmsSafety_USDotNumber: string;
  dotSmsSafety_InspTotal: string;
  dotSmsSafety_DriverInspTotal: string;
  dotSmsSafety_DriverOosInspTotal: string;
  dotSmsSafety_VehicleInspTotal: string;
  dotSmsSafety_VehicleOosInspTotal: string;
  dotSmsSafety_UnsafeDrivingPercentile: string;
  dotSmsSafety_UnsafeDrivingRoadsideAlert: string;
  dotSmsSafety_UnsafeDrivingSeriousViolation: string;
  dotSmsSafety_UnsafeDrivingBasicAlert: string;
  dotSmsSafety_FatiguedDrivingPercentile: string;
  dotSmsSafety_FatiguedUnsafeDrivingRoadsideAlert: string;
  dotSmsSafety_FatiguedDrivingSeriousViolation: string;
  dotSmsSafety_FatiguedDrivingBasicAlert: string;
  dotSmsSafety_DriverFitnessPercentile: string;
  dotSmsSafety_DriverFitnessDrivingRoadsideAlert: string;
  dotSmsSafety_DriverFitnessSeriousViolation: string;
  dotSmsSafety_DriverFitnessBasicAlert: string;
  dotSmsSafety_ControlledSubstancePercentile: string;
  dotSmsSafety_ControlledSubstanceRoadsideAlert: string;
  dotSmsSafety_ControlledSubstanceSeriousViolation: string;
  dotSmsSafety_ControlledSubstanceBasicAlert: string;
  dotSmsSafety_VehicleMaintPercentile: string;
  dotSmsSafety_VehicleMaintRoadsideAlert: string;
  dotSmsSafety_VehicleMaintSeriousViolation: string;
  dotSmsSafety_VehicleMaintBasicAlert: string;
  dotSmsSafety_UpdateDate: string;
  '#text': string;
}

export interface DOTTestingInfo {
  VehicleOOS: string;
  DriverOOS: string;
  HazmatOOS: string;
  SafetyRatingDate: string;
  SafetyRating: string;
  SafetyReviewDate: string;
  SafetyReviewType: string;
  DriverSEA: string;
  VehicleSEA: string;
  SafetyManagementSEA: string;
  TotalTrucks: string;
  TotalAccidents: string;
  Ratio: string;
  OperatingStatus: string;
  OutOfServiceDate: string;
  Safer_ActiveInactiveStatus: string;
  Safer_ActiveInactiveLastCheckedDate: string;
  OriginalAuthorityGrantDate: string;
  LatestAuthorityGrantDate: string;
  LatestAuthorityReinstatedDate: string;
  Tot_Trucks: string;
  Tot_Pwr: string;
}

export interface Header {
  TimeStamp: string;
  API: string;
  Version: string;
  Result: string;
}

export interface W9 {
  TimeStamp: string;
  TaxID: string;
  CoName: string;
  BusinessName: string;
  CompanyType: string;
  IsLimitedLiabCo: string;
  LimitedLiabTaxClass: string;
  IsExemptPayee: string;
  Address: string;
  City: string;
  St: string;
  Zip: string;
  ContactName: string;
  TINIsValid: string;
  TINValidationReason: string;
  TINCheckedDate: string;
  TaxClassOther: string;
  'TaxID-EIN': string;
  'TaxID-SSN': string;
}

export interface CertificationStatus {
  StatusDate: string;
  IsCertified: string | boolean | undefined;
  NonCertifiedReasons: NonCertifiedReasons;
  EntitiesCertified: string;
  EntitiesNOTCertified: string;
}

export interface NonCertifiedReasons {
  Reason: string[] | string;
}
