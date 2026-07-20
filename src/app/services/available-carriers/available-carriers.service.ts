import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {Dropdown} from '../../interfaces/dropdown';

@Injectable({
  providedIn: 'root'
})
export class AvailableCarriersService {

  constructor(private httpClient: HttpClient) {
  }

  resolve(): Observable<Dropdown[]> | Promise<Dropdown[]> {
    const availableCarriers = sessionStorage.getItem('availableCarriers');
    if (availableCarriers) {
      return JSON.parse(availableCarriers);
    }
    return this.httpClient.get<any>(environment.CARRIER_PROFILING_URL + '/available-carriers').pipe(
      map((response) => {
          sessionStorage.setItem('availableCarriers', JSON.stringify(response));
          return response;
        }
      ));
  }
}
