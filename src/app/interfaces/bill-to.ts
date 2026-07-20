export interface BillTo {
  name: string;
  careof: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  billtoID: number | null;
}
