import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {from, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {ClientDropdownResponse} from '../../interfaces/client-dropdown-response';
import {GroupsService} from '../groups/groups.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService implements Resolve<any> {
  private userGroupID: any;
  private isClientUser: boolean | undefined;

  constructor(private httpClient: HttpClient, private gs: GroupsService) {
    this.authUserGroupID().subscribe(id => this.userGroupID = id);
    this.authIsClientUser().subscribe(isClientUser => this.isClientUser = isClientUser);
  }

  resolve(route?: ActivatedRouteSnapshot): Observable<ClientDropdownResponse[]> {
    if (route?.parent?.data["clients"]) { return route.parent.data["clients"]; }
    return this.httpClient.get<ClientDropdownResponse[]>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/groupdropdown').pipe(
        map((response) => {
          if (this.isClientUser) {
            //CLIENT USER FILTER BY GROUP ID
            return response.filter((val) =>
              this.userGroupID.includes(val.groupID)
            );
          } else {
            return response;
          }
        })
      );
  }

  authUserGroupID() {
    return from(this.gs.userGroupID()).pipe(map((id) => id));
  }

  authIsClientUser() {
    return from(this.gs.isValidPermission()).pipe(map((isClientUser) => !isClientUser));
  }
}

