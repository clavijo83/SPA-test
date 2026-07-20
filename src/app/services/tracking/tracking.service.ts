import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {from, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {TerminalDetailsFull} from '../../interfaces/terminal-details-full';
import {CityStateZip} from '../../interfaces/city-state-zip';
import {GroupsService} from '../groups/groups.service';
import * as momentTimezone from 'moment-timezone';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  public boardName: string = "";
  private userGroupID: any;
  private isClientUser: boolean = false;

  constructor(private httpClient: HttpClient, private gs: GroupsService) {
    this.authUserGroupID().subscribe(id => this.userGroupID = id);
    this.authIsClientUser().subscribe(isClientUser => this.isClientUser = isClientUser);
  }

  getTrackingAll(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingExpedited(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=EXPEDITED').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingAppointmentRequired(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=APT').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingElevated(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=ELEVATED').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingPickupMissed(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=PICKUP_MISSED').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingDelayed(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=DELAYED').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingDeliveryDateException(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=DELIVERY_DATE_EXCEPTION').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingUnableToDeliver(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=UNABLE_TO_DELIVER').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getCannotTrack(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/cannottrack').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingMABD(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=MABD').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingPending(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=PENDING').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTLTrackingPUMiss(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=PUMISS').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingRequestForQuote(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=RFQ').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingLateQuote(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=LQ').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingSubmittedQuote(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=SQ').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingPrebookedNotLate(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=NL').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingBookedNotLate(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=BNL').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingAppointmentRequired(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=APT').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingDeliveryMissed(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=DELMISS').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingMissingTransitUpdate(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=MTU').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingLateDelivery(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=LATE').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingAll(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=ALL').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingDeliveredMissingPOD(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=NOPOD').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingInTransit(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=INTRANSIT').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTerminalDetails(shipmentID: string): Observable<TerminalDetailsFull> | any {
    return this.httpClient.get<TerminalDetailsFull>(environment.ENV_NSYNC_BASE_URL + '/shipments/' + shipmentID + '/carrier');
  }

  getCityStateByZip(zip: string, country: string): Observable<CityStateZip> | any {
    return this.httpClient.get<CityStateZip>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/citystatezip/' + zip + '/' + country);
  }

  getAdvancedFilterStatus(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=STATUS').pipe(
      map(
        response => {
          return response.body;
        })
    );
  }

  getAdvancedFilterCarrier(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=CARRIER').pipe(
      map(
        response => {
          return response.body;
        })
    );
  }

  updateLastUpdated(ShipmentID: any) {
    return this.httpClient.post(environment.ENV_NSYNC_BASE_URL + '/orderDetails/lastupdated/' + ShipmentID, {});
  }

  authUserGroupID() {
    return from(this.gs.userGroupID()).pipe(map(id => id));
  }

  authIsClientUser() {
    return from(this.gs.isValidPermission()).pipe(map(isClientUser => !isClientUser));
  }

  getTLTrackingPending(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=PENDING').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTrackingDelivered(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=DELIVERED').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingRequestForQuote(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=REQUEST_FOR_QUOTE').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingSubmittedQuote(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=SUBMITTED_QUOTE').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingPickupElevated(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=PICKUP_ELEVATED').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingPickupExpedited(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=PICKUP_EXPEDITED').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingBookedNotLate(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=NOT_LATE').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTrackingLatePickup(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=LATE_PICKUP').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingWhiteboard(client: string = "", group: string = "", priority: string = "", mode: string = ""): Observable<any> {
    let params = '';
    if (client != null && client !== '') {
      params = params + '&clientCode=' + client;
    }
    if (group != null && group !== '') {
      params = params + '&groupID=' + group;
    }
    if (priority !== '') {
      params = params + '&priority=' + priority;
    }
    if (mode !== '') {
      params = params + '&mode=' + mode;
    }

    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=WHITEBOARD' + params).pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingDeliveryToday(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=DELIVERY_DUE_TODAY').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingDeliveryOSD(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=DELIVERY_OSD').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTLTrackingDelivered(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=DELIVERED').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingAtDelivery(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=AT_DELIVERY').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingAtPickup(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=AT_PICKUP').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingProblem(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=PROBLEM').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingDispatched(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=DISPATCHED').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTLTrackingPrebookRolled(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=PREBOOK_ROLLED').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }

  getTrackingReturns(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=RETURNS').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingProblem(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=PROBLEM').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  getTrackingOcean(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=OCEAN').pipe(
      map(
        response => {
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.body.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response.body;
          }
        })
    );
  }

  convertTimezone(timedate: any, timezone: any) {
    if (timezone && timedate) {
      const myDate = momentTimezone.utc(timedate).tz(timezone);
      return myDate.format('YYYY-MM-DD HH:mm:ss');
    }
    return timedate;
  }

  processDatetime(data: any) {
    let count = 0;
    for (const recoad of data) {
      const pickupStart = this.convertTimezone(recoad.pickupStart, recoad.shipperTimezone);
      const pickupStop = this.convertTimezone(recoad.pickupStop, recoad.shipperTimezone);
      const deliveryStart = this.convertTimezone(recoad.deliveryStart, recoad.consigneeTimezone);
      const deliveryStop = this.convertTimezone(recoad.deliveryStop, recoad.consigneeTimezone);

      data[count].pickupStart = (pickupStart != 'Invalid date') ? pickupStart : '';
      data[count].pickupStop = (pickupStop != 'Invalid date') ? pickupStop : '';
      data[count].deliveryStart = (deliveryStart != 'Invalid date') ? deliveryStart : '';
      data[count].deliveryStop = (deliveryStop != 'Invalid date') ? deliveryStop : '';
      count++;
    }
    return data;
  }

  getCityStateByZipGeocoder(zip: string, country: string = ""): Observable<CityStateZip> | any {
    const countryFilter = (country && country !== '' ? '?countryCode=' + country : '');
    return this.httpClient.get<CityStateZip>(environment.CLIENT_FIELDS_URL + '/location-by-zip/' + zip + countryFilter);
  }

  getTLTrackingFailure(): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TL_TRACKING_API_BASE_URL + '?filter=FAILURE').pipe(
      map(
        response => {
          response = this.processDatetime(response.body);
          if (this.isClientUser) {
            // CLIENT USER FILTER BY GROUP ID
            return response.filter((val: { GroupID: any; }) => this.userGroupID.includes(val.GroupID));
          } else {
            return response;
          }
        })
    );
  }
}
