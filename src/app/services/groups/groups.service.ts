import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Global} from '../../common/global';
import {fetchAuthSession} from 'aws-amplify/auth';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  currentUserType: any;
  private user: any;

  constructor(private router: Router, private httpClient: HttpClient,
              public authenticator: AuthenticatorService) {
  }

  userType(username: any): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_USER_CREDENTIAL_API_BASE_URL + '/users/' + username).pipe(
      map((response) => {
        Global.currentUserType.set(this.currentUserType);
        return response;
      })
    );
  }

  isValidUserType(): any {
    this.authenticator.subscribe(() => {
      this.user = this.authenticator.user;
      if (this.user) {
        return this.httpClient.get<any>(environment.ENV_USER_CREDENTIAL_API_BASE_URL + '/users/' + this.user).pipe(
          map((response) => {
            if (response) {
              let user = response;
              if (user.UserType == 32 || user.UserType == 29) {
                return true;
              } else {
                this.router
                  .navigateByUrl('SPAs/shipment-access-denied')
                  .then();
                return false;
              }
            } else {
              this.router.navigateByUrl('SPAs/shipment-access-denied').then();
              return false;
            }
          })
        );
      } else {
        this.router.navigateByUrl('SPAs/shipment-access-denied').then();
        return false;
      }
    });
  }

  async isValidPermission(): Promise<boolean> {
    return fetchAuthSession()
      .then((session) => {
        const userEmail = session?.tokens?.idToken?.payload['email'] + '';
        if (userEmail && (userEmail.split('@')[1] == 'il2000.com' || userEmail.split('@')[1] == 'eshipping.biz')) {
          return true;
        } else {
          this.router.navigateByUrl('SPAs/shipment-access-denied').then();
          return false;
        }
      }).catch(() => {
        return false;
      });
  }

  async userGroupID() {
    try {
      const currentUser = await fetchAuthSession();
      const tokenData = currentUser?.tokens?.idToken?.payload ?? {};
      // Access group information from the decoded token payload, Handle single or multiple groups
      return tokenData['group_id'] ? (tokenData['group_id'] + '').split(',').map((value) => parseInt(value)) : [];
    } catch (error) {
      return []; // Return empty array on error
    }
  }
}
