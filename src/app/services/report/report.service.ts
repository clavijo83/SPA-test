import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  options = {
    responseType: 'arraybuffer' as 'json'
  };

  constructor(private httpClient: HttpClient) {
  }

  getBillingTermTotals(timeStamp: number, groupID: number): Observable<any> {
    return this.httpClient.get(environment.REPORT_ANALYSIS_URL + '/billing-term-totals?date=' + timeStamp + (groupID ? '&groupId=' + groupID : '')).pipe(
      map(
        (response) => {
          return response;
        })
    );
  }

  getCarrierOverview(timeStamp: number, groupID: number): Observable<any> {
    return this.httpClient.get(environment.REPORT_ANALYSIS_URL + '/carrier-overview?date=' + timeStamp + (groupID ? '&groupId=' + groupID : '')).pipe(
      map(
        (response) => {
          return response;
        })
    );
  }

  // get all available statuses to use in drop-down on tracking edit
  getConsigneeOverview(timeStamp: number, groupID: number): Observable<any> {
    return this.httpClient.get<any>(environment.REPORT_ANALYSIS_URL + '/consignee-overview?date=' + timeStamp + (groupID ? '&groupId=' + groupID : '')).pipe(
      map(
        (response) => {
          return response;
        })
    );
  }

  // get the shipment history from lambda; includes historicalEvent[] and stop[], pickup and delivery
  getOriginBreakdown(timeStamp: number, groupID: number): Observable<any> {
    return this.httpClient.get<any>(environment.REPORT_ANALYSIS_URL + '/origin-breakdown?date=' + timeStamp + (groupID ? '&groupId=' + groupID : '')).pipe(
      map(
        (response) => {
          return response;
        })
    );
  }

  getDestinationBreakdown(timeStamp: number, groupID: number): Observable<any> {
    return this.httpClient.get(environment.REPORT_ANALYSIS_URL + '/destination-breakdown?date=' + timeStamp + (groupID ? '&groupId=' + groupID : '')).pipe(
      map(
        (response) => {
          return response;
        })
    );
  }

  getClientOverview(timeStamp: number, groupID: number): Observable<any> {
    return this.httpClient.get(environment.REPORT_ANALYSIS_URL + '/client-overview?date=' + timeStamp + (groupID ? '&groupId=' + groupID : '')).pipe(
      map(
        (response) => {
          return response;
        })
    );
  }

  getShipmentReport(params: string): Observable<any> {
    return this.httpClient.get(environment.REPORT_ANALYSIS_URL + '/shipment-report' + (params !== '' ? '?' + params : '')).pipe(
      map(
        (response) => {
          return response;
        })
    );
  }
}
