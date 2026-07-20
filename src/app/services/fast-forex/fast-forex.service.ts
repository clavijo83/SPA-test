import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FastForexService {

  constructor(private httpClient: HttpClient) { }

  getExchangeRate(fromCurrency: string, toCurrency: string): Observable<any> {
    const params = 'from=' + fromCurrency + '&to=' + toCurrency + '&api_key=' + environment.FAST_FOREX_API_KEY;
    return this.httpClient.get<any>(environment.FAST_FOREX_URL + '/fetch-one?' + params);
  }
}
