import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManageUserService {

  constructor(private httpClient: HttpClient) {
  }

  getUsers(): Observable<any> {
    return this.httpClient.get(environment.ENV_USER_CREDENTIAL_API_BASE_URL + '/users');
  }

  signUpUser(data: any): Observable<any> {
    return this.httpClient.post<any>(environment.ENV_USER_CREDENTIAL_API_BASE_URL + '/signUpUser', data);
  }

  enableUser(data: any): Observable<any> {
    return this.httpClient.post<any>(environment.ENV_USER_CREDENTIAL_API_BASE_URL + '/enable?username=' + data, null);
  }

  disableUser(data: any): Observable<any> {
    return this.httpClient.post<any>(environment.ENV_USER_CREDENTIAL_API_BASE_URL + '/disable?username=' + data, null);
  }

  editUser(data: any): Observable<any> {
    return this.httpClient.put<any>(environment.ENV_USER_CREDENTIAL_API_BASE_URL + '/editUser', data);
  }

  getUserByUserName(userName: string): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_USER_CREDENTIAL_API_BASE_URL + '/users/' + userName);
  }
}
