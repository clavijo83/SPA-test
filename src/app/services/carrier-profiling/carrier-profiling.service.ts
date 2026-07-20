import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {CarrierDetail} from '../../interfaces/carrier-detail';
import {CarrierRMIS} from '../../interfaces/carrier-rmis';
import {CarrierRMISAttach} from '../../interfaces/carrier-rmis-attach';
import {CarrierMcLeodResponse} from '../../interfaces/carrier-mcleod';

@Injectable({
  providedIn: 'root'
})
export class CarrierProfilingService {

  constructor(private httpClient: HttpClient) {
  }

  getAvailableCarriers(): Observable<any> {
    return this.httpClient.get<CarrierDetail[]>(environment.CARRIER_PROFILING_URL + '/available-carriers');
  }

  getOnboardedCarriers(): Observable<any> {
    return this.httpClient.get<CarrierDetail[]>(environment.CARRIER_PROFILING_URL + '/onboarded-carriers');
  }

  getCarrierFromRmis(mcNumber: string | any): Observable<any> {
    return this.httpClient.get<CarrierRMIS>(environment.CARRIER_PROFILING_URL + '/carrier-data?mcNumber=' + mcNumber);
  }

  getCarrierFromRmisByDOT(mcNumber: string): Observable<any> {
    return this.httpClient.get<CarrierRMIS>(environment.CARRIER_PROFILING_URL + '/carrier-data?dotNumber=' + mcNumber);
  }

  qualifyCarrier(carrierNumber: string, typeNumber: string): Observable<any> {
    return this.httpClient.post<any>(environment.CARRIER_PROFILING_URL + '/prequalify?' +
      (typeNumber === 'DOT' ? 'DotNumber' : 'mcNumber') + '=' + carrierNumber, null);
  }

  onboardingCarrier(carrierNumber: string, typeNumber: string): Observable<any> {
    return this.httpClient.post<CarrierRMISAttach>(environment.CARRIER_PROFILING_URL +
      '/onboard?' + (typeNumber === 'DOT' ? 'DotNumber' : 'mcNumber') + '=' + carrierNumber, null);
  }

  attachCarrier(carrierNumber: any, typeNumber: string, carrierSource: string = 'RMIS'): Observable<any> {
    return this.httpClient.post<CarrierRMISAttach>(environment.CARRIER_PROFILING_URL + '/attach?carrierSource=' + carrierSource + '&' +
      (typeNumber === 'DOT' ? 'DotNumber' : 'mcNumber') + '=' + carrierNumber, null);
  }

  detachCarrier(carrierNumber: string, typeNumber: string): Observable<any> {
    return this.httpClient.post<CarrierRMISAttach>(environment.CARRIER_PROFILING_URL +
      '/detach?' + (typeNumber === 'DOT' ? 'DotNumber' : 'mcNumber') + '=' + carrierNumber, null);
  }

  getCarrierRegistrationStep(carrierNumber: string | null, typeNumber: string): Observable<any> {
    const params = (typeNumber === 'DOT' ? '?DotNumber' : '?mcNumber') + '=' + carrierNumber;
    return this.httpClient.get<any>(environment.CARRIER_PROFILING_URL + '/registration-step' +
      (carrierNumber === '' || carrierNumber == null ? '' : params));
  }

  saveCarrier(carrier: CarrierDetail): Observable<any> {
    return this.httpClient.post<any>(environment.CARRIER_PROFILING_URL + '/add-carrier', carrier);
  }

  getCarrier(carrierNumber: string | null, typeNumber: string): Observable<any> {
    const params = (typeNumber === 'DOT' ? '?DotNumber' : '?mcNumber') + '=' + carrierNumber;
    return this.httpClient.get<CarrierDetail>(environment.CARRIER_PROFILING_URL + '/carrier' +
      (carrierNumber === '' || carrierNumber == null ? '' : params));
  }

  searchCarrier(carrierNumber: string | null, type: string = 'DOT'): Observable<any> {
    const params = (type === 'DOT' ? 'DotNumber' : 'mcNumber') + '=' + carrierNumber;
    return this.httpClient.get<CarrierMcLeodResponse>(environment.CARRIER_PROFILING_URL + '/search-carrier?' +
      (carrierNumber === '' || carrierNumber == null ? '' : params));
  }
}
