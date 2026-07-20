export interface TrackingContacts {
  shipTrackID: number;
  FirstName: string | null;
  LastName: string | null;
  emailAddress: string;
  mobilePhoneNumber: string | null;
  eventProfileFK: number | null;
  shipmentFK: number;
  eventProfile: EventProfile | null;
}

export interface EventProfile {
  eventProfileID: number | null;
  booked: boolean | false;
  delivered: boolean | false;
}
