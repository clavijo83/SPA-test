import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {Login} from './views/login/login';
import {ClientService} from './services/client/client.service';
import {ModesService} from './services/modes/modes.service';
import {StatusService} from './services/status/status.service';
import {CarriersService} from './services/carriers/carriers.service';
import {AvailableCarriersService} from './services/available-carriers/available-carriers.service';
import {SideNavContainer} from './components/side-nav-container/side-nav-container';
import {ShipmentsNew} from './views/shipments-new/shipments-new';
import {authGuard} from './guards/auth/auth-guard';
import {authgroupGuard} from './guards/authgroup/authgroup-guard';
import {Reports} from './views/reports/reports';
import {Report} from './views/report/report';
import {SearchReport} from './views/report/search-report/search-report';
import {ShipmentAccessDenied} from './components/shipment-access-denied/shipment-access-denied';
import {NotesList} from './views/operations/active-notes/notes-list/notes-list';
import {ActiveNotesComponent} from './views/operations/active-notes/active-notes';
import {ManageUsers} from './views/manage-users/manage-users';
import {usertypeGuard} from './guards/usertype/usertype-guard';
import {shipmentGuard} from './guards/shipment/shipment-guard';
import {ErrorComponent} from './views/error/error';
import {QuickRate} from './views/quick-rate/quick-rate';
import {CarrierListComponent} from './views/operations/carriers/carrier-list/carrier-list';
import {CarrierManagement} from './views/operations/carriers/carrier-management/carrier-management';
import {Dashboard} from './views/dashboard/dashboard';
import {TrackingDetails} from './components/tracking-details/tracking-details';
import {TruckloadTrackingDetails} from './views/truckload-tracking-details/truckload-tracking-details';
import {Dispatch} from './views/shipments-new/dispatch/dispatch';
import {TruckloadTracking} from './views/tracking/truckload-tracking/truckload-tracking';
import {Tracking} from './views/tracking/tracking/tracking';

const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'SPAs',
    component: SideNavContainer,
    resolve: {
      clients: ClientService,
      modes: ModesService,
      statuses: StatusService,
      carriers: CarriersService,
      availableCarriers: AvailableCarriersService
    },
    canActivate: [authGuard],
    children: [
      {
        path: 'ltltrack',
        component: Tracking,
        canActivate: [authgroupGuard],
        resolve: {
          clients: ClientService,
          modes: ModesService
        }
      },
      {
        path: 'tltrack',
        component: TruckloadTracking,
        canActivate: [authgroupGuard]
      },
      {
        path: 'whiteboard',
        component: Dashboard,
        canActivate: [authgroupGuard]
      },
      {
        path: 'tracking/tracking-details/:shipmentID/:groupID',
        canActivate: [shipmentGuard],
        component: TrackingDetails
      },
      {
        path: 'tracking/truckload-details/:truckID/:groupID',
        canActivate: [shipmentGuard],
        component: TruckloadTrackingDetails,
        resolve: {
          clients: ClientService,
          modes: ModesService
        }
      },
      {
        path: 'new',
        component: ShipmentsNew,
        canActivate: [authgroupGuard],
        resolve: {
          clients: ClientService,
          modes: ModesService
        }
      },
      {
        path: 'new/:shipmentID/:groupID',
        component: ShipmentsNew,
        canActivate: [authgroupGuard, shipmentGuard],
        resolve: {
          clients: ClientService,
          modes: ModesService
        }
      },
      {
        path: 'new/truckload/:truckID/:groupID',
        component: ShipmentsNew,
        canActivate: [authgroupGuard, shipmentGuard],
        resolve: {
          clients: ClientService,
          modes: ModesService
        }
      },
      {
        path: 'pickup/:shipmentID',
        component: Dispatch,
        canActivate: [authgroupGuard]
      },
      {
        path: 'records',
        component: Reports,
        canActivate: [authgroupGuard],
        resolve: {
          clients: ClientService
        },
        children: [{
          path: 'tracking-details/:shipmentID/:groupID',
          component: TrackingDetails,
          canActivate: [shipmentGuard]
        }]
      },
      {
        path: 'rates',
        component: QuickRate,
        canActivate: [authgroupGuard],
        resolve: {
          clients: ClientService
        }
      },
      {
        path: 'records/tracking-details',
        component: ErrorComponent
      },
      {
        path: 'reports',
        component: Report,
        canActivate: [authgroupGuard]
      },
      {
        path: 'reports/search',
        component: SearchReport,
        canActivate: [authgroupGuard],
        resolve: {
          clients: ClientService,
          modes: ModesService
        }
      },
      {
        path: 'carriers',
        component: CarrierListComponent
      },
      {
        path: 'carriers/onboard',
        component: CarrierManagement,
        canActivate: [authgroupGuard]
      },
      {
        path: 'carriers/onboard/:mcNumber',
        component: CarrierManagement,
        canActivate: [authgroupGuard]
      },
      {
        path: 'notes/list',
        component: NotesList,
        canActivate: [authgroupGuard]
      },
      {
        path: 'notes',
        component: ActiveNotesComponent,
        canActivate: [authgroupGuard],
        resolve: {
          clients: ClientService
        }
      },
      {
        path: 'notes/:noteID',
        component: ActiveNotesComponent,
        canActivate: [authgroupGuard],
        resolve: {
          clients: ClientService
        }
      },
      {
        path: 'manage-users',
        component: ManageUsers,
        canActivate: [usertypeGuard],
        resolve: {
          clients: ClientService
        }
      },
      {
        path: 'shipment-access-denied',
        component: ShipmentAccessDenied
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
