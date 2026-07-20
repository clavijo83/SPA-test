import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {RatesResponse} from '../../interfaces/rate-response';
import {RateRequest} from '../../interfaces/rate-request';
import {TruckloadRateRequest} from '../../interfaces/truckload-rate-request';
import {TruckloadRatesResponse} from '../../interfaces/truckload-rate-response';
import {Observable} from 'rxjs';
import { CarrierDetail } from '../../interfaces/carrier-detail';

@Injectable({
  providedIn: 'root'
})
export class RateService {

  constructor(private httpClient: HttpClient) {
  }

  getRates(rateRequest: RateRequest): Observable<any> {
    return this.httpClient.post<RatesResponse>(environment.RATER_URL, rateRequest).pipe(
      map(
        response => {
          return response as RatesResponse;
        })
    );
  }

  getTruckloadRates(rateRequest: TruckloadRateRequest): Observable<any> {
    return this.httpClient.post<TruckloadRatesResponse>(environment.DAT_INTEGRATION_URL + '/linehaul-data', rateRequest).pipe(
      map(
        response => {
          return response as TruckloadRatesResponse;
        })
    );
  }

  getCarrierHistoryRates(params: string, weeks = 24): Observable<any> {
    return this.httpClient.get(environment.REPORT_ANALYSIS_URL + '/carrier-history?' + params + '&rangeWeeks=' + weeks);
  }

  getAvailableCarriers(): Observable<any> {
    return this.httpClient.get<CarrierDetail[]>(environment.CARRIER_PROFILING_URL + '/available-carriers');
  }

  saveTruckloadRates(truckID: string, rateRequest: TruckloadRateRequest): Observable<any> {
    return this.httpClient.post<TruckloadRatesResponse>(environment.DAT_INTEGRATION_URL + '/save-target-rates/' + truckID,
      rateRequest).pipe(
      map(
        response => {
          return response as TruckloadRatesResponse;
        })
    );
  }
}
