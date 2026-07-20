export interface TerminalDetailsFull {
  name: string;
  scac: string;
  terminalDetail: {
    address1: string,
    address2: string,
    city: string,
    phone: string,
    postalcode: string,
    stateProvince: string
  };
  transitDays: string;
}
