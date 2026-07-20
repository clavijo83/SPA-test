import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {TruckSave} from '../../interfaces/truck-save';

@Injectable({
  providedIn: 'root'
})
export class TruckSaveService {

  constructor(private httpClient: HttpClient) {
  }

  saveTruck(truckSave: TruckSave): Observable<any> {
    return this.httpClient.post<any>(environment.SHIPMENT_HISTORY_URL + '/truckload', truckSave);
  }

  updateProLoadNumber(truckID: string, proLoadNumber: string): Observable<any> {
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/updateproload/' + truckID + '/' + proLoadNumber);
  }

  deleteTruck(truckID: number): Observable<any> {
    return this.httpClient.delete<any>(environment.SHIPMENT_HISTORY_URL + '/truckload/' + truckID);
  }

  convertTruckToLTL(truckID: any, userID: any): Observable<any> {
    return this.httpClient.delete<any>(environment.SHIPMENT_HISTORY_URL + '/converttoltl/' + truckID + '/' + userID);
  }

  addShipmentToTruck(truck: any, shipmentID: any, stopOrder: string): Observable<any> {
    return this.httpClient.post<any>(environment.SHIPMENT_HISTORY_URL + '/truckshipment/add/' +
      truck.truckID + '/' + (shipmentID?.toString() ?? '') + '/' + stopOrder, truck);
  }

  getTruck(truckID: string): Observable<any> {
    return this.httpClient.get<TruckSave>(environment.SHIPMENT_HISTORY_URL + '/truckload/' + truckID);
  }

  updateTruck(truckSave: any): Observable<any> {
    return this.httpClient.put<any>(environment.SHIPMENT_HISTORY_URL + '/truckload/' + truckSave.truckID, truckSave);
  }

  createLoadTrack(truckID: number, update = false): Observable<any> {
    if (update) {
      return this.httpClient.put<any>(environment.LOAD_TRACK_URL + '/update-load-track/' + truckID, null);
    } else {
      return this.httpClient.post<any>(environment.LOAD_TRACK_URL + '/create-load-track/' + truckID, null);
    }
  }

  updateTruckTracking(truckID: any, statusUpdate: any): Observable<any> {
    return this.httpClient.post<any>(environment.SHIPMENT_HISTORY_URL + '/truckshipment/status/' + truckID, statusUpdate);
  }

  getSalesRep(): Observable<any> {
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/get-sales-rep');
  }

  updateTruckSalesRep(truckID: any, salesRepId: any): Observable<any> {
    return this.httpClient.post<any>(environment.SHIPMENT_HISTORY_URL + '/truckshipment/salesRep/' + truckID + '/' + salesRepId, null);
  }
}
