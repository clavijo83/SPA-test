export interface ClientField {
  fieldID: number | null;
  fieldTypeID: number;
  description: string;
  tiberID: number;
  mandatory: number;
  defaults: string | null;
  maxLength: number | null;
  characterType: string;
  suppressPrint: number | null;
  value: string | null
}
