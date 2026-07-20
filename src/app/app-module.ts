import {NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection} from '@angular/core';
import {CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Amplify} from 'aws-amplify';
import {AmplifyAuthenticatorModule} from '@aws-amplify/ui-angular';
import {AppRoutingModule} from './app-routing-module';
import {App} from './app';
import {Login} from './views/login/login';
import awsmobile from './aws-exports';
import {SideNavContainer} from './components/side-nav-container/side-nav-container';
import {SideNav} from './components/side-nav/side-nav';
import {ShipmentsNew} from './views/shipments-new/shipments-new';
import {JwtInterceptor} from './services/interceptors/JwtInterceptor';
import {ErrorInterceptor} from './services/interceptors/ErrorInterceptor';
import {NgxSpinnerModule} from 'ngx-spinner';
import {UploadService} from './services/upload/upload.service';
import {HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi} from '@angular/common/http';
import {DownloadService} from './services/download/download.service';
import {TrackingService} from './services/tracking/tracking.service';
import {ClientService} from './services/client/client.service';
import {CarriersService} from './services/carriers/carriers.service';
import {AvailableCarriersService} from './services/available-carriers/available-carriers.service';
import {StatusService} from './services/status/status.service';
import {ModesService} from './services/modes/modes.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Reports} from './views/reports/reports';
import {NgbTooltip, NgbTypeahead} from '@ng-bootstrap/ng-bootstrap';
import {NgMultiSelectDropDownModule} from 'ng-multiselect-dropdown';
import {DataTablesModule} from 'angular-datatables';
import {VarDirective} from './common/ng-var.directive';
import {Report} from './views/report/report';
import {SearchReport} from './views/report/search-report/search-report';
import {DataTable} from './components/data-table/data-table';
import {AdvancedSearchModal} from './components/advanced-search-modal/advanced-search-modal';
import {TypeAheadDropDown} from './components/type-ahead-drop-down/type-ahead-drop-down';
import {ShipmentAccessDenied} from './components/shipment-access-denied/shipment-access-denied';
import {ActiveNotesComponent} from './views/operations/active-notes/active-notes';
import {NotesList} from './views/operations/active-notes/notes-list/notes-list';
import {ClientDropdown} from './components/client-dropdown/client-dropdown';
import { ManageUsers } from './views/manage-users/manage-users';
import { ReportsComplete } from './views/reports/reports-complete/reports-complete';
import { ReportsImcomplete } from './views/reports/reports-imcomplete/reports-imcomplete';
import { ReportsPending } from './views/reports/reports-pending/reports-pending';
import { ReportsQuotes } from './views/reports/reports-quotes/reports-quotes';
import { ReportsSearch } from './views/reports/reports-search/reports-search';
import { ErrorComponent } from './views/error/error';
import { ReportGrid } from './components/report-grid/report-grid';
import { TrackingFilterGrid } from './components/tracking-filter-grid/tracking-filter-grid';
import { QuickRate } from './views/quick-rate/quick-rate';
import {LineItemComponent} from './components/line-item/line-item';
import { RatesGrid } from './components/rates-grid/rates-grid';
import { EmailModal } from './components/email-modal/email-modal';
import { CarrierManagement } from './views/operations/carriers/carrier-management/carrier-management';
import { CarrierListComponent } from './views/operations/carriers/carrier-list/carrier-list';
import { Dashboard } from './views/dashboard/dashboard';
import { ShipmentInfoCards } from './components/shipment-info-cards/shipment-info-cards';
import { NoteFormGrid } from './components/note-form-grid/note-form-grid';
import { RateInfo } from './components/rate-info/rate-info';
import { ReferenceFieldComponent } from './components/reference-field/reference-field';
import {TrackingContactsComponent} from './components/tracking-contacts/tracking-contacts';
import { TrackingDetails } from './components/tracking-details/tracking-details';
import { TruckloadTrackingDetails } from './views/truckload-tracking-details/truckload-tracking-details';
import {NgxMaskDirective, NgxMaskPipe, provideNgxMask} from 'ngx-mask';
import {ClipboardModule} from '@angular/cdk/clipboard';
import {CdkDrag, CdkDropList} from '@angular/cdk/drag-drop';
import { AccessorialsComponent} from './components/accessorials/accessorials';
import { ActiveNotesView } from './components/active-notes-view/active-notes-view';
import { FreightTotals } from './components/freight-totals/freight-totals';
import { FreightForm } from './components/freight-form/freight-form';
import { ManualQuotes } from './components/manual-quotes/manual-quotes';
import { Dispatch } from './views/shipments-new/dispatch/dispatch';
import { Calendar } from './components/calendar/calendar';
import { CustomTimePicker } from './components/custom-time-picker/custom-time-picker';
import { CalendarModule} from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { CarrierQuotes } from './components/carrier-quotes/carrier-quotes';
import { TruckInfoCards } from './components/truck-info-cards/truck-info-cards';
import { OfferQuotesModal } from './components/offer-quotes-modal/offer-quotes-modal';
import { NotificationMailsComponent } from './components/notification-mails/notification-mails.component';
import { Document } from './components/document/document';
import { TrackingProgressBar } from './components/tracking-progress-bar/tracking-progress-bar';
import { TruckTrackingProgressBar } from './components/truck-tracking-progress-bar/truck-tracking-progress-bar';
import { All } from './views/tracking/all/all';
import { AllTrucks } from './views/tracking/all-trucks/all-trucks';
import { AppointmentRequired } from './views/tracking/appointment-required/appointment-required';
import { AppointmentRequiredLtl } from './views/tracking/appointment-required-ltl/appointment-required-ltl';
import { Cancelled } from './views/tracking/cancelled/cancelled';
import { Delay } from './views/tracking/delay/delay';
import { Delivered } from './views/tracking/delivered/delivered';
import { DeliveredDeliveryToday } from './views/tracking/delivered-delivery-today/delivered-delivery-today';
import { DeliveredNeedsPod } from './views/tracking/delivered-needs-pod/delivered-needs-pod';
import { DeliveryDateException } from './views/tracking/delivery-date-exception/delivery-date-exception';
import { DeliveryOsd } from './views/tracking/delivery-osd/delivery-osd';
import { Expedited } from './views/tracking/expedited/expedited';
import { Guaranteed } from './views/tracking/guaranteed/guaranteed';
import { LateDelivery } from './views/tracking/late-delivery/late-delivery';
import { LateQuoteResponses } from './views/tracking/late-quote-responses/late-quote-responses';
import { LtlRequestForQuote } from './views/tracking/ltl-request-for-quote/ltl-request-for-quote';
import { MabdAppointment } from './views/tracking/mabd-appointment/mabd-appointment';
import { MissingTransitUpdate } from './views/tracking/missing-transit-update/missing-transit-update';
import { NoTrack } from './views/tracking/no-track/no-track';
import { OceanShipment } from './views/tracking/ocean-shipment/ocean-shipment';
import { Pending } from './views/tracking/pending/pending';
import { PickupDateAndTimePassed } from './views/tracking/pickup-date-and-time-passed/pickup-date-and-time-passed';
import { PickupElevated } from './views/tracking/pickup-elevated/pickup-elevated';
import { PickupExpedited } from './views/tracking/pickup-expedited/pickup-expedited';
import { PickupMissed } from './views/tracking/pickup-missed/pickup-missed';
import { PrebookedAndLate } from './views/tracking/prebooked-and-late/prebooked-and-late';
import { PrebookedNoteLate } from './views/tracking/prebooked-note-late/prebooked-note-late';
import { PrebookedRolled } from './views/tracking/prebooked-rolled/prebooked-rolled';
import { Priority } from './views/tracking/priority/priority';
import { Problem } from './views/tracking/problem/problem';
import { RequestForQuote } from './views/tracking/request-for-quote/request-for-quote';
import { Returns } from './views/tracking/returns/returns';
import { SubmittedQuotes } from './views/tracking/submitted-quotes/submitted-quotes';
import { Tracking } from './views/tracking/tracking/tracking';
import { TruckloadAtDelivery } from './views/tracking/truckload-at-delivery/truckload-at-delivery';
import { TruckloadAtPickup } from './views/tracking/truckload-at-pickup/truckload-at-pickup';
import { TruckloadDelivered } from './views/tracking/truckload-delivered/truckload-delivered';
import { TruckloadDispatched } from './views/tracking/truckload-dispatched/truckload-dispatched';
import { TruckloadFailure } from './views/tracking/truckload-failure/truckload-failure';
import { TruckloadInTransit } from './views/tracking/truckload-in-transit/truckload-in-transit';
import { TruckloadPending } from './views/tracking/truckload-pending/truckload-pending';
import { TruckloadProblem } from './views/tracking/truckload-problem/truckload-problem';
import { TruckloadTracking } from './views/tracking/truckload-tracking/truckload-tracking';
import { UnableToDeliver } from './views/tracking/unable-to-deliver/unable-to-deliver';
import { Whiteboard } from './views/tracking/whiteboard/whiteboard';
import { BookedNotLate } from './views/tracking/booked-not-late/booked-not-late';

Amplify.configure(awsmobile);

@NgModule({
  declarations: [
    App,
    Login,
    SideNavContainer,
    SideNav,
    ShipmentsNew,
    Reports,
    Report,
    SearchReport,
    AdvancedSearchModal,
    TypeAheadDropDown,
    ShipmentAccessDenied,
    ActiveNotesComponent,
    NotesList,
    ClientDropdown,
    DataTable,
    ManageUsers,
    ReportsComplete,
    ReportsImcomplete,
    ReportsPending,
    ReportsQuotes,
    ReportsSearch,
    ErrorComponent,
    ReportGrid,
    TrackingFilterGrid,
    QuickRate,
    LineItemComponent,
    RatesGrid,
    EmailModal,
    CarrierManagement,
    CarrierListComponent,
    Dashboard,
    ShipmentInfoCards,
    NoteFormGrid,
    RateInfo,
    ReferenceFieldComponent,
    TrackingContactsComponent,
    TrackingDetails,
    TruckloadTrackingDetails,
    AccessorialsComponent,
    ActiveNotesView,
    FreightTotals,
    FreightForm,
    ManualQuotes,
    Dispatch,
    Calendar,
    CustomTimePicker,
    CarrierQuotes,
    TruckInfoCards,
    OfferQuotesModal,
    NotificationMailsComponent,
    Document,
    TrackingProgressBar,
    TruckTrackingProgressBar,
    All,
    AllTrucks,
    AppointmentRequired,
    AppointmentRequiredLtl,
    Cancelled,
    Delay,
    Delivered,
    DeliveredDeliveryToday,
    DeliveredNeedsPod,
    DeliveryDateException,
    DeliveryOsd,
    Expedited,
    Guaranteed,
    LateDelivery,
    LateQuoteResponses,
    LtlRequestForQuote,
    MabdAppointment,
    MissingTransitUpdate,
    NoTrack,
    OceanShipment,
    Pending,
    PickupDateAndTimePassed,
    PickupElevated,
    PickupExpedited,
    PickupMissed,
    PrebookedAndLate,
    PrebookedNoteLate,
    PrebookedRolled,
    Priority,
    Problem,
    RequestForQuote,
    Returns,
    SubmittedQuotes,
    Tracking,
    TruckloadAtDelivery,
    TruckloadAtPickup,
    TruckloadDelivered,
    TruckloadDispatched,
    TruckloadFailure,
    TruckloadInTransit,
    TruckloadPending,
    TruckloadProblem,
    TruckloadTracking,
    UnableToDeliver,
    Whiteboard,
    BookedNotLate
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AmplifyAuthenticatorModule,
    FormsModule,
    NgxSpinnerModule.forRoot({
      type: 'ball-scale-multiple', // Set your desired default spinner type here
    }),
    NgbTooltip,
    NgbTypeahead,
    VarDirective,
    NgxMaskPipe,
    NgxMaskDirective,
    DataTablesModule,
    NgMultiSelectDropDownModule,
    ReactiveFormsModule,
    ClipboardModule,
    CdkDropList,
    CdkDrag,
    CalendarModule,
    MultiSelectModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },
    DownloadService,
    UploadService,
    TrackingService,
    ClientService,
    CarriersService,
    AvailableCarriersService,
    StatusService,
    ModesService,
    DatePipe,
    provideNgxMask(),
    provideHttpClient(withFetch(), withInterceptorsFromDi())
  ],
  bootstrap: [App]
})
export class AppModule {
}
