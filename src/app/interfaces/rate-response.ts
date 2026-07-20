import {Rate} from './rate';

export interface RatesResponse {
  terms: string | null;
  primaryRoutedCarrier: string | null;
  secondaryRoutedCarrier: string | null;
  rates: Rate[];
}
