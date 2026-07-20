import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {S3DocumentResponse} from '../../interfaces/s3-document-response';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private http: HttpClient) {
  }

  sendFile(formData: any, shipmentID: string, docType: string, docName: string) {
    return this.http.post<any>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/docupload/' + shipmentID + '/' + docType + '/' +
      docName, formData);
  }

  uploadFile(formData: FormData, identifierID: any, documentType: string, identifierType: string, bucketName: string,
             pathToSave: string, originalFileName: string) {
    if (bucketName === 'ilconnect-manual-docs') {
      const currentUrl = window.location.href;
      if (currentUrl.includes('test') || currentUrl.includes('localhost')) {
        bucketName = 'ilconnect-manual-docs-test';
      }
    }
    const headers = new HttpHeaders({
      'Content-Type': 'multipart/form-data'
    });
    const params = new HttpParams({
      fromObject: {
        bucket: bucketName,
        path: pathToSave,
      }
    });
    const options = {headers, params};
    return this.http.post<any>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/uploadDocuments/' + identifierID + '/' +
      documentType + '/' + identifierType + '/' + originalFileName, formData, options);
  }

  getFiles(identifierID: any, identifierType: string): Observable<any> {
    return this.http.get<S3DocumentResponse[]>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/retrieveDocuments/' +
      (identifierID?.toString() ?? '') + '/' + identifierType);
  }
}

