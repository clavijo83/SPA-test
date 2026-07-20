import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageBillsService {

  constructor(private http: HttpClient) {
  }

  getImageBills(shipmentID: number): Observable<any> {
    return this.http.get(environment.ENV_NSYNC_BASE_URL + '/orderDetails/imageBills/' + shipmentID);
  }
}
