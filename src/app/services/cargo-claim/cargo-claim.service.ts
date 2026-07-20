import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CargoClaim} from '../../interfaces/cargo-claim';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CargoClaimService {
  constructor(private httpClient: HttpClient) {
  }

  createClaim(claim: CargoClaim): Observable<any> {
    return this.httpClient.post<any>(environment.AWS_CLAIM_URL + '/create-claim', claim);
  }

  getClaim(shipmentId: string): Observable<any> {
    return this.httpClient.get<any>(environment.AWS_CLAIM_URL + '/get-claim?shipmentId=' + shipmentId);
  }
}
