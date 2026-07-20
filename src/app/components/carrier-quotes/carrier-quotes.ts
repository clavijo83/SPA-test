import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TruckerToolsService} from "../../services/TruckerTools/trucker-tools.service";
import {TruckSave} from "../../interfaces/truck-save";
import {NgxSpinnerService} from "ngx-spinner";
import Swal from "sweetalert2";
import {TruckerToolsOffer} from "../../interfaces/Trucker-Tools-Offer";
import {Note} from "../../interfaces/note";
import {ReportsService} from "../../services/reports/reports.service";
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-carrier-quotes',
  standalone: false,
  templateUrl: './carrier-quotes.html',
  styleUrl: './carrier-quotes.css',
})
export class CarrierQuotes implements OnInit {
  @Input() truck!: TruckSave | null;
  @Output() editQuoteEvent = new EventEmitter<string>(false);
  @Output() bookItNowEvent = new EventEmitter<boolean>(false);
  public offers: TruckerToolsOffer[] = [];
  public bookingUpdates: any[] = [];
  public carriersCapacity: any[] = [];
  public sortOrder = [1, 'asc'];
  public carrierColumns = [
    {
      title: 'Quote ID',
      data: 'loadOfferId',
      orderable: true
    },
    {
      title: 'Carrier',
      data: 'carrierName',
      orderable: true
    },
    {
      title: 'MC Number',
      data: 'mcNumber',
      orderable: true
    },
    {
      title: 'Contact Name',
      data: 'contactName',
      orderable: true,
      render: function (data: any) {
        return data ? data : '';
      }
    },
    {
      title: 'Phone',
      data: 'contactPhone',
      orderable: true
    },
    {
      title: 'Email',
      data: 'contactEmail',
      orderable: true
    },
    {
      title: 'Amount',
      data: 'amount',
      orderable: true,
      render: function (data: any) {
        return '$' + data
      }
    },
    {
      title: 'Type',
      data: 'offerType',
      orderable: true,
      render: function (data: any) {
        return data ? data.toString().toUpperCase() : '';
      }
    },
    {
      title: '',
      data: 'loadOfferId',
      orderable: false,
      render: (data: any, type: any, row: any) => {
        if (row.rejected) return '<span style="color: red;font-size: 14px;font-weight: 500;">Quote Rejected</span>';
        if (this.truck?.proLoadNumber && this.validateStatusForPosting() && !row.selected){
          return '<button id="btnViewOffer-' + data + '" class="btn btn-sm btn-primary w-100" (click)="myEvent($event)">View Quote</button>';
        }
        if (row.selected) return '<span style="color: green;font-size: 14px;font-weight: 500;">Quote Selected</span>';
        return '';
      }
    }
  ];

  Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })
  private userName: string = '';

  constructor(private tts: TruckerToolsService, private spinner: NgxSpinnerService, private rs: ReportsService,
              private authenticator: AuthenticatorService) {
  }

  ngOnInit(): void {
    this.setUser()
    if (this.truck) {
      this.getCarrierQuotes(this.truck.truckID);
      this.getCarrierCapacity(this.truck.proLoadNumber)
    }
  }

  setUser() {
    this.authenticator.subscribe(() => {
      this.userName = this.authenticator?.user?.username ?? '';
    });
  }

  getCarrierQuotes(truckID: any) {
    this.offers = [];
    this.bookingUpdates = [];

    this.tts.getOffers(truckID).subscribe((response: TruckerToolsOffer[]) => {
      this.offers = response;
    }, () => {
      this.offers = [];
    });

    this.tts.getBookItUpdates(truckID).subscribe((response: any[]) => {
      this.bookingUpdates = response;
    }, () => {
      this.bookingUpdates = [];
    });
  }

  getCarrierCapacity(loadNumber: any) {
    this.carriersCapacity = [];
    this.tts.getCarrierCapacityByLoad(loadNumber).subscribe((response: any[]) => {
      this.carriersCapacity = response;
    }, () => {
      this.carriersCapacity = [];
    });
  }

  onClickRetrieveQuotes() {
    this.offers = [];
    this.spinner.show('carrierQuotes').then()
    this.tts.getOffersByLoadNumber(this.truck?.proLoadNumber?.toString()).subscribe((response: TruckerToolsOffer[]) => {
      this.spinner.hide('carrierQuotes').then()
      this.offers = response;
    }, (error: any) => {
      this.offers = [];
      this.spinner.hide('carrierQuotes').then()
      this.Toast.fire('Get Quotes', error, 'error')
    });
  }

  clickEventHandler(event: any) {
    this.editQuoteEvent.emit(event.offerId)
  }

  validateStatusForPosting(){
    return this.truck?.state == 'FINDING_QUOTES' || this.truck?.state == 'PREBOOKED' || this.truck?.state == 'QUOTE_SENT_TO_CLIENT' || this.truck?.state == 'PENDING';
  }

  confirmBooking(bookId: any) {
    this.postCoveredLoad(this.truck, bookId)
  }

  postCoveredLoad(truck: TruckSave | null, bookID: string) {
    this.spinner.show('carrierQuotes').then();
    if (truck) {
      this.tts.postCoveredLoad(truck, bookID).subscribe({
        next: response => {
          this.spinner.hide('carrierQuotes').then();
          if (response.statusCode == 200) {
            let todayDate: Date = new Date();
            todayDate.setSeconds(0);
            let note: Note = {
              notText: 'Covered Load and confirmed booking in trucker tools.',
              notCognitoUsername: this.userName,
              notTimeStamp: todayDate
            } as Note
            if (this.truck?.shipments){
              const sLen = this.truck?.shipments.length ?? 0
              this.rs.addNote(parseInt(this.truck?.shipments[sLen - 1].shipmentDetail.shipmentID), false, note).subscribe();
            }
            Swal.fire({ icon: 'success', title:'Confirm Booking', html: 'Covered Load and Confirmed booking' }).then(() => {
              this.bookItNowEvent.emit(true)
            })
          } else {
            Swal.fire('Confirm Booking', '<i>' + response.error + '</i>', 'warning').then()
          }
        }, error: e => {
          this.spinner.hide('carrierQuotes').then();
          Swal.fire('Confirm Booking', '<i>' + e + '</i>', 'warning').then()
        }
      });
    }
  }
}
