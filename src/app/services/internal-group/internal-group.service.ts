import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {ClientDropdownResponse} from '../../interfaces/client-dropdown-response';
import {GroupInfo} from '../../interfaces/group-info';
import {from, Observable} from 'rxjs';
import {Product} from '../../interfaces/product';
import {Customization} from '../../interfaces/customization';
import {BillTo} from '../../interfaces/bill-to';
import {GroupsService} from '../groups/groups.service';

@Injectable({
  providedIn: 'root',
})
export class InternalGroupService {
  private userGroupID: any;
  private isClientUser!: boolean;

  constructor(private httpClient: HttpClient, private gs: GroupsService) {
    this.authUserGroupID().subscribe((id) => (this.userGroupID = id));
    this.authIsClientUser().subscribe((isClientUser) => (this.isClientUser = isClientUser));
  }

  getClientDropdown(): Observable<ClientDropdownResponse[]> {
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

  getGroupInfo(GroupID: number): Observable<GroupInfo> {
    return this.httpClient.get<GroupInfo>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/groupinfo/' + GroupID);
  }

  getProductList(GroupID: number): Observable<Product[]> {
    return this.httpClient.get<Product[]>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/groupproducts/' + GroupID);
  }

  getGroupNotes(GroupID: number): Observable<string[]> {
    return this.httpClient.get<string[]>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/groupnotes/' + GroupID);
  }

  getGroupCustomizations(GroupID: any): Observable<Customization[]> {
    return this.httpClient.get<Customization[]>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/groupcustomizations/' + GroupID);
  }

  getGroupBillTos(GroupID: number): Observable<any[]> {
    return this.httpClient.get<BillTo[]>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/groupbilltos/' + GroupID);
  }

  authUserGroupID() {
    return from(this.gs.userGroupID()).pipe(map((id) => id));
  }

  authIsClientUser() {
    return from(this.gs.isValidPermission()).pipe(map((isClientUser) => isClientUser));
  }
}

