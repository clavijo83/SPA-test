import {ReferenceUpdate} from './reference-update';

export interface ShippingDetailsUpdate {
  billedToID: number | null;
  billedToCareOf: string | null;
  billedToName: string | null;
  billedToType: string | null;
  billedToAddress: string | null;
  billedToCity: string | null;
  billedToState: string | null;
  billedToZip: string | null;
  billedToCountry: string | null;
  specialInstructions: string | null;
  references: ReferenceUpdate[] | [] | null;
  openReferenceFields: any[] | [];
}
