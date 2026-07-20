export interface CargoClaim {
  groupId: number | null;
  shipmentId: string;
  claimDetails: ClaimDetail[];
}

export interface ClaimDetail {
  claimType: string;
  carrier: CarrierDetail;
  company: CompanyDetail;
  consignee: Address;
  shipper: Address;
  claimant: Address;
  statusCode: Code;
  reasonCode: Code;
  billOfLadingCarrier: string;
  deliveryDate: string;
  billOfLadingDate: string;
  claimDocuments: ClaimDocument[];
}

export interface Code {
  code: string;
  value: string;
}

export interface Address {
  code: string;
  fullName: string;
  email: string;
  contactName: string;
  contactEmail: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  region: string;
  country: string;
  zipCode: string;
  phoneNumber: string;
}

export interface CompanyDetail extends Address {
  shortCode: string;
}

export interface CarrierDetail extends Address {
  scac: string;
}

export interface ClaimDocument {
  display: string;
  documentType: string;
  dateOf: string;
}
