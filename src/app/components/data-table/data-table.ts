import {
  AfterViewInit,
  Component,
  EventEmitter,
  Injectable,
  input,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {DataTableDirective} from 'angular-datatables';
import {fromEvent, Observable, Subject, Subscription} from 'rxjs';
import {AdvancedSearchModal} from '../advanced-search-modal/advanced-search-modal';
import {Router} from '@angular/router';
import {Global} from '../../common/global';
import {Location} from '@angular/common';
import {GroupsService} from '../../services/groups/groups.service';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-data-table',
  standalone: false,
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable implements AfterViewInit, OnDestroy, OnInit {
// export class DataTable implements OnDestroy, OnInit {
  @ViewChild(DataTableDirective)
  dtElement!: DataTableDirective;
  dtOption: any = {};
  dtTrigger: Subject<any> = new Subject();
  @Output() freightClickEvent = new EventEmitter<any>();
  @Output() selectedRowData = new EventEmitter<number>(true);
  @Output() manageUserClickEvent = new EventEmitter<any>();
  @Output() editCarrierClickEvent = new EventEmitter<any>();
  @Output() updateRatesEvent = new EventEmitter<any>();
  @Output() emitEventShowRate = new EventEmitter<number>(true);
  @Output() advancedFormFilters = new EventEmitter<object>(true);
  @Output() resetTable = new EventEmitter<boolean>(true);
  @Output() refreshTableEvent = new EventEmitter<any>(true);
  data = input<any>();
  @Input() columns: any;
  @Input() customSort?: any;
  @Input() paging?: boolean;
  @Input() ordering?: boolean;
  @Input() info?: boolean;
  @Input() searching?: boolean;
  @Input() autoWidth?: boolean;
  @Input() hover = false;
  @Input() footerFixed = false;
  @Input() footerNoBtnFixed = false;
  @Input() gridName = 'Default';
  @Input() customFixedHeight = false;
  @Input() advancedSearch = false;
  @Input() isFreightForm = false;
  @Input() lengthChange = true;
  @Input() isProductList = false;
  setAdvancedFilterData = input<any>();
  @Input() currencyType = '';
  @Input() setCarrierFilterData: any;
  @Input() setStatusesFilterData: any;
  @Input() setClientsFilterData: any;
  @Input() isZeroRecords = false;
  isInternalGroupMgmt = false;
  @ViewChild(AdvancedSearchModal) adv!: AdvancedSearchModal;
  resizeObservable$!: Observable<Event>;
  resizeSubscription$!: Subscription;
  lastUpdatedTime = new Date().toLocaleTimeString();
  @Input() scrollY = false;
  @Input() scrollX = false;
  global = Global;
  private searchValue = '';
  private filteredResults: any;

  constructor(private router: Router, private location: Location, private gs: GroupsService) {
    this.gs.isValidPermission().then(data => {
      this.isInternalGroupMgmt = data;
    });
  }

  ngOnInit() {
    const scrollHeight = $(document).height() ? ($(document).height() ?? 0) - 300 : 0;
    this.dtOption = {
      select: this.isFreightForm ? 'multi' : false,
      paging: this.paging ? this.paging : false,
      ordering: this.ordering ? this.ordering : false,
      order: this.customSort ? this.customSort : '',
      info: this.info ? this.info : false,
      searching: this.searching ? this.searching : false,
      autoWidth: this.autoWidth ? this.autoWidth : false,
      data: this.data() ? this.data() : null,
      scrollY: this.scrollY ? scrollHeight + '' : '',
      scrollX: this.scrollX ? this.scrollX : false,
      columns: this.columns ? this.columns : null,
      lengthChange: this.lengthChange ? this.lengthChange : false,
      rowId: 'id',
      pagingType: 'simple_numbers',
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        // Unbind first to avoid any duplicate handler
        // (see https://github.com/l-lin/angular-datatables/issues/87)

        if (this.gridName === 'carrierList') {
          $('td div[id^="btnOnboardCarrier-"]').off('click');
          $('td div[id^="btnOnboardCarrier-"]', row).on('click', () => {
            self.clickHandler(data);
          });
          return row;
        }

        if (this.gridName === 'carrierQuotes') {
          $('td button[id^="btnViewOffer-"]').off('click');
          $('td button[id^="btnViewOffer-"]', row).on('click', () => {
            self.clickHandler(data);
          });
          return row;
        }

        $('td', row).off('click');
        $('td', row).on('click', () => {
          self.clickHandler(data);
        });

        // edit fields
        $('.editRateInput', row).off('change');
        $('.editRateInput', row).on('change', () => {
          self.editRates(data);
        });

        $(`td div[id="btnShowRate${index}"]`, row).off('click');
        $(`td div[id="btnShowRate${index}"]`, row).on('click', () => {
          self.clickEmitEventShowRate(data);
        });
        return row;
      },
      lengthMenu: this.isProductList ? [15, 50, 75, 100, -1] : [25, 50, 75, 100, -1],
      language: {
        searchPlaceholder: 'Search',
        search: '',
        lengthMenu: this.isProductList ?
          `Display <select name="${this.gridName + (this.hover ? 'DataTable_length' : 'DataTable1_length')}" aria-controls="${this.gridName + 'DataTable' + this.hover ? '' : '1'}" class="custom-select form-control form-control-sm" style="margin-left:0;min-width:55px">` +
          '<option selected value="15">15</option>' +
          '<option value="25">25</option>' +
          '<option value="50">50</option>' +
          '<option value="75">75</option>' +
          '<option value="100">100</option>' +
          '<option value="-1">All</option>' +
          '</select> records'
          :
          `Display <select name="${this.gridName + (this.hover ? 'DataTable_length' : 'DataTable1_length')}" aria-controls="${this.gridName + 'DataTable' + this.hover ? '' : '1'}" class="custom-select form-control form-control-sm" style="margin-left:0;min-width:55px">` +
          '<option selected value="25">25</option>' +
          '<option value="50">50</option>' +
          '<option value="75">75</option>' +
          '<option value="100">100</option>' +
          '<option value="-1">All</option>' +
          '</select> records'
        ,
        info: 'Displaying _START_ to _END_ of _TOTAL_ entries',
        zeroRecords: this.isZeroRecords ? ' ' : 'No data available in table'
      },
      responsive: true,
      dom: this.dataTableDomFunction(),
      drawCallback: () => {
        this.dataTableToolTip();
        if (this.customFixedHeight) {
          $('div.table-responsive').addClass('disable-v-scroll');
        }
      },
      initComplete: () => {
        // set the default selected row
        for (let i = 0; i < this.data().length; i++) {
          if (this.data()[i].assigned == true) {
            this.getSelectedRow(this.data()[i]);
          }
        }
        if (this.customFixedHeight) {
          // INITIALIZE DISPLAY RECORDS
          this.resizeDisplayRecords();
          // ON WINDOW RESIZE
          this.resizeObservable$ = fromEvent(window, 'resize');
          this.resizeSubscription$ = this.resizeObservable$.subscribe(() => {
            this.resizeDisplayRecords();
          });
        }
        // hide carrier rate by default
        $('.buyRate').hide();
      },
      // Configure the buttons
      buttons: this.footerFixed ? [
        {
          extend: '',
          text: `<i class="material-icons icon-pointer" data-bs-toggle="modal" data-bs-target="${'#' + this.gridName}" id="filter-icon" style="color:#007bff;font-size: 20px; font-weight: bold;">filter_list</i>`,
          className: 'ml-1 btn btn-light btn-sm btn-dt-height',
          action: () => {
            this.adv?.setDropdownValue(this.setAdvancedFilterData());
          }
        },
        {
          extend: 'csv',
          title: 'Icarus Data Export',
          text: '<i class="material-icons float-end icon-pointer"  id="downloadCsv" style="color:#007bff;font-size: 20px; font-weight: bold;">get_app</i>',
          className: 'btn btn-light btn-sm btn-dt-height',
          exportOptions: {
            // indexes of the columns that should be printed - Visible col only
            columns: ':visible'
          },
          // REFERENCE FOR DataTable CUSTOMIZE PROPERTY: https://datatables.net/reference/button/csv
          customize: (csv: any) => {
            const split_csv = csv.split('\n');

            split_csv.forEach((csv_row: any, index: any) => {
              // Split on quotes and comma to get each cell
              const csv_cell_array = csv_row.split('","');
              const lastColIndex = csv_cell_array.length - 1;
              // Remove replace the two quotes which are left at the beginning and the end (first and last cell)
              csv_cell_array[0] = csv_cell_array[0].replace(/"/g, '');
              csv_cell_array[lastColIndex] = csv_cell_array[lastColIndex].replace(/"/g, '');
              // Remove carriage return on the last cell
              csv_cell_array[lastColIndex] = csv_cell_array[lastColIndex].replace(/(\r\n|\n|\r)/gm, '');

              if (csv_cell_array[0] == '2pause') {
                csv_cell_array[0] = 'Tracking-Idle';
              } else if (csv_cell_array[0] == '0arrow_upward') {
                csv_cell_array[0] = 'Elevated Priority';
              } else if (csv_cell_array[0] == '3fiber_manual_record') {
                csv_cell_array[0] = 'Tracking';
              } else if (csv_cell_array[0] == '4play_arrow') {
                csv_cell_array[0] = 'Tracking-Dispatched';
              } else if (csv_cell_array[0] == '1clear') {
                csv_cell_array[0] = 'Not Tracking';
              } else {
                csv_cell_array[0] = csv_cell_array[0];
              }

              // Join the table on the quotes and comma; add back the quotes at the beginning and end
              // Insert the new row into the row array at the previous index
              split_csv[index] = '"' + csv_cell_array.join('","') + '"';
            });

            // Join the rows with line break and return the final csv (datatables will take the returned csv and process it)
            return split_csv.join('\n');
          }
        },
        {
          extend: '',
          text: '<span class="dodger-blue">Clear Filters</span>',
          className: `btn btn-light btn-sm btn-dt-height btn-clear-filter-${this.gridName}`,
          action: () => {
            this.reset(true);
            this.adv?.clearAllFilters();
          }
        }
      ] : [{
        extend: '',
        text: `<i class="material-icons" id="search-icon" style="margin-left: 5px;color:black;font-size: 20px; font-weight: bold;">search</i>`,
        className: 'btn btn-light btn-sm search-icon pl-0 btn-dt-height pointer-event-none',
        enabled: false
      }]
    };
  }

  // rates
  showHideBuyRate() {
    if ($('.buyRate').is(':visible')) {
      $('.buyRate').hide();
    } else {
      $('.buyRate').show();
    }
  }

  // breakdown
  showHideBuyRateCB() {
    if ($('#rateBreakdownDataTable > thead > tr > th:nth-child(3)').is(':visible')) {
      $('#rateBreakdownDataTable > thead > tr > th:nth-child(3)').hide();
      $('#rateBreakdownDataTable').find('tr td:nth-child(3)').each(function() {
        $(this).hide();
      });
    } else {
      $('#rateBreakdownDataTable > thead > tr > th:nth-child(3)').show();
      $('#rateBreakdownDataTable').find('tr td:nth-child(3)').each(function() {
        $(this).show();
      });
    }
  }

  getLocationPath(): string {
    let path: string;
    path = this.location.path();
    return path;
  }

  editRates(data: any) {
    data.transitTime = $('#transitTime' + data.quoteID).val() ? $('#transitTime' + data.quoteID).val() : data.transitTime;
    data.notes = $('#notes' + data.quoteID).val() ? $('#notes' + data.quoteID).val() : data.notes;
    data.quoteNumber = $('#quoteNumber' + data.quoteID).val() ? $('#quoteNumber' + data.quoteID).val() : data.quoteNumber;
    data.carrierCost = $('#ilCost' + data.quoteID).val() ? $('#ilCost' + data.quoteID).val() : data.carrierCost;
    data.clientCost = $('#clientCost' + data.quoteID).val() ? $('#clientCost' + data.quoteID).val() : data.clientCost;
    // assigned
    if (!$(`input[id="${data.id}"]`).prop('disabled') && $(`input[id="${data.id}"]`).prop('checked')) {
      $('input[name^=\'input\']').prop('checked', false);
      $(`input[id="${data.id}"]`).prop('checked', true);
      this.getSelectedRow(data);
    } else {
      if (!$('input[name^=\'input\']').prop('checked')) {
        this.getSelectedRow(null);
      }
    }
    this.updateRatesEvent.emit(data);
  }

  // Note: We should find a more explicit way to handle this in the future
  clickHandler(data: any) {
    // History grid and note grids
    if (this.gridName === 'notesList' && data.id) {
      this.router.navigate(['SPAs/notes/' + data.id]).then();
    }

    if (this.gridName === 'carrierHistoryRates') {
      this.selectedRowData.emit(data);
    }
    if (this.gridName === 'carrierHistoryRatesGrid') {
      this.selectedRowData.emit(data);
    }

    if (this.gridName === 'manageUsers') {
      const selectedCount = $('tr.selected').length;
      if (selectedCount > 0) {
        $('tr').removeClass('selected');
      }
      if (data.UserID != null) { this.manageUserClickEvent.emit(data); }
    }

    if (this.gridName === 'carrierQuotes') {
      const selectedCount = $('tr.selected').length;
      if (selectedCount > 0) {
        $('tr').removeClass('selected');
      }
      if (data.loadOfferId != null) { this.editCarrierClickEvent.emit(data); }
    }

    if (this.gridName === 'carrierList') {
      if (data.mcNumber != null && data.mcNumber != '') {
        this.router.navigate(['SPAs/carriers/onboard/' + data.mcNumber]).then();
      }
    }

    if (data.eventDate || data.notText || data.carrierID) {
    } else if ((data.transitTime != null) || (data.carrierName === 'Other') || (data.isVolumeRate) || (data.isTLRate)) {
      // Product list event
    } else if (data.nmfc != null) {
      this.freightClickEvent.emit(data);
    } else {
      // Records global search redirect
      if (data.shipmentID) {
        const url = this.router.serializeUrl(this.router.createUrlTree(['/SPAs/tracking/tracking-details/' + data.shipmentID + '/' + data.GroupID]));
        window.open(url, '_blank');
      } else if (data.RowType == 'tracking' || window.location.href.includes('/SPAs/ltltrack')) {
        const url = this.router.serializeUrl(this.router.createUrlTree(['/SPAs/tracking/tracking-details/' + data.ShipmentID + '/' + data.GroupID]));
        window.open(url, '_blank');
        // Records redirect
      } else if (data.RowType == 'tltracking') {
        const url = this.router.serializeUrl(this.router.createUrlTree(['/SPAs/tracking/truckload-details/' + data.truckID + '/' + data.GroupID]));
        window.open(url, '_blank');
        // Records redirect
      } else {
        if (window.location.href.includes('/SPAs/records')) {
          const url = this.router.serializeUrl(this.router.createUrlTree(['/SPAs/tracking/tracking-details/' + data.ShipmentID + '/' + data.GroupID]));
          window.open(url, '_blank');
        }
      }
    }
  }

  getSelectedRow(rowData: any) {
    this.selectedRowData.emit(rowData);
  }

  clickEmitEventShowRate(rowData: any) {
    this.emitEventShowRate.emit(rowData);
  }

  ngAfterViewInit(): void {
    this.dtTrigger.next(null);
  }

  ngOnDestroy(): void {
    // Remember to unsubscribe the event
    this.dtTrigger.unsubscribe();
    if (this.customFixedHeight) {
      this.resizeSubscription$?.unsubscribe();
    }
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: any) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      this.dtTrigger.next(null);
    });
  }

  advancedFilters(value: any) {
    this.advancedFormFilters.emit(value);
    this.filteredResults = value;
  }

  refreshTable() {
    this.adv?.filterResults();
    this.dtElement.dtInstance.then((dtInstance: any) => {
      // GET SEARCH VALUE FOR REFRESH
      this.searchValue = dtInstance.search();
    });
  }

  // BOOLEAN VALUE SENT TO GRID TO DRAW TABLE WITH ORIGINAL VALUES
  reset(value: any) {
    this.resetTable.emit(value);
    this.searchValue = '';
  }

  reDrawTable(newData: any) {
    if (this.filteredResults?.clients?.length !== 0 ||
      this.filteredResults?.consigneeCities?.length !== 0 ||
      this.filteredResults?.billTypes?.length !== 0 ||
      this.filteredResults?.carriers?.length !== 0 ||
      this.filteredResults?.consigneeStates?.length !== 0 ||
      this.filteredResults?.consignees?.length !== 0 ||
      this.filteredResults?.lPNames?.length !== 0 ||
      this.filteredResults?.shipperCities?.length !== 0 ||
      this.filteredResults?.shipperStates?.length !== 0 ||
      this.filteredResults?.shippers?.length !== 0 ||
      this.filteredResults?.statuses?.length !== 0 ||
      this.filteredResults?.fromDate != '' ||
      this.filteredResults?.toDate != ''
    ) {
      this.searchValue = '';
    }

    this.dtElement.dtInstance.then((dtInstance: any) => {
      // IF SEARCH VALUE CONTAINS VALUE WE SET THAT AND THEN CLEAR TABLE ADD NEW VALUES AND THEN RE DRAW
      dtInstance.search(this.searchValue).clear().rows.add(newData).draw();
    });
  }

  dataTableDomFunction(): string {
    let rowText: string;
    if (this.footerFixed || this.footerNoBtnFixed) {
      rowText = '<\'row\'<\'col-sm-12 col-md-6\'l><\'col-sm-12 col-md-6 d-inline-flex justify-content-end btn-dt-height\'fB>>' +
        '<\'row\'<\'col-sm-12\'tr>>' +
        '<\'row\'<\'col-sm-12 col-md-5\'<\'fixed-bottom bg-white px-4 pt-2 pb-5 offset-sm-3 fw-bold\'i>>' +
        '<\'col-sm-12 col-md-7\'<\'fixed-bottom offset-sm-3 pt-0 pb-5\'p>>>';
    } else if (this.isProductList && this.info === false) {
      rowText = '<\'row\'<\'col-sm-12 col-md-3\'l><\'col-sm-12 col-md-9 d-inline-flex justify-content-end btn-dt-height\'fB>>' +
        '<\'row\'<\'col-sm-12\'tr>>' +
        '<\'row\'<\'col-sm-12 col-md-7 pt-2 pr-5\'p>>';
    } else {
      rowText = '<\'row\'<\'col-sm-12 col-md-6\'l><\'col-sm-12 col-md-6\'f>>' +
        '<\'row\'<\'col-sm-12\'tr>>' +
        '<\'row\'<\'col-sm-12 col-md-5\'i><\'col-sm-12 col-md-7\'p>>';
    }
    return rowText;
  }

  adjustRecordLength(pageLength: number) {
    this.dtElement.dtInstance.then((dtInstance: any) => {
      dtInstance.page.len(pageLength).draw();
    });
  }

  refreshIconClick() {
    this.lastUpdatedTime = new Date().toLocaleTimeString();
    this.refreshTableEvent.emit();
  }

  resizeDisplayRecords() {
    if (this.customFixedHeight) {
      if (($(window).height() ?? 0) <= 615) {
        this.adjustRecordLength(10);
      } else if (
        ($(window).height() ?? 0) >= 615 &&
        ($(window).height() ?? 0) <= 680
      ) {
        this.adjustRecordLength(
          this.gridName === 'trackingWhiteboard' ? 10 : 15
        );
      }
      if (
        ($(window).height() ?? 0) >= 702 &&
        ($(window).height() ?? 0) < 818
      ) {
        this.adjustRecordLength(
          this.gridName === 'trackingWhiteboard' ? 10 : 15
        );
      } else if (
        ($(window).height() ?? 0) >= 818 &&
        ($(window).height() ?? 0) < 940
      ) {
        this.adjustRecordLength(20);
      } else if (
        ($(window).height() ?? 0) >= 940 &&
        ($(window).height() ?? 0) <= 1050
      ) {
        this.adjustRecordLength(25);
      } else if (
        ($(window).height() ?? 0) >= 1050 &&
        ($(window).height() ?? 0) <= 1164
      ) {
        this.adjustRecordLength(30);
      } else if (
        ($(window).height() ?? 0) >= 1174 &&
        ($(window).height() ?? 0) <= 1250
      ) {
        this.adjustRecordLength(40);
      }
    }
  }

  dataTableToolTip() {
    // Allows tool tip on data columns/rows - for row level add custom logic here for column level add in render on column def
    if (this.data().length > 0) {
      // Custom Data Logic
      this.data().forEach((value: any) => {
        // Add a tool tip to volume rate rows - Rate Grid Data Table
        if (value.isVolumeRate) {
          $(`tr[id="${value.id}"]`).attr({
            'data-bs-toggle': 'tooltip',
            title: 'Volume-quoted shipments move on a space-available basis.Transit times may vary.',
            'data-placement': 'bottom'
          });
        }

        if (value.carrierName === 'IL2000 Truckload' && value.isTLRate) {
          $(`tr[id="${value.id}"]`).attr({
            'data-bs-toggle': 'tooltip',
            title: 'The final rate may vary by a small amount based upon the actual ship date. ' +
              'After selecting this option IL2000 will respond with the final rate.',
            'data-placement': 'bottom'
          });
        }
      });
    }

    // Enable Tool Tip On Hover
    $('[data-bs-toggle="tooltip"]').tooltip({
      trigger: 'hover'
    });
  }
}

