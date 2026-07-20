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
export class StatusService implements Resolve<any> {
  private userGroupID: any;
  private isClientUser: boolean | undefined;

  constructor(private httpClient: HttpClient, private gs: GroupsService) {
    this.authUserGroupID().subscribe(id => this.userGroupID = id);
    this.authIsClientUser().subscribe(isClientUser => this.isClientUser = isClientUser);
  }

  resolve(): Observable<Dropdown[]> {
    const statusData = sessionStorage.getItem('statusFilterData');
    if (statusData) { return JSON.parse(statusData); }
    return this.httpClient.get<any>(environment.REPORT_ANALYSIS_URL + '/available-statuses').pipe(
        map((response) => {
            const statusFilterData: Dropdown[] = [];
            const statuses: string[] = [];
            response.forEach((value: { status: string; }) => {
              statuses.push(value.status);
            });
            this.sortAndFilter(statuses).forEach(value => {
              statusFilterData.push({item: value, value});
            });
            sessionStorage.setItem('statusFilterData', JSON.stringify(statusFilterData));
            return statusFilterData;
          }
        ));
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

