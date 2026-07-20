import {Contact} from './contact';
import {Location} from './location';

export interface ShipperConsignee {
  id: number;
  moniker: string;
  contact: Contact;
  address: Location;
}
