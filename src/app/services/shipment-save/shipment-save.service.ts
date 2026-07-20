import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {DispatchRequest} from '../../interfaces/dispatch-request';

@Injectable({
  providedIn: 'root'
})
export class ShipmentSaveService {

  constructor(private httpClient: HttpClient) {
  }

  updateShipment(shipmentSave: any): Observable<any> {
    return this.httpClient.put<any>(environment.SHIPMENT_HISTORY_URL + '/shipments/' + shipmentSave.shipmentDetail.shipmentID,
      shipmentSave);
  }

  saveShipment(shipmentSave: any): Observable<any> {
    return this.httpClient.post<any>(environment.SHIPMENT_HISTORY_URL + '/shipments', shipmentSave);
  }

  getShipment(shipmentID: any): Observable<any> {
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/shipments/' + shipmentID);
  }

  deleteShipment(shipmentID: any): Observable<any> {
    return this.httpClient.delete<any>(environment.SHIPMENT_HISTORY_URL + '/shipments/' + shipmentID);
  }

  dispatchShipment(shipmentID: any, dispatchRequest: DispatchRequest) {
    return this.httpClient.post<any>(environment.ENV_NSYNC_BASE_URL + '/shipments/' + shipmentID + '/dispatch', dispatchRequest);
  }

  updateShipmentCosts(shipmentID: any, costs: any) {
    return this.httpClient.post<any>(environment.SHIPMENT_HISTORY_URL + '/costs/' + shipmentID, costs);
  }
}
