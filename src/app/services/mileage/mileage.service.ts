import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MileageService {
  constructor(private httpClient: HttpClient) {
  }

  getMileage(shipperZip: string, consigneeZip: string, mode: string): Observable<any> {
    // FOR TESTING - https://spa.services.il2000.com/mileage?oZip=90210&dZip=12154&mode=0
    // Check Mode - LTL = 0 TL= 1
    mode = mode === 'LTL' ? '0' : '1';
    shipperZip = shipperZip ? shipperZip.trim() : shipperZip;
    consigneeZip = consigneeZip ? consigneeZip.trim() : consigneeZip;

    if ((shipperZip === '' && consigneeZip === '') ||
      (shipperZip === '' && consigneeZip != '') ||
      (shipperZip != '' && consigneeZip === '') ||
      (shipperZip === null && consigneeZip === null) ||
      (shipperZip != null && consigneeZip === null) ||
      (shipperZip === null && consigneeZip != null) ||
      (shipperZip === undefined && consigneeZip === undefined) ||
      (shipperZip != undefined && consigneeZip === undefined) ||
      (shipperZip === undefined && consigneeZip != undefined) ||
      shipperZip.length < 5 || consigneeZip?.length < 5) {
      return this.noMileageReturned();
    } else {
      if (shipperZip === consigneeZip) { return this.sameMileageReturned(); }
      return this.httpClient.get<any>(environment.MILEAGE_URL + '?oZip=' + shipperZip + '&dZip=' + consigneeZip + '&mode=' + mode);
    }
  }

  noMileageReturned(): Observable<any> {
    return of({mileage: 0});
  }

  sameMileageReturned(): Observable<any> {
    return of({mileage: 1});
  }
}
