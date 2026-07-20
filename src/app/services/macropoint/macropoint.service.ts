import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {TruckSave} from '../../interfaces/truck-save';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MacropointService {

  constructor(private httpClient: HttpClient) { }

  postLoad(truck: TruckSave): Observable<any> {
    const truckLoad = { truck };
    return this.httpClient.post<any>(environment.MACROPOINT_API_URL + '/create-order', truckLoad);
  }

  updateLoad(truck: TruckSave): Observable<any> {
    const truckLoad = { truck };
    return this.httpClient.put<any>(environment.MACROPOINT_API_URL + '/update-order', truckLoad);
  }

  cancelLoad(truckID: any): Observable<any> {
    return this.httpClient.post<any>(environment.MACROPOINT_API_URL + '/stop-order/' + truckID, null);
  }
}
