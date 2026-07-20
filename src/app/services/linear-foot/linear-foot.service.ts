import {Injectable} from '@angular/core';
import {LineItem2} from "../../interfaces/line-item";
import {environment} from '../../../environments/environment';
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})

export class LinearFootService {

  constructor(private httpClient: HttpClient) {
  }

  calculateLinearFoot(lineItem: LineItem2[]) {
    return this.httpClient.post<any>(environment.RATER_URL + '/linear-foot', lineItem).pipe(
      map(
        response => {
          return response.linearFoot as number;
        })
    );
  }
}
