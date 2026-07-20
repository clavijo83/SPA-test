import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientFieldsService {

  constructor(private httpClient: HttpClient) {
  }

  getClientReferences(groupID: any): Observable<any> {
    return this.httpClient.get<any>(environment.CLIENT_FIELDS_URL + '/references/' + groupID);
  }

  getReferenceDropDown(groupID: any): Observable<any> {
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/get-reference-fields?groupID=' + groupID);
  }

  getLccException(groupID: any): Observable<any> {
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/get-exception-reason?groupID=' + groupID);
  }

  getShipmentTrackingContacts(shipmentID: any): Observable<any> {
    return this.httpClient.get<any>(environment.CLIENT_FIELDS_URL + '/tracking-contacts/' + shipmentID);
  }
}
