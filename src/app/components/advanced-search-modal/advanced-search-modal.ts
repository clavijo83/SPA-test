import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Dropdown} from '../../interfaces/dropdown';
import {TrackingService} from '../../services/tracking/tracking.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {ReportsService} from '../../services/reports/reports.service';
import {InternalGroupService} from '../../services/internal-group/internal-group.service';
import {Constants} from '../../constants/constants';
import {Global} from '../../common/global';
import {UtilityService } from '../../services/utility/utility.service';
import {GroupsService} from '../../services/groups/groups.service';

@Component({
  selector: 'app-advanced-search-modal',
  standalone: false,
  templateUrl: './advanced-search-modal.html',
  styleUrl: './advanced-search-modal.css',
})
export class AdvancedSearchModal implements OnInit {
  @Input() modalName = 'filterModal';
  @Input() trackingDropDownData: any;
  @Input() carrierSearchList: Dropdown[] = [];
  @Input() statusesSearchList: Dropdown[] = [];
  @Input() clientSearchList: Dropdown[] = [];
  @Output() formFilters = new EventEmitter<object>(true);
  @Output() clearFilter = new EventEmitter<boolean>(true);
  protected clientDropDown: Dropdown[] = [];
  protected carrierDropDown: Dropdown[] = [];
  protected shipperDropDown: Dropdown[] = [];
  protected shipperCityDropDown: Dropdown[] = [];
  protected shipperStateDropDown: Dropdown[] = [];
  protected consigneeDropDown: Dropdown[] = [];
  protected consigneeCityDropDown: Dropdown[] = [];
  protected consigneeStateDropDown: Dropdown[] = [];
  protected statusDropdown: Dropdown[] = [];
  protected teamPodEmailDropDown: Dropdown[] = [];
  isIL2000 = false;
  shipperName: string[] = [];
  shipperState: string[] = [];
  shipperCity: string[] = [];
  consigneeName: string[] = [];
  consigneeState: string[] = [];
  consigneeCity: string[] = [];
  clientLoaded = false;
  statusLoaded = false;
  carrierLoaded = false;
  formGroupFilters: any = {
    fromDate: '',
    toDate: '',
    deliveryFromDate: '',
    deliveryToDate: '',
    clients: [],
    carriers: [],
    shippers: [],
    shipperCities: [],
    shipperStates: [],
    consignees: [],
    consigneeCities: [],
    consigneeStates: [],
    billTypes: [],
    statuses: [],
    teamPodEmail: []
  };
  dropdownSettings = {};
  global = Global;
  teamsPodColor: any;

  constructor(private spinner: NgxSpinnerService, protected ts: TrackingService, private rs: ReportsService, private gs: GroupsService,
              private igs: InternalGroupService, private utilityService: UtilityService) {
  }

  ngOnInit(): void {
    // TODO: Is IL2000 user, might need to change group in future
    this.gs.isValidPermission().then(data => {
      this.isIL2000 = data;
      this.setDropdownOptions();
    });

    this.teamsPodColor = {
      'blueteam@il2000.com': 'blue',
      'redteam@il2000.com': 'red',
      'goldteam@il2000.com': 'gold',
      'greenteam@il2000.com': 'green',
      none: 'none'
    };

    this.getStatusDropdown();
    this.getCarrierDropdown();
    // SET LP DROP DOWN
    this.teamPodEmailDropDown = Constants.LP_TEAM_EMAIL;

    // POPULATE STRING ARRAYS WITH DATA FROM GRID
    this.trackingDropDownData.forEach((value: any) => {
      if (value.Destination) {
        const consigneeState = value.Destination.split(',', 2).pop().toString();
        const consigneeCity = value.Destination.split(',', 1).toString();
        this.consigneeState.push(consigneeState);
        this.consigneeCity.push(consigneeCity);
      }
      if (value.Origin) {
        const shipperState = value.Origin.split(',', 2).pop().toString();
        const shipperCity = value.Origin.split(',', 1).toString();
        this.shipperState.push(shipperState);
        this.shipperCity.push(shipperCity);
      }

      if (value.Shipper) {
        this.shipperName.push(value.Shipper);
      }

      if (value.Consignee) {
        this.consigneeName.push(value.Consignee);
      }
    });

    // SORT AND FILTER DROP DOWN VALUES
    this.sortAndFilter(this.shipperName).forEach((value: any) => {
      this.shipperDropDown.push({item: value, value});
    });

    this.sortAndFilter(this.consigneeName).forEach((value: any) => {
      this.consigneeDropDown.push({item: value, value});
    });

    this.sortAndFilter(this.shipperState).forEach((value: any) => {
      if (value.trim()) {
        this.shipperStateDropDown.push({item: value, value});
      }
    });

    this.sortAndFilter(this.consigneeState).forEach((value: any) => {
      if (value.trim()) {
        this.consigneeStateDropDown.push({item: value, value});
      }
    });

    this.sortAndFilter(this.consigneeCity).forEach((value: any) => {
      if (value) {
        this.consigneeCityDropDown.push({item: value, value});
      }
    });

    this.sortAndFilter(this.shipperCity).forEach((value: any) => {
      if (value) {
        this.shipperCityDropDown.push({item: value, value});
      }
    });
    this.spinner.show('advancedFilter');
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'value',
      textField: 'item',
      itemsShowLimit: 5,
      allowSearchFilter: true,
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All'
    };

    this.spinner.hide('advancedFilter');

    this.utilityService.resetFilter.subscribe(res => {
      if (res) {
        this.clearAllFilters();
      }
    });
  }

  setDropdownValue(data: any) {
    if (this.trackingDropDownData.length === 0) {
      this.trackingDropDownData = data;
    }

    this.trackingDropDownData.forEach((value: any) => {
      if (value.Destination) {
        const consigneeState = value.Destination.split(',', 2).pop().toString();
        const consigneeCity = value.Destination.split(',', 1).toString();
        this.consigneeState.push(consigneeState);
        this.consigneeCity.push(consigneeCity);
      }
      if (value.Origin) {
        const shipperState = value.Origin.split(',', 2).pop().toString();
        const shipperCity = value.Origin.split(',', 1).toString();
        this.shipperState.push(shipperState);
        this.shipperCity.push(shipperCity);
      }

      if (value.Shipper) {
        this.shipperName.push(value.Shipper);
      }

      if (value.Consignee) {
        this.consigneeName.push(value.Consignee);
      }
    });

    this.shipperDropDown = Array.from(new Set(
      this.sortAndFilter(this.shipperName).map((value: any): any => {
        if (value.trim() !== '') {
          return { item: value, value };
        }
      }).filter(Boolean)
    ));

    this.shipperStateDropDown = Array.from(new Set(
      this.sortAndFilter(this.shipperState).map((value: any): any => {
        if (value.trim() !== '') {
          return { item: value, value };
        }
      }).filter(Boolean)
    ));

    this.shipperCityDropDown = Array.from(new Set(
      this.sortAndFilter(this.shipperCity).map((value: any): any => {
        if (value.trim() !== '') {
          return { item: value, value };
        }
      }).filter(Boolean)
    ));


    this.consigneeDropDown = Array.from(new Set(
      this.sortAndFilter(this.consigneeName).map((value: any): any => {
        if (value.trim() !== '') {
          return { item: value, value };
        }
      }).filter(Boolean)
    ));

    this.consigneeStateDropDown = Array.from(new Set(
      this.sortAndFilter(this.consigneeState).map((value: any): any => {
        if (value.trim() !== '') {
          return { item: value, value };
        }
      }).filter(Boolean)
    ));

    this.consigneeCityDropDown = Array.from(new Set(
      this.sortAndFilter(this.consigneeCity).map((value: any): any => {
        if (value.trim() !== '') {
          return { item: value, value };
        }
      }).filter(Boolean)
    ));

  }

  // METHOD THAT SENDS FILTER VALUES TO GRIDS
  filterResults() {
    this.formFilters.emit(this.formGroupFilters);
  }

  clearAllFilters() {
    this.clearFilter.emit(true);
    this.formGroupFilters = {
      fromDate: '',
      toDate: '',
      deliveryFromDate: '',
      deliveryToDate: '',
      clients: [],
      carriers: [],
      shippers: [],
      shipperCities: [],
      shipperStates: [],
      consignees: [],
      consigneeCities: [],
      consigneeStates: [],
      billTypes: [],
      statuses: [],
      teamPodEmail: []
    };
    $('label.floating').attr('hidden', 'true');
  }

  sortAndFilter(data: any[]) {
    return data.sort().filter((x, i, a) => !i || x != a[i - 1]);
  }

// STATUS DROP DOWN
  getStatusDropdown() {
    if (this.statusesSearchList.length > 0 || this.global.statusFilterData().length > 0) {
      this.statusDropdown = this.statusesSearchList.length > 0 ? this.statusesSearchList : this.global.statusFilterData();
      this.statusLoaded = true;
      return;
    }

    this.rs.getAvailableStatuses().subscribe({
      next: response => {
        let statuses: string[] = [];
        response.forEach((value: { status: string; }) => {
          statuses.push(value.status);
        });

        this.sortAndFilter(statuses).forEach(value => {
          this.statusDropdown.push({item: value, value});
        });

        this.global.statusFilterData.set(this.statusDropdown);
      },
      complete: () => {
        this.statusLoaded = true;
      }
    });
  }

  // CARRIER DROPDOWN
  getCarrierDropdown() {
    // Get All tracking data
    if (this.carrierSearchList.length > 0 || this.global.carrierFilterData().length > 0) {
      this.carrierDropDown = this.carrierSearchList.length > 0 ? this.carrierSearchList : this.global.carrierFilterData();
      this.carrierLoaded = true;
      return;
    }

    this.ts.getAdvancedFilterCarrier().subscribe({
      next: response => {
        const carrierData: any[] = response;
        let carriers: string[] = [];

        carrierData.forEach(value => {
          carriers.push(value.CarrierDropDown);
        });

        this.sortAndFilter(carriers).forEach(value => {
          this.carrierDropDown.push({item: value, value});
        });

        this.global.carrierFilterData.set(this.carrierDropDown);
      },
      complete: () => {
        this.carrierLoaded = true;
      }
    });
  }

  // CLIENT DROPDOWN
  setDropdownOptions() {
    if (this.clientSearchList.length > 0 || this.global.clientFilterData().length > 0) {
      this.clientDropDown = this.clientSearchList.length > 0 ? this.clientSearchList : this.global.clientFilterData();
      this.clientLoaded = true;
      return;
    }

    this.igs.getClientDropdown().subscribe({
      next: (response) => {
        // REDUCE TO REMOVE DUPLICATE CLIENT CODES
        const client =  (response as any[]).reduce((accumulator, current) => {
          if (!accumulator.some((item: any) => item.clientCode === current.clientCode)) {
            accumulator.push(current);
          }
          return accumulator;
        }, []);

        // GROUP CLIENTS WITH PLANTS
        client.forEach((c: any) => {
          this.clientDropDown.push({
            item: c.clientCode + '-' + c.companyName,
            value: c.clientCode + '-' + c.companyName
          });
        });

        this.global.clientFilterData.set(this.clientDropDown);
      },
      complete: () => {
        this.clientLoaded = true;
      }
    });
  }

  // NEEDED FOR MULTI SELECT FLOATING LABEL
  checkMultiSelectValues(elementName: string, arrayLength: number) {
    if (arrayLength != 0) {
      $(elementName).removeAttr('hidden');
    } else {
      $(elementName).attr('hidden', 'true');
    }
  }

  setClientsByTeam() {
    let clients: any[] = [];
    this.formGroupFilters.clients.length = 0;
    this.formGroupFilters.teamPodEmail.forEach((team: any) => {
      this.trackingDropDownData.forEach((value: any) => {
        if (value.TeamColor.toUpperCase() ===  this.teamsPodColor[team.value].toUpperCase()) {
          this.clientDropDown.forEach(client => {
            let clientCode = client.value.split('-')[0];
            if (clientCode.toUpperCase() === value.ClientCode.toUpperCase()) {
              clients.push({value: client.value, item: client.value});
            }
          });
        }
      });
    });

    this.formGroupFilters.clients = clients.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);
  }
}
