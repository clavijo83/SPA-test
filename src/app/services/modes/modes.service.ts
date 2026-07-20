import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {ModeDropdown} from '../../interfaces/dropdown';

@Injectable({
  providedIn: 'root'
})
export class ModesService {

  constructor(private httpClient: HttpClient) {
  }

  resolve(): Observable<ModeDropdown[]> {
    const modes = sessionStorage.getItem('modes');
    if (modes) {
      return JSON.parse(modes);
    }
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/modes').pipe(
        map((response) => {
          let modesData: ModeDropdown[] = [];
          response.forEach((mode: any) => {
            modesData.push({
              modeId: mode.modeID,
              modDescription: mode.modeDescription,
              modeType: mode.modeType,
            });
          });
          sessionStorage.setItem('modes', JSON.stringify(modesData));
          return modesData;
        })
      );
  }
}

