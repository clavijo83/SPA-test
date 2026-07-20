import {TerminalDetails} from './terminal-details';

export interface Carrier {
  name: string | null;
  scac: number | null;
  terminalDetail: TerminalDetails | null;
  transitDays: number | null;
}
