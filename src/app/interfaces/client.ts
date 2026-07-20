export interface Client {
  groupID: number | null;
  groupName: string | null;
  clientCode: string | null;
  companyName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  lpTeamEmail: string | null;
  tiberID: string | null;
  onHold: boolean | false;
  cutAbbreviation: string | null;
  logo?: string | null;
}
