import {Injectable} from '@angular/core';
import {Resolve} from '@angular/router';
import {from, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {GroupsService} from '../groups/groups.service';
import {Dropdown} from '../../interfaces/dropdown';

@Injectable({
  providedIn: 'root'
})
export class CarriersService implements Resolve<any> {
  private userGroupID: any;
  private isClientUser: boolean | undefined;

  constructor(private httpClient: HttpClient, private gs: GroupsService) {
    this.authUserGroupID().subscribe(id => this.userGroupID = id);
    this.authIsClientUser().subscribe(isClientUser => this.isClientUser = isClientUser);
  }

  resolve(): Observable<Dropdown[]> {
    const carriersData = sessionStorage.getItem('carrierFilterData');
    if (carriersData) {
      return JSON.parse(carriersData);
    }
    return this.httpClient.get<any>(environment.ENV_LAMBDA_TRACKING_API_BASE_URL + '/tracking?filter=CARRIER')
      .pipe(
        map((response) => {
          let carrierData: any[] = response.body;
          let carriers: string[] = [];
          let carrierFilterData: Dropdown[] = [];
          carrierData.forEach((value) => {
            carriers.push(value.CarrierDropDown);
          });

          this.sortAndFilter(carriers).forEach((value: any) => {
            carrierFilterData.push({item: value, value: value});
          });
          sessionStorage.setItem('carrierFilterData', JSON.stringify(carrierFilterData));
          return carrierFilterData;
        }));
  }

  sortAndFilter(data: any[]) {
    return data.sort().filter((x, i, a) => !i || x != a[i - 1]);
  }

  authUserGroupID() {
    return from(this.gs.userGroupID()).pipe(map(id => id));
  }

  authIsClientUser() {
    return from(this.gs.isValidPermission()).pipe(map(isClientUser => isClientUser));
  }
}
