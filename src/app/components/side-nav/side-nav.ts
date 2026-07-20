import {Component, HostListener, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import { AuthenticatorService } from "@aws-amplify/ui-angular";
import { fetchAuthSession } from "aws-amplify/auth";
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from '../../../environments/environment';
import {Location} from '@angular/common';
import {Global} from '../../common/global';
import {TrackingService} from '../../services/tracking/tracking.service';
import {ReportsService} from '../../services/reports/reports.service';
import {InternalGroupService} from '../../services/internal-group/internal-group.service';
import {TruckSave} from '../../interfaces/truck-save';
import {TruckSaveService} from '../../services/truck-save/truck-save.service';
import Swal from 'sweetalert2';
import moment from 'moment';
import {NgxSpinnerService} from 'ngx-spinner';
import {Reports} from '../../views/reports/reports';
import { UtilityService } from '../../services/utility/utility.service';
import {GroupsService} from '../../services/groups/groups.service';

@Component({
  selector: 'app-side-nav',
  standalone: false,
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css'
})
export class SideNav implements OnInit, OnDestroy {
  @ViewChild(Reports) rs!: Reports;
  location$: any;
  quickRatesTab = 'nav-link';
  newShipmentsTab = 'nav-link';
  reportsTab = 'nav-link';
  manageUsersTab = 'nav-link';
  globalSearch = '';
  searchType = 'LTL';
  email = '';
  isInternalUser = false;
  globalTruckSearch = '';
  isCollapsed = false;
  global = Global;
  currentUserName: any;
  currentUserType = signal(0);
  icarusEnvironment: any;
  showQuote = false;
  showPriorityReturn = false;
  showPickup = false;
  showInTransit = false;
  showDelivered = false;
  showTruckQuote = false;
  showTruckPickup = false;
  showTruckProblem = false;
  showTruckInTransit = false;
  showTruckDelivered = false;
  PopUp = Swal.mixin({
    title: 'You have unsaved changes, are you sure you’d like to leave this page?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d!important',
    confirmButtonText: 'Yes'
  });
  showTruckPlanning = false;

  @HostListener('window:resize', ['$event'])
  getScreenSize(event: any) {
    const scrWidth = event?.target?.innerWidth ?? window.innerWidth;
    Global.isCollapsed.set(scrWidth < 1201);
    this.isCollapsed = Global.isCollapsed();
  }

  constructor(private gs: GroupsService, private router: Router, private location: Location, private activatedRoute: ActivatedRoute,
              private tss: TruckSaveService, private ts: TrackingService, private reps: ReportsService, private igs: InternalGroupService,
              private spinner: NgxSpinnerService, private utilityService: UtilityService, public authenticator: AuthenticatorService) {
    this.checkSessionStatus().then();
    this.global.statusFilterData.set(this.activatedRoute.snapshot.data["statuses"]);
    this.global.carrierFilterData.set(this.activatedRoute.snapshot.data["carriers"]);
    const clients = this.activatedRoute.snapshot.data["clients"];
    if (clients) {
      const client = clients.reduce((accumulator: { clientCode: any; }[], current: { clientCode: any; }) => {
        if (!accumulator.some((item: { clientCode: any; }) => item.clientCode === current.clientCode)) {
          accumulator.push(current);
        }
        return accumulator;
      }, []);

      // GROUP CLIENTS WITH PLANTS
      client.forEach((c: { clientCode: string; companyName: string; }) => {
        this.global.clientFilterData.update(items => [...items, {
          item: c.clientCode + '-' + c.companyName,
          value: c.clientCode + '-' + c.companyName
        }]);
      });
    }
    this.resetGlobalTrackingTruckload();
    this.resetGlobalLTLTracking();
  }

  ngOnInit() {
    this.getAuth();
    const date = new Date(9999, 11, 31, 23, 59);
    this.global.formattedMaxDate.set(moment(date).local().format('YYYY-MM-DD'));
    this.global.formattedMaxDateTime.set(moment(date).local().format('YYYY-MM-DDThh:mm'));

    this.gs.isValidPermission().then(data => {
      this.isInternalUser = data;
    });

    if (window.location.href.includes('/rates')) {
      this.quickRatesTab += ' active';
    } else if (window.location.href.includes('/new')) {
      this.newShipmentsTab += ' active';
    } else if (window.location.href.includes('/tracking-details')) {
      // this.trackingTab += ' active';
    } else if (window.location.href.includes('/truckload-details') || window.location.href.includes('/tltrack')) {
      this.utilityService.updateTruckloadTrackingStatus('truckloadTracking');
      if (this.getLocationPath() === '/SPAs/tltrack') {
        setTimeout(() => {
          $('#truckload-tracking-toggle-btn').addClass('active');
          $('#collapseTruckloadTracking').addClass('show');
        }, 100);
      }
    } else if (window.location.href.includes('/records')) {
      this.global.recordStatus.set('recordsSearch');
      setTimeout(() => {
        $('#v-pills-dlv-report-tab').addClass('active');
        $('#collapseReport').addClass('show');
      }, 100);
    } else if (window.location.href.includes('/reports') || window.location.href.includes('/whiteboard')) {
      this.reportsTab += ' active';
    } else if (window.location.href.includes('/manage-users')) {
      this.manageUsersTab += ' active';
    } else if (window.location.href.includes('/carriers')) {
      // this.carriersTab += ' active';
    } else if (window.location.href.includes('/notes')) {
      // this.notesTab += ' active';
    } else if (window.location.href.includes('/ltltrack')) {
      this.utilityService.updateTrackingStatus('All');
      setTimeout(() => {
        $('#tracking-toggle-btn').addClass('active');
        $('#collapseTracking').addClass('show');
      }, 100);
    }

    this.icarusEnvironment = environment.ENV_ICARUS_BASE_URL;

    this.location$ = this.location.subscribe(value => {
      this.backArrowClickHandler(value.url ?? "");
    });

    this.getCarrierDropdown();
    this.getStatusDropdown();
    this.getClientDropdown();
    this.trackingTabLoad();
    this.sidebarToolTip();
    this.backArrowClickHandler(this.getLocationPath());

    // if (!window.location.href.includes('/ltltrack')) {
    //   setTimeout(() => {
    //     this.utilityService.updateTrackingStatus('All');
    //     this.getLTLTrackingData();
    //   }, 100);
    // }
  }

  async checkSessionStatus() {
    try {
      const session = await fetchAuthSession();
      // Check for the presence of an access token or ID token to confirm sign-in
      if (session?.tokens?.idToken?.payload) {
        this.email = session?.tokens?.idToken?.payload["email"] + '';
      } else {
        this.email = '';
      }

      this.gs.isValidPermission().then(data => {
        this.isInternalUser = data;
      });

    } catch (error) {
      // User is likely not authenticated
      this.email = '';
      console.error('Error checking auth session:', error);
    }
  }

  getAuth() {
    this.authenticator.subscribe(() => {
      this.currentUserName = this.authenticator?.user?.username ?? null;
      if (this.currentUserName) {
        this.gs.userType(this.currentUserName).subscribe({
          next: (response) => {
            this.currentUserType.set(response.UserType);
            Global.currentUserType.set(response.UserType);
          }
        });
      }
    });
  }

  globalTruckSearchExecute() {
    this.spinner.show('sidebarSpinner');
    this.tss.getTruck(this.globalTruckSearch).subscribe({
      next: (response: TruckSave) => {
        const truck: TruckSave = response as TruckSave;
        this.spinner.hide('sidebarSpinner');
        if (truck?.shipments && truck?.shipments.length > 0) {
          window.open('SPAs/tracking/truckload-details/' + truck.truckID + '/' + truck.shipments[0]?.client?.groupID, '_blank');
        } else {
          Swal.fire('', 'No shipments were found for Truck ' + this.globalTruckSearch, 'warning');
        }
        this.globalSearch = '';
        this.globalTruckSearch = '';
      },
      error: () => {
        this.spinner.hide('sidebarSpinner');
        Swal.fire('', 'Truck not found', 'warning');
      }
    });
  }

  globalSearchExecute() {
    if (this.globalSearch.length >= 4) {
      this.spinner.show('sidebarSpinner');
      this.reps.getReportsShipmentSearch(this.globalSearch).subscribe({
        next: (response: any) => {
          this.global.recordStatus.set('recordsAll');
          this.globalSearch = '';
          this.spinner.hide('sidebarSpinner');
          this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
            this.router.navigateByUrl('SPAs/records', { state: { data: response } }).then(() => {
              this.global.recordStatus.set('recordsAll');
              this.closeTrackingTab();
              this.clearTrackingActiveState();
              this.clearTruckloadTrackingActiveState();
              this.closeTruckloadTrackingTab();
              this.clearTabActiveState();
              this.clearReportsActiveState();
              this.closeOperationsTab();
              $('#v-pills-dlv-report-tab').addClass('active').trigger('click');
            });
          });
        },
        error: () => {
          this.spinner.hide('sidebarSpinner');
          Swal.fire('', 'Shipment not found', 'warning');
        }});
    }
  }

  keyEvent(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === 'Return') {
      this.globalShipmentSearch();
    }
  }

  signOut() {
    this.authenticator.signOut({ global: true });
    this.router.navigate([""]).then();
  }

  globalShipmentSearch() {
    if (this.searchType === 'LTL' && this.globalSearch) {
      this.globalSearchExecute();
    }
    if (this.searchType === 'TL' && this.globalSearch) {
      this.globalTruckSearch = this.globalSearch;
      this.globalTruckSearchExecute();
    }
  }

  closeReportTab() {
    // Collapse Reports Tab
    $('#collapseReport').removeClass('show').siblings();
    $('#v-pills-dlv-report-tab').addClass('collapsed').siblings();
  }

  closeTrackingTab() {
    // Collapse Tracking Tab
    $('#collapseTracking').removeClass('show').siblings()
    $('#tracking-toggle-btn').addClass('collapsed').siblings();
  }

  closeTruckloadTrackingTab() {
    // Collapse Truckload Tracking Tab
    $('#collapseTruckloadTracking').removeClass('show').siblings()
    $('#truckload-tracking-toggle-btn').addClass('collapsed').siblings();
  }

  openTrackingTab() {
    $('#collapseTracking').addClass('show').siblings();
  }

  openReportTab() {
    $('#collapseReport').addClass('show').siblings();
  }

  openTruckloadTrackingTab() {
    $('#collapseTruckloadTracking').addClass('show').siblings();
  }

  clearTrackingActiveState() {
    $('#v-pills-tab a.nav-link').removeClass('active').siblings();
    $('#v-pills-tabContent div.tab-pane').removeClass('active show').siblings();
  }

  clearTruckloadTrackingActiveState() {
    $('#v-pills-tab-truckload-tracking a.nav-link').removeClass('active').siblings();
    $('#v-pills-tabContent-truckload-tracking div.tab-pane').removeClass('active show').siblings();
  }

  clearReportsActiveState() {
    $('#collapseReports').removeClass('show').siblings();
  }

  // on all tab clicks update to clear truckload tracking active stat
  // update to close truckload tracking tab on all but truckload tracking tab click
  onTrackingTabClick(isLoadingPage = false): any {
    this.ts.boardName = 'LTL';
    if (this.global.shipmentEdited()) {
      return this.PopUp.fire().then((result) => {
        if (result.isConfirmed) {
          this.global.shipmentEdited.set(false);
          this.goToLtlTracking(isLoadingPage);
        } else {
          this.closeTrackingTab();
          this.clearTrackingActiveState();
        }
      });
    } else {
      this.goToLtlTracking(isLoadingPage);
    }
  }

  onTruckloadTrackingTabClick(isLoadingPage = false): any {
    this.ts.boardName = 'TL';
    if (this.global.shipmentEdited()) {
      return this.PopUp.fire().then((result) => {
        if (result.isConfirmed) {
          this.global.shipmentEdited.set(false);
          this.goToTruckloadTracking(isLoadingPage);
        } else {
          this.clearTruckloadTrackingActiveState();
          this.closeTruckloadTrackingTab();
        }
      });
    } else {
      this.goToTruckloadTracking(isLoadingPage);
    }
  }

  trackingTabLoad() {
    this.closeReportTab();
    this.clearReportsActiveState();
    this.clearTrackingActiveState();
    this.clearTruckloadTrackingActiveState();
    this.closeOperationsTab();
    this.closeTruckloadTrackingTab();
    this.clearTabActiveState();
  }

  onReportTabClick(): any {
    if (this.global.shipmentEdited()) {
      return this.PopUp.fire().then((result) => {
        if (result.isConfirmed) {
          this.global.shipmentEdited.set(false);
          this.goToRecords();
        } else {
          $('#v-pills-dlv-report-tab').removeClass('active');
          this.closeReportTab();

        }
      });
    } else {
      this.goToRecords();
    }
  }

  getLocationPath(): string {
    let path: string;
    path = this.location.path();
    return path;
  }

  setReportRoute(status: string) {
    $('a[aria-controls^="v-pills-records"].active').removeClass('active');
    $('a[aria-controls="v-pills-records-' + status + '"]').addClass('active');
    this.global.recordStatus.set(status);
  }

  clearTabActiveState() {
    $('a.nav-link').removeClass('active').siblings();
  }

  clearTabs() {
    this.closeReportTab();
    this.closeTrackingTab();
    this.clearTrackingActiveState();
    this.closeOperationsTab();
    this.clearTabActiveState();
    this.clearTruckloadTrackingActiveState();
    this.closeTruckloadTrackingTab();
    this.global.shipmentEdited.set(false);
  }

  backArrowClickHandler(path: string) {
    this.clearTabs();
    if (path === '/SPAs/rates') {
      $('#v-pills-quick-rates-tab').addClass('active');
    }

    if (path.includes('/SPAs/new')) {
      $('#v-pills-new-shipments-tab').addClass('active');
    }

    if (path === '/SPAs/ltltrack') {
      this.onTrackingTabClick(true);
      this.openTrackingTab();
    }

    if (path === '/SPAs/tltrack') {
      this.onTruckloadTrackingTabClick(true);
      this.openTruckloadTrackingTab();
    }

    if (path === '/SPAs/records') {
      this.onReportTabClick();
      this.openReportTab();
      setTimeout(() => {
        this.global.recordStatus.set('recordsSearch');
        $('#v-pills-dlv-report-tab').addClass('active');
      }, 100);
    }

    if (path.includes('/SPAs/carriers')) {
      setTimeout(() => {
        this.onOperationsTabClick();
        this.openOperationsTab();
        $('#v-pills-carriers-tab').addClass('active');
      }, 100);
    }

    if (path.includes('/SPAs/notes')) {
      setTimeout(() => {
        this.onOperationsTabClick();
        this.openOperationsTab();
        $('#v-pills-notes-tab').addClass('active').siblings();
      }, 100);
    }

    if (path === '/SPAs/reports/search') {
      $('#v-pills-reports-tab').addClass('active').siblings();
      $('#reportSearchTab').addClass('active');
    }
  }

  ngOnDestroy(): void {
    this.location$.unsubscribe();
    this.utilityService.resetFilter.next(false);
  }

  onOperationsTabClick() {
    this.closeTrackingTab();
    this.closeReportTab();

    this.clearReportsActiveState();
    this.clearTrackingActiveState();
    this.clearTruckloadTrackingActiveState();
    this.closeTruckloadTrackingTab();
    // only removes active from sidebar
    $('#sidebar a.nav-link').removeClass('active').siblings();
    $('#v-pills-operations-tab').addClass('active');
  }

  clearOperationsActiveState(el: string) {
    // Clear Reports active state
    $('#v-pills-carriers-tab').removeClass('active').siblings();
    $('#v-pills-notes-tab').removeClass('active').siblings();
    $('#' + el).addClass('active').siblings();
  }

  closeOperationsTab() {
    $('#collapseOperations').removeClass('show').siblings();
    // $('#collapseOperations').addClass('collapsing').siblings();
    // $('#collapseOperations').removeClass('collapsing').siblings();
    // $('#collapseOperations').addClass('collapse').siblings();
  }

  openOperationsTab() {
    $('#collapseOperations').addClass('show').siblings();
  }

  collapseSidebar() {
    const collapsed = !Global.isCollapsed();
    Global.isCollapsed.set(collapsed);
    this.isCollapsed = Global.isCollapsed();
  }

  sidebarToolTip() {
    // Allow tool tip on btn collapse
    // $('#btnCollapse').attr({
    //   'data-bs-toggle': 'tooltip',
    //   title: 'Collapse sidebar',
    //   'data-placement': 'right'
    // });

    // Enable Tool Tip On Hover
    $('[data-bs-toggle="tooltip"]').tooltip({
      trigger: 'hover'
    });
  }

  getStatusDropdown() {
    const statuses = JSON.parse(<string>sessionStorage.getItem('statuses'));
    if (statuses || this.global.statusFilterData().length > 0) {
      const statusFilter = this.global.statusFilterData().length > 0 ? this.global.statusFilterData() : statuses;
      this.global.statusFilterData.set(statusFilter);
      return;
    }

    this.reps.getAvailableStatuses().subscribe({
      next: (response: any) => {
        let status: string[] = [];
        response.forEach((value: any) => {
          status.push(value.status);
        });
        this.sortAndFilter(status).forEach((value: any) => {
          this.global.statusFilterData.update(items=> [...items, {item: value, value}]);
        });
      }
    });
  }

  getCarrierDropdown() {
    const carriers = JSON.parse(<string>sessionStorage.getItem('carriers'));
    if (carriers || this.global.carrierFilterData().length > 0) {
      const carrierFilter= this.global.carrierFilterData().length > 0 ? this.global.carrierFilterData() : carriers;
      this.global.carrierFilterData.set(carrierFilter);
      return;
    }

    this.ts.getAdvancedFilterCarrier().subscribe({
      next: (response: any) => {
        const carrierData: any[] = response;
        let carrier: string[] = [];

        carrierData.forEach(value => {
          carrier.push(value.CarrierDropDown);
        });

        this.sortAndFilter(carrier).forEach((value: any) => {
          this.global.carrierFilterData.update(items => [...items, {item: value, value}]);
        });
      }
    });
  }

  getClientDropdown() {
    const clients = JSON.parse(<string>sessionStorage.getItem('clients'));
    if (clients || this.global.clientFilterData().length > 0) {
      const clientsFilter = this.global.clientFilterData().length > 0 ? this.global.clientFilterData() : clients;
      this.global.clientFilterData.set(clientsFilter);
      return;
    }

    this.igs.getClientDropdown().subscribe({
      next: (response) => {
        // REDUCE TO REMOVE DUPLICATE CLIENT CODES
        const client = response.reduce((accumulator: any, current) => {
          if (!accumulator.some((item: any) => item.clientCode === current.clientCode)) {
            accumulator.push(current);
          }
          return accumulator;
        }, []);

        // GROUP CLIENTS WITH PLANTS
        client.forEach((c: any) => {
          this.global.clientFilterData.update(items => [...items, {
            item: c.clientCode + '-' + c.companyName,
            value: c.clientCode + '-' + c.companyName
          }]);
        });
      }
    });
  }

  sortAndFilter(data: any[]) {
    return data.sort().filter((x, i, a) => !i || x != a[i - 1]);
  }

  goToLink(url: string, target = '_blank') {
    if (url === '/SPAs/carriers' && window.location.href.includes('/carriers')) {
      this.router.navigateByUrl(url).then();
    } else {
      window.open(url, target);
    }
  }

  setTLTrackingStatus(status: string) {
    $('a[aria-controls^="v-pills-tracking"].active').removeClass('active');
    $('a[aria-controls="v-pills-tracking-' + status + '"]').addClass('active');
    this.utilityService.updateTruckloadTrackingStatus(status);
    if (this.getLocationPath().includes('/tltrack')) {
    } else {
      this.router.navigateByUrl('SPAs/tltrack').then();
    }
    setTimeout(() => {
      if (this.showTruckQuote) { $('#truckTrackingQuoteTab').addClass('active'); }
      if (this.showTruckPickup) { $('#truckTrackingBookTab').addClass('active'); }
      if (this.showTruckInTransit) { $('#truckTrackingTransitTab').addClass('active'); }
      if (this.showTruckDelivered) { $('#truckTrackingDeliveryTab').addClass('active'); }
      if (this.showTruckPlanning) { $('#truckTrackingPlanningTab').addClass('active'); }
      if (this.showTruckProblem) { $('#truckTrackingProblemTab').addClass('active'); }
    }, 100);
  }

  resetGlobalTrackingTruckload() {
    this.utilityService.updateTrackingTruckloadRequestForQuote(null);
    this.utilityService.updateTrackingTruckloadSubmittedQuotes(null);
    this.utilityService.updateTrackingTruckloadInTransit(null);
    this.utilityService.updateTrackingTruckloadProblem(null);
    this.utilityService.updateTrackingTruckloadFailure(null);
    this.utilityService.updateTrackingTruckloadDispatched(null);
    this.utilityService.updateTrackingTruckloadAll(null);
    this.utilityService.updateTrackingLateQuoteResponses(null);
    this.utilityService.updateTrackingPrebookedNoteLate(null);
    this.utilityService.updateTrackingPrebookedAndLate(null);
    this.utilityService.updateTrackingPickupDateAndTimePassed(null);
    this.utilityService.updateTrackingTruckloadAppointmentRequired(null);
    this.utilityService.updateTrackingMissingTransitUpdateRecord(null);
    this.utilityService.updateTrackingLateDelivery(null);
    this.utilityService.updateTrackingTruckloadPending(null);
    this.utilityService.updateTrackingDeliveredNeedsPOD(null);
    this.utilityService.updateTrackingTruckPrebookRolled(null);
    this.utilityService.updateTrackingTruckAtDelivery(null);
    this.utilityService.updateTrackingTruckAtPickupStop(null);
    this.utilityService.updateTrackingTruckDelivered(null);
  }

  goTo(url: string | null, e: any, href = '') : any {
    if (this.global.shipmentEdited()) {
      return this.PopUp.fire().then((result) => {
        if (result.isConfirmed) {
          this.global.shipmentEdited.set(false);
          if (url === null && href !== '') {
            this.goToLink(href, '_self');
          } else {
            this.clearTabs();
            if (url) this.router.navigateByUrl(url).then();
            $(e.target).addClass('active');
          }
        } else {
          $(e.target).removeClass('active');
        }
      });
    } else {
      if (url === null && href !== '') {
        this.goToLink(href, '_self');
      } else {
        this.clearTabs();
        if (url) this.router.navigateByUrl(url).then();
        $(e.target).addClass('active');
      }
    }
  }

  goToLtlTracking(isLoadingPage = false) {
    if (!this.getLocationPath().includes('/ltltrack') || isLoadingPage) {
      this.getLTLTrackingData(true);
    }
    this.utilityService.updateTrackingStatus('All');
    this.closeReportTab();
    this.clearReportsActiveState();
    this.clearTruckloadTrackingActiveState();
    this.closeTruckloadTrackingTab();
    this.closeOperationsTab();
    this.clearTabActiveState();
    $('#tracking-toggle-btn').addClass('active');
  }

  goToTruckloadTracking(isLoadingPage = false) {
    if (!this.getLocationPath().includes('/tltrack') || isLoadingPage) {
      this.getTLTrackingData(true);
    }
    this.utilityService.updateTruckloadTrackingStatus('truckloadTracking');
    this.closeReportTab();
    this.closeTrackingTab();
    this.clearReportsActiveState();
    this.clearTrackingActiveState();
    this.closeOperationsTab();
    this.clearTabActiveState();
    $('#truckload-tracking-toggle-btn').addClass('active');
  }

  goToRecords() {
    this.global.recordStatus.set('recordsSearch');
    this.router.navigateByUrl('SPAs/records').then(() => {
      this.closeTrackingTab();
      this.clearTrackingActiveState();
      this.clearTruckloadTrackingActiveState();
      this.closeTruckloadTrackingTab();
      this.clearTabActiveState();
      this.clearReportsActiveState();
      this.closeOperationsTab();
      $('#v-pills-dlv-report-tab').addClass('active');
    });
  }

  setLTLTrackingStatus(status: string) {
    $('a[aria-controls^="v-pills-tracking"].active').removeClass('active');
    $('a[aria-controls="v-pills-tracking-' + status + '"]').addClass('active');
    this.utilityService.updateTrackingStatus(status);
    if (this.getLocationPath().includes('/ltltrack')) {
    } else {
      this.router.navigateByUrl('SPAs/ltltrack').then();
    }
    setTimeout(() => {
      if (this.showQuote) {  $('#trackingQuoteTab').addClass('active'); }
      if (this.showPriorityReturn) {  $('#trackingPriorityReturnTab').addClass('active'); }
      if (this.showPickup) { $('#trackingPickupTab').addClass('active'); }
      if (this.showInTransit) { $('#trackingInTransitTab').addClass('active'); }
      if (this.showDelivered) { $('#trackingDeliveredTab').addClass('active'); }
    }, 100);
  }

  resetGlobalLTLTracking() {
    this.utilityService.updateTrackingAll(null);
    this.utilityService.updateTrackingDelivered(null);
    this.utilityService.updateTrackingPending(null);
    this.utilityService.updateTrackingElevated(null);
    this.utilityService.updateTrackingExpedited(null);
    this.utilityService.updateTrackingDeliveryDateException(null);
    this.utilityService.updateTrackingUnableToDeliver(null);
    this.utilityService.updateTrackingPickupMissed(null);
    this.utilityService.updateTrackingDelayed(null);
    this.utilityService.updateTrackingMABD(null);
    this.utilityService.updateTrackingSubmittedQuotes(null);
    this.utilityService.updateTrackingUnabletoTrack(null);
    this.utilityService.updateTrackingAppointmentRequired(null);
    this.utilityService.updateTrackingRequestForQuote(null);
    this.utilityService.updateTrackingPickupElevated(null);
    this.utilityService.updateTrackingPickupExpedited(null);
    this.utilityService.updateTrackingBookedNotLate(null);
    this.utilityService.updateTrackingLatePickups(null);
    this.utilityService.updateTrackingDeliveryToday(null);
    this.utilityService.updateTrackingDeliveryOSD(null);
    this.utilityService.updateTrackingReturns(null);
    this.utilityService.updateTrackingProblem(null);
    this.utilityService.updateTrackingOcean(null);
    this.utilityService.updateTrackingWhiteboard(null);
  }

  onClickTrackingTab(name: string) {
    if (name === 'priorityReturn') { this.showPriorityReturn = !this.showPriorityReturn; }
    if (name === 'quote') { this.showQuote = !this.showQuote; }
    if (name === 'pickup') { this.showPickup = !this.showPickup; }
    if (name === 'intransit') { this.showInTransit = !this.showInTransit; }
    if (name === 'delivered') { this.showDelivered = !this.showDelivered; }
  }

  onClickTruckTrackingTab(name: string) {
    if (name === 'quote') { this.showTruckQuote = !this.showTruckQuote; }
    if (name === 'pickup') { this.showTruckPickup = !this.showTruckPickup; }
    if (name === 'intransit') { this.showTruckInTransit = !this.showTruckInTransit; }
    if (name === 'delivered') { this.showTruckDelivered = !this.showTruckDelivered; }
    if (name === 'planning') { this.showTruckPlanning = !this.showTruckPlanning; }
    if (name === 'problem') { this.showTruckProblem = !this.showTruckProblem; }
  }

  getTLTrackingData(all: boolean = false) {
    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'TruckloadPending' || all) {
      this.global.trackTruckloadPendingRecCount.set(0);
      this.ts.getTLTrackingPending().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackTruckloadPendingRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckloadPending(trackingData);
          } else {
            this.utilityService.updateTrackingTruckloadPending([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckloadPending([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'RequestForQuote' || all) {
      this.global.trackRequestForQuoteRecCount.set(0);
      this.ts.getTLTrackingRequestForQuote().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackRequestForQuoteRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckloadRequestForQuote(trackingData);
          } else {
            this.utilityService.updateTrackingTruckloadRequestForQuote([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckloadRequestForQuote([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'LateQuoteResponses' || all) {
      this.global.trackLateQuoteResponsesRecCount.set(0);
      this.ts.getTLTrackingLateQuote().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackLateQuoteResponsesRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingLateQuoteResponses(trackingData);
          } else {
            this.utilityService.updateTrackingLateQuoteResponses([]);
          }
        }, error: () => { this.utilityService.updateTrackingLateQuoteResponses([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'SubmittedQuotes' || all) {
      this.global.trackSubmittedQuotesRecCount.set(0);
      this.ts.getTLTrackingSubmittedQuote().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackSubmittedQuotesRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckloadSubmittedQuotes(trackingData);
          } else {
            this.utilityService.updateTrackingTruckloadSubmittedQuotes([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckloadSubmittedQuotes([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'PrebookedNoteLate' || all) {
      this.global.trackPrebookedNoteLateRecCount.set(0);
      this.ts.getTLTrackingPrebookedNotLate().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackPrebookedNoteLateRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingPrebookedNoteLate(trackingData);
          } else {
            this.utilityService.updateTrackingPrebookedNoteLate([]);
          }
        }, error: () => { this.utilityService.updateTrackingPrebookedNoteLate([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'PrebookedAndLate' || all) {
      this.global.trackPrebookedAndLateRecCount.set(0);
      this.ts.getTLTrackingBookedNotLate().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackPrebookedAndLateRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingPrebookedAndLate(trackingData);
          } else {
            this.utilityService.updateTrackingPrebookedAndLate([]);
          }
        }, error: () => { this.utilityService.updateTrackingPrebookedAndLate([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'PickupDateAndTimePassed' || all) {
      this.global.trackPickupDateAndTimePassedRecCount.set(0);
      this.ts.getTLTrackingPUMiss().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackPickupDateAndTimePassedRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingPickupDateAndTimePassed(trackingData);
          } else {
            this.utilityService.updateTrackingPickupDateAndTimePassed([]);
          }
        }, error: () => { this.utilityService.updateTrackingPickupDateAndTimePassed([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'TruckloadInTransit' || all) {
      this.global.trackTruckloadInTransitRecCount.set(0);
      this.ts.getTLTrackingInTransit().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackTruckloadInTransitRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckloadInTransit(trackingData);
          } else {
            this.utilityService.updateTrackingTruckloadInTransit([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckloadInTransit([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'TruckloadProblem' || all) {
      this.global.trackTruckloadProblemRecCount.set(0);
      this.ts.getTLTrackingProblem().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackTruckloadProblemRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckloadProblem(trackingData);
          } else {
            this.utilityService.updateTrackingTruckloadProblem([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckloadProblem([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'TruckloadFailure' || all) {
      this.global.trackTruckloadFailureRecCount.set(0);
      this.ts.getTLTrackingFailure().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackTruckloadFailureRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckloadFailure(trackingData);
          } else {
            this.utilityService.updateTrackingTruckloadFailure([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckloadFailure([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'TruckloadDispatched' || all) {
      this.global.trackTruckloadDispatchedRecCount.set(0);
      this.ts.getTLTrackingDispatched().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackTruckloadDispatchedRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckloadDispatched(trackingData);
          } else {
            this.utilityService.updateTrackingTruckloadDispatched([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckloadDispatched([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'TruckloadAll' || all) {
      this.global.trackTruckloadAllRecCount.set(0);
      this.ts.getTLTrackingAll().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackTruckloadAllRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckloadAll(trackingData);
          } else {
            this.utilityService.updateTrackingTruckloadAll([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckloadAll([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'MissingTransitUpdate' || all) {
      this.global.trackMissingTransitUpdateRecCount.set(0);
      this.ts.getTLTrackingMissingTransitUpdate().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackMissingTransitUpdateRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingMissingTransitUpdateRecord(trackingData);
          } else {
            this.utilityService.updateTrackingMissingTransitUpdateRecord([]);
          }
        }, error: () => { this.utilityService.updateTrackingMissingTransitUpdateRecord([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'LateDelivery' || all) {
      this.global.trackLateDeliveryRecCount.set(0);
      this.ts.getTLTrackingLateDelivery().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackLateDeliveryRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingLateDelivery(trackingData);
          } else {
            this.utilityService.updateTrackingLateDelivery([]);
          }
        }, error: () => { this.utilityService.updateTrackingLateDelivery([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'DeliveredNeedsPOD' || all) {
      this.global.trackDeliveredNeedsPODRecCount.set(0);
      this.ts.getTLTrackingDeliveredMissingPOD().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackDeliveredNeedsPODRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingDeliveredNeedsPOD(trackingData);
          } else {
            this.utilityService.updateTrackingDeliveredNeedsPOD([]);
          }
        }, error: () => { this.utilityService.updateTrackingDeliveredNeedsPOD([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'AtDeliveryLocation' || all) {
      this.global.trackTruckAtDeliveryCount.set(0);
      this.ts.getTLTrackingAtDelivery().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackTruckAtDeliveryCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckAtDelivery(trackingData);
          } else {
            this.utilityService.updateTrackingTruckAtDelivery([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckAtDelivery([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'AtPickupStop' || all) {
      this.global.trackTruckAtPickupCount.set(0);
      this.ts.getTLTrackingAtPickup().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackTruckAtPickupCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckAtPickupStop(trackingData);
          } else {
            this.utilityService.updateTrackingTruckAtPickupStop([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckAtPickupStop([]); }
      });
    }

    if (this.utilityService.truckloadTrackingStatus$?.toString() === 'TruckloadDelivered' || all) {
      this.global.trackTruckDeliveredCount.set(0);
      this.ts.getTLTrackingDelivered().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackTruckDeliveredCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking'; // Directly modify a property of the object
            });
            this.utilityService.updateTrackingTruckDelivered(trackingData);
          } else {
            this.utilityService.updateTrackingTruckDelivered([]);
          }
        }, error: () => { this.utilityService.updateTrackingTruckDelivered([]); }
      });
    }
  }

  getLTLTrackingData(all: boolean = false) {
    if (this.utilityService.trackingStatus$?.toString() === 'Pending' || all) {
      this.global.trackPendingRecCount.set(0);
      this.ts.getTrackingPending().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackPendingRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingPending(trackingData);
          } else {
            this.utilityService.updateTrackingPending([]);
          }
        }, error: () => { this.utilityService.updateTrackingPending([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'Elevated' || all) {
      this.global.trackPriorityRecCount.set(0);
      this.ts.getTrackingElevated().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackPriorityRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingElevated(trackingData);
          } else {
            this.utilityService.updateTrackingElevated([]);
          }
        }, error: () => { this.utilityService.updateTrackingElevated([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'Expedited' || all) {
      this.global.trackExpeditedRecCount.set(0);
      this.ts.getTrackingExpedited().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackExpeditedRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingExpedited(trackingData);
          } else {
            this.utilityService.updateTrackingExpedited([]);
          }
        }, error: () => { this.utilityService.updateTrackingExpedited([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'AppointmentRequired' || all) {
      this.global.trackAppointmentRequiredRecCount.set(0);
      this.ts.getTrackingAppointmentRequired().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackAppointmentRequiredRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingAppointmentRequired(trackingData);
          } else {
            this.utilityService.updateTrackingAppointmentRequired([]);
          }
        }, error: () => { this.utilityService.updateTrackingAppointmentRequired([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'DeliveryDateException' || all) {
      this.global.trackDeliveryDateExceptionRecordCount.set(0);
      this.ts.getTrackingDeliveryDateException().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackDeliveryDateExceptionRecordCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingDeliveryDateException(trackingData);
          } else {
            this.utilityService.updateTrackingDeliveryDateException([]);
          }
        }, error: () => { this.utilityService.updateTrackingDeliveryDateException([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'Delayed' || all) {
      this.global.trackDelayRecCount.set(0);
      this.ts.getTrackingDelayed().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackDelayRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingDelayed(trackingData);
          } else {
            this.utilityService.updateTrackingDelayed([]);
          }
        }, error: () => { this.utilityService.updateTrackingDelayed([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'SubmittedQuotes' || all) {
      this.global.trackSubmittedQuoteCount.set(0);
      this.ts.getTrackingSubmittedQuote().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackSubmittedQuoteCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingSubmittedQuotes(trackingData);
          } else {
            this.utilityService.updateTrackingSubmittedQuotes([]);
          }
        }, error: () => { this.utilityService.updateTrackingSubmittedQuotes([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'RequestForQuote' || all) {
      this.global.trackRequestQuoteCount.set(0);
      this.ts.getTrackingRequestForQuote().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackRequestQuoteCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingRequestForQuote(trackingData);
          } else {
            this.utilityService.updateTrackingRequestForQuote([]);
          }
        }, error: () => { this.utilityService.updateTrackingRequestForQuote([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'DeliveryOSD' || all) {
      this.global.trackDeliveryOsdCount.set(0);
      this.ts.getTrackingDeliveryOSD().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackDeliveryOsdCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingDeliveryOSD(trackingData);
          } else {
            this.utilityService.updateTrackingDeliveryOSD([]);
          }
        }, error: () => { this.utilityService.updateTrackingDeliveryOSD([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'DeliveryToday' || all) {
      this.global.trackDeliveryTodayCount.set(0);
      this.ts.getTrackingDeliveryToday().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackDeliveryTodayCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingDeliveryToday(trackingData);
          } else {
            this.utilityService.updateTrackingDeliveryToday([]);
          }
        }, error: () => { this.utilityService.updateTrackingDeliveryToday([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'LatePickup' || all) {
      this.global.trackLatePickupsCount.set(0);
      this.ts.getTrackingLatePickup().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackLatePickupsCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingLatePickups(trackingData);
          } else {
            this.utilityService.updateTrackingLatePickups([]);
          }
        }, error: () => { this.utilityService.updateTrackingLatePickups([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'BookedNotLate' || all) {
      this.global.trackNotLateCount.set(0);
      this.ts.getTrackingBookedNotLate().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackNotLateCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingBookedNotLate(trackingData);
          } else {
            this.utilityService.updateTrackingBookedNotLate([]);
          }
        }, error: () => { this.utilityService.updateTrackingBookedNotLate([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'UnabletoTrack' || all) {
      this.global.noTrackRecordCount.set(0);
      this.ts.getCannotTrack().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.noTrackRecordCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingUnabletoTrack(trackingData);
          } else {
            this.utilityService.updateTrackingUnabletoTrack([]);
          }
        }, error: () => { this.utilityService.updateTrackingUnabletoTrack([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'Returns' || all) {
      this.global.noTrackReturns.set(0);
      this.ts.getTrackingReturns().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.noTrackReturns.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingReturns(trackingData);
          } else {
            this.utilityService.updateTrackingReturns([]);
          }
        }, error: () => { this.utilityService.updateTrackingReturns([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'Whiteboard' || all) {
      this.global.trackWhiteboardCount.set(0);
      this.ts.getTrackingWhiteboard().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackWhiteboardCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingWhiteboard(trackingData);
          } else {
            this.utilityService.updateTrackingWhiteboard([]);
          }
        }, error: () => { this.utilityService.updateTrackingWhiteboard([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'Ocean' || all) {
      this.global.trackOceanCount.set(0);
      this.ts.getTrackingOcean().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackOceanCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingOcean(trackingData);
          } else {
            this.utilityService.updateTrackingOcean([]);
          }
        }, error: () => { this.utilityService.updateTrackingOcean([]); }
      });
    }

    if (this.utilityService.trackingStatus$?.toString() === 'Problem' || all) {
      this.global.trackProblemCount.set(0);
      this.ts.getTrackingProblem().subscribe({
        next: (response: any) => {
          if (response.length > 0) {
            this.global.trackProblemCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.utilityService.updateTrackingProblem(trackingData);
          } else {
            this.utilityService.updateTrackingProblem([]);
          }
        }, error: () => { this.utilityService.updateTrackingProblem([]); }
      });
    }
  }

  removeBackDrop() {
    $('.modal-advance-search').modal('hide');
    $('.modal-backdrop').remove();
    this.utilityService.resetFilter.next(true);
  }
}
