import {Component, OnInit, ViewChild} from '@angular/core';
import {DataTable} from '../../../../components/data-table/data-table';
import {interval, Subscription} from 'rxjs';
import {NgxSpinnerService} from 'ngx-spinner';
import {Global} from '../../../../common/global';
import Swal from 'sweetalert2';
import {CarrierProfilingService} from '../../../../services/carrier-profiling/carrier-profiling.service';
import {CarrierDetail} from '../../../../interfaces/carrier-detail';
import {environment} from '../../../../../environments/environment';

@Component({
  selector: 'app-carrier-list',
  standalone: false,
  templateUrl: './carrier-list.html',
  styleUrl: './carrier-list.css',
})
export class CarrierListComponent implements OnInit {
  @ViewChild(DataTable) dt!: DataTable;
  carriersTableColumns: any;
  sortOrder: any;
  subscription!: Subscription;
  global = Global;
  registrationRecords: any;
  carrierList: CarrierDetail[] = [] as CarrierDetail[];
  mcNumber = '';
  dotNumber = '';
  onboardedCarriers = true;
  carriers: CarrierDetail[] | null = [] as CarrierDetail[];
  carrierSource = environment.CARRIER_SOURCE;

  constructor(private spinner: NgxSpinnerService, private cps: CarrierProfilingService) {
  }

  get carrierName() {
    const carrier: string[] = [];
    this.carrierList.forEach(val => {
      const mcNumber = val.mcNumber ? 'MC: #' + val.mcNumber + '. ' : '';
      const dotNumber = val.dotNumber ? 'DOT: #' + val.dotNumber : '';
      const descNumbers = mcNumber + dotNumber;
      carrier.push(val.carrierName + (descNumbers !== '' ? ' (' + descNumbers + ')' : ''));
    });
    return carrier;
  }

  ngOnInit(): void {
    const availableCarriers = sessionStorage.getItem('availableCarriers');
    const carrierData = availableCarriers ? JSON.parse(availableCarriers) : null;
    $('#carrierListDataTable_wrapper > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)').css('display', 'none');
    this.carriersTableColumns = [
      {
        title: 'Name',
        data: 'carrierName',
        orderable: true,
        targets: 0,
        width: '6%',
        className: 'dt-nowrap',
        render(data: any) {
          if (data === null) {
            return '';
          }
          return '<span tabindex="0">' + data.toUpperCase() + '</span>';
        }
      },
      {
        title: 'SCAC',
        data: 'scac',
        orderable: true,
        targets: 1,
        className: 'dt-nowrap',
        render(data: any) {
          if (data === null) {
            return '';
          }
          return '<span tabindex="0">' + data.toUpperCase() + '</span>';
        }
      },
      {
        title: 'MC Number',
        data: 'mcNumber',
        orderable: true,
        targets: 2,
        className: 'dt-nowrap',
        render(data: any) {
          if (data === null) {
            return '';
          }
          return '<div id="btnOnboardCarrier-' + data.toUpperCase() + '" class="dodger-blue pointer">' + data.toUpperCase() + '</div>';
        }
      },
      {
        title: 'DOT Number',
        data: 'dotNumber',
        orderable: true,
        targets: 3,
        className: 'dt-nowrap'
      },
      {
        title: 'Address',
        data: 'address1',
        orderable: false,
        targets: 4,
        className: 'dt-nowrap',
        render(data: any, type: any, row: any) {
          return (row.address1 ? row.address1 + '<br>' : '') + (row.city ? row.city + ', ' : '') + (row.state ? row.state : '') + ' ' +
            (row.postalCode ? row.postalCode : '');
        }
      },
      {
        title: 'Onboard',
        data: 'onboarded',
        orderable: false,
        targets: 7,
        className: 'dt-nowrap',
        render(data: any) {
          if (data === 1) {
            return '<div class="text-center"><span class="material-icons" style="color: green;">verified</span></div>';
          }
          return '';
        }
      },
      {
        title: 'TT in network',
        data: 'inNetworkTT',
        orderable: false,
        targets: 7,
        className: 'dt-nowrap',
        render(data: any) {
          if (data) {
            return '<div class="text-center"><span class="material-icons" style="color: green;">verified</span></div>';
          }
          return '';
        }
      }
    ];

    this.getCarrierList(carrierData);
    const source = interval(300000);
    this.subscription = source.subscribe(() => this.refreshGrids(carrierData));
    this.sortOrder = [[0, 'asc']];
  }

  setCarriersData(onboarded: boolean = true, all: boolean = false) {
    this.onboardedCarriers = onboarded;
    this.carriers = null;
    if (this.carrierList.length > 0) {
      if (all) {
        this.carriers = this.carrierList;
      } else {
        this.carriers = this.carrierList.filter(c => Boolean(c.onboarded) === onboarded);
      }
    }
    if (this.dt) { this.dt.reDrawTable(this.carriers); }
    $('#carrierListDataTable_wrapper > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)').css('display', 'none');
  }

  refreshGrids(carriersData: CarrierDetail[]) {
    this.carrierList.length = 0;
    this.dt.lastUpdatedTime = new Date().toLocaleTimeString();
    this.getCarrierList(carriersData);
  }

  getCarrierList(carriersData: CarrierDetail[]) {
    this.spinner.show('spinnerCarrierForm').then();
    if (carriersData && carriersData.length > 0) {
      for (const carrier of carriersData) {
        this.carrierList.push(carrier);
      }
      this.setCarriersData(true);
      this.spinner.hide('spinnerCarrierForm').then();
    } else {
      this.cps.getAvailableCarriers().subscribe({
        next: (response) => {
          for (const carrier of response) {
            this.carrierList.push(carrier);
          }
        },
        complete: () => {
          this.setCarriersData(true);
          this.spinner.hide('spinnerCarrierForm').then();
        }
      });
    }
  }

  onClickRegistrationStep() {
    let carrierNumber: string | null = null;
    let typeNumber = 'MC';
    const mcNumber = this.mcNumber;
    const DotNumber = this.dotNumber;

    if ((mcNumber === '' || mcNumber == null) && (DotNumber === '' || DotNumber == null)) {
    } else {
      carrierNumber = mcNumber;
      if (mcNumber === '' || mcNumber == null) {
        typeNumber = 'DOT';
        carrierNumber = DotNumber;
      }
    }

    this.spinner.show('spinnerCarrierForm').then();
    this.cps.getCarrierRegistrationStep(carrierNumber, typeNumber).subscribe({
      next: (response) => {
        this.mcNumber = '';
        this.dotNumber = '';
        this.registrationRecords = response;
        $('#carrierRegistrationStepModal').modal('show');
      },
      error: (error: any) => {
        this.spinner.hide('spinnerCarrierForm').then();
        Swal.fire('Registration step', error.toString(), 'warning').then(null);
      },
      complete: () => {
        this.spinner.hide('spinnerCarrierForm').then();
      }
    });
  }
}

