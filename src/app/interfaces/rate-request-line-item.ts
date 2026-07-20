export interface RateRequestLineItem {
  handlingUnits: number;
  handlingUnitType: string | null;
  weight: number;
  freightClass: number;
  length: number | null;
  width: number | null;
  height: number | null;
  stackable: boolean;
  sameSkid: boolean;
  hazmat?: boolean | false;
}
