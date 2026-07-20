import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor(private http: HttpClient) {
  }

  downloadFile(fileUrl: string): Observable<any> {
    const headers = new HttpHeaders({Authorization: environment.API_TOKEN});
    return this.http.get(fileUrl, {headers, responseType: 'blob'});
  }

  retrieveDocument(documentID: string, docType: string, fileType: string, identifierType: string, bucket: string, path: string) {
    const stringParams = '?bucket=' + bucket + '&path=' + path;
    const pathParams = documentID + '/' + docType + '/' + identifierType + '/' + fileType;
    return this.http.get<any>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/retrieveDocument/' + pathParams + stringParams);
  }
}
