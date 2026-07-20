export interface LineItem {
  productID: string | null;
  productCode: string | null;
  productDescription: string | null;
  nmfc: string | null;
  freightClass: number | null;
  hazmat: number | 0;
  handlingUnits: number | null;
  unitType: string | null;
  pieces: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  unitWeight: number | null;
  totalWeight: number | null | any;
  stackable: boolean | false;
  sameSkid: boolean | true;
  location: string | null;
}

export interface LineItem2 {
  freightClass: number | null;
  weight: number | null;
  handlingUnits: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  stackable: boolean | false;
  sameSkid: boolean | true;
  unitType?: string | null;
}
