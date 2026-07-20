import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {TruckSave} from '../../interfaces/truck-save';

@Injectable({
  providedIn: 'root'
})
export class LoadBoardService {

  constructor(private httpClient: HttpClient) {
  }

  postLoadBoard(truck: TruckSave): Observable<any> {
    return this.httpClient.post<any>(environment.DAT_INTEGRATION_URL + '/load-board', truck);
  }

  updateLoadBoard(truck: TruckSave): Observable<any> {
    return this.httpClient.put<any>(environment.DAT_INTEGRATION_URL + '/load-board', truck);
  }

  deleteLoadBoard(id: any): Observable<any> {
    return this.httpClient.delete<any>(environment.DAT_INTEGRATION_URL + '/load-board/' + id);
  }
}

