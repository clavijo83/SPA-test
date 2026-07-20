import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {TruckerToolsCarrierList, TruckerToolsCarrier} from '../../interfaces/Trucker-Tools-Carrier';
import {TruckerToolsOffer} from '../../interfaces/Trucker-Tools-Offer';

@Injectable({
  providedIn: 'root'
})
export class TruckerToolsService {

  constructor(private httpClient: HttpClient) { }

  syncCarrier(carrier: TruckerToolsCarrier): Observable<any> {
    const carriers: TruckerToolsCarrierList = {
      carriers: [carrier]
    };
    return this.httpClient.post<any>(environment.DAT_INTEGRATION_URL + '/qualifiedCarriers', carriers);
  }

  postLoad(load: any): Observable<any> {
    const truckLoad = { load };
    return this.httpClient.post<any>(environment.DAT_INTEGRATION_URL + '/syncLoads', truckLoad);
  }

  postCoveredLoad(load: any, bookingId: string): Observable<any> {
    const truckLoad = {
      load,
      bookId: bookingId
    };
    return this.httpClient.put<any>(environment.DAT_INTEGRATION_URL + '/postCoveredLoad', truckLoad);
  }

  cancelLoad(load: any): Observable<any> {
    const truckLoad = { load };
    return this.httpClient.post<any>(environment.DAT_INTEGRATION_URL + '/cancelLoad', truckLoad);
  }

  // Get offers by truck id from our Database
  getOffers(truckID: string): Observable<TruckerToolsOffer[]> | any {
    return this.httpClient.get<TruckerToolsOffer[]>(environment.DAT_INTEGRATION_URL + '/getOffers/' + truckID);
  }

  // Get offers by offer id from our Database
  getOfferById(offerId: any): Observable<TruckerToolsOffer> | any {
    return this.httpClient.get<TruckerToolsOffer>(environment.DAT_INTEGRATION_URL + '/getOfferById/' + offerId);
  }

  // Get offers by load number from trucker tools
  getOffersByLoadNumber(loadNumber: any): Observable<TruckerToolsOffer[]> | any {
    return this.httpClient.get<TruckerToolsOffer[]>(environment.DAT_INTEGRATION_URL + '/getOffersByLoadNumber/' + loadNumber);
  }

  // Get offer by loadOfferId from trucker tools
  getOffersByOfferId(loadOfferId: string): Observable<TruckerToolsOffer> | any {
    return this.httpClient.get<TruckerToolsOffer>(environment.DAT_INTEGRATION_URL + '/getOffersByOfferId/' + loadOfferId);
  }

  createOffers(truckerToolOffer: TruckerToolsOffer): Observable<any> {
    const offers = { offer: truckerToolOffer };
    return this.httpClient.post<any>(environment.DAT_INTEGRATION_URL + '/offers', offers);
  }

  approveOffer(offerID: any): Observable<any> {
    return this.httpClient.post<any>(environment.DAT_INTEGRATION_URL + '/offers/approve/' + offerID, null);
  }

  rejectOffer(offerID: any): Observable<any> {
    return this.httpClient.post<any>(environment.DAT_INTEGRATION_URL + '/offers/reject/' + offerID, null);
  }

  getBookItUpdates(truckID: string): Observable<any[]> | any {
    return this.httpClient.get<any[]>(environment.DAT_INTEGRATION_URL + '/getBookItUpdates/' + truckID);
  }

  getCarrierCapacityByLoad(loadNumber: string): Observable<any[]> | any {
    return this.httpClient.get<any[]>(environment.DAT_INTEGRATION_URL + '/getCapacityByLoad/' + loadNumber);
  }
}
