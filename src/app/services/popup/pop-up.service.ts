import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
@Injectable()
export class PopUpService {

  constructor() {
  }

  getCarrierSite(name: any, pro: any, id: any, url: any): string {
    name = name.toUpperCase();
    if (name === 'IL2000' && id > 0) {
      window.open(environment.ENV_ICARUS_BASE_URL + '/reports/statusdetail?id=' + id);
      return '';
    }

    if (!url || url === '') {
      return 'Tracking is not supported';
    }

    const urlParameterCheck = [
      'pro=', 'pronumber=', 'pronum=', 'refnum=', 'search_criteria=',
      'number=', 'epr=', 'prog=', 'ProNum=', 'PRO=', 'Pro=', 'Pro0=',
      'PROS=', 'snum=', 'referenceNumber=', 'searchValues=', 'wpro=',
      'shipmentnumber=', 'PRONumber=', 'wbfb=', 'quick_pro=', 'query=', 'trknbr='
    ];

    for (let i = 0; i < urlParameterCheck.length; i++) {
      const param = urlParameterCheck[i];
      if (url.includes(param)) {
        url = url.replace(param, param + pro);
        break;
      }
    }

    return url;
  }
}
