import {Component, Input, OnInit, signal, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxSpinnerService} from 'ngx-spinner';
import {ReportsService} from '../../services/reports/reports.service';
import {DataTable} from '../../components/data-table/data-table';
import {EmailModal} from '../../components/email-modal/email-modal';
import {TruckInfoCards} from '../../components/truck-info-cards/truck-info-cards';
import {formatDate} from '@angular/common';
import {TruckSave} from '../../interfaces/truck-save';
import {TruckSaveService} from '../../services/truck-save/truck-save.service';
import {LineItem} from '../../interfaces/line-item';
import {CarrierProfilingService} from '../../services/carrier-profiling/carrier-profiling.service';
import {TLManualQuote} from '../../interfaces/manual-quote';
import {Global} from '../../common/global';
import {CarrierDetail} from '../../interfaces/carrier-detail';
import {Note} from '../../interfaces/note';
import moment from 'moment';
import {RateType} from '../../interfaces/rate-type';
import {MileageService} from '../../services/mileage/mileage.service';
import {TruckFees} from '../../interfaces/truck-fees';
import {ManualQuotes} from '../../components/manual-quotes/manual-quotes';
import {ShipmentSave} from '../../interfaces/shipment-save';
import {RatesGrid} from '../../components/rates-grid/rates-grid';
import Swal from 'sweetalert2';
import {Constants} from '../../constants/constants';
import {GroupsService} from '../../services/groups/groups.service';
import {Customization} from '../../interfaces/customization';
import {InternalGroupService} from '../../services/internal-group/internal-group.service';
import {Location} from '../../interfaces/location';
import * as momentTimezone from 'moment-timezone';
import {RateService} from '../../services/rate/rate.service';
import {TruckloadRate} from '../../interfaces/truckload-rate';
import {RateGrid} from '../../interfaces/rate-grid';
import {TruckerToolsOffer} from '../../interfaces/Trucker-Tools-Offer';
import {TruckerToolsService} from '../../services/TruckerTools/trucker-tools.service';
import {CarrierQuotes} from '../../components/carrier-quotes/carrier-quotes';
import {ManageUserService} from '../../services/manage-user/manage-user.service';
import {EmailService} from '../../services/email/email.service';
import {environment} from '../../../environments/environment';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-truckload-tracking-details',
  standalone: false,
  templateUrl: './truckload-tracking-details.html',
  styleUrl: './truckload-tracking-details.css',
})
export class TruckloadTrackingDetails implements OnInit {
  @ViewChild(DataTable) dt!: DataTable;
  @ViewChild(TruckInfoCards) tic!: TruckInfoCards;
  @ViewChild(EmailModal) email!: EmailModal;
  @ViewChild(TruckInfoCards) cards!: TruckInfoCards;
  @ViewChild(CarrierQuotes) carrierQuotes!: CarrierQuotes;
  @ViewChild(ManualQuotes) quotes!: ManualQuotes;
  @ViewChild(RatesGrid) rateGrid!: RatesGrid;
  @Input() truckFees: TruckFees[] = [] as TruckFees[];
  currentState = true;
  public showEdit = true;
  public truckID: string | null = null;
  public changesMade = false;
  isInternalUser = false;
  isRequired = false;
  public clientQuoteSelected = false;
  loadTruckDetails = signal(false);
  public truck: TruckSave | null = null;
  public groupID: any;
  public shipmentIDs: any[] = [];
  sortOrder: any;
  global = Global;
  carrierList: CarrierDetail[] = [] as CarrierDetail[];
  carrierMonitoringData: any;
  carrierName = '';
  quoteAssigned = false;
  carrierQuoteAssigned: string | null = null;
  selectedQuoteID: string | null = null;
  expandDetails = false;
  expandRates = false;
  expandCarrier = false;
  expandMap = false;
  carrierCharge = 0;
  customerCharge = 0;
  oldTruckFees: TruckFees[] = [];
  oldTruckload: TruckSave | null = null;
  accessoriesTypes: any = null;
  dollarUS = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  tlQuotes: TLManualQuote[] = [] as TLManualQuote[];
  manualQuotesLoaded = false;
  public rateRequestLineItems: any[] = [];
  totalTargetBuy: any = null;
  totalTargetSell: any = null;
  carrierOnboarded = false;
  carrierOnboardedNotes: any[] = [];
  showCheckInsuranceAmount = false;
  quoteSelected: any = null;
  quotesNotUsed: TLManualQuote[] = [];
  flagTruckNotUsed = false;
  truckNotUsedNote = '';
  loadOfferId: string | null = null;
  newOfferQuote = false;
  offerQuote: TruckerToolsOffer | null = null;
  poMoniker: string | null = null;
  quotesLoaded = false;
  disableControls = false;
  selectedQuoteDeselected = false;
  selectedQuoteRemoved = false;
  originalTruckload: TruckSave | null = null;
  idShipmentsCopied: string[] | null = null;
  originalShipment: ShipmentSave | null = null;
  Toast = Swal.mixin({
    toast: true,
    position: 'center',
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
  private userName = '';
  setQuoteSentToClientState = false;
  enableTrackingEmails = false;
  newCarrierEvent = false;
  truckerToolsActive = false;

  constructor(private gs: GroupsService, private route: ActivatedRoute, private spinner: NgxSpinnerService,
              private ms: MileageService, private router: Router, private rs: ReportsService,
              private tss: TruckSaveService, private cps: CarrierProfilingService, private igs: InternalGroupService,
              private rateService: RateService, private tts: TruckerToolsService, private usrService: ManageUserService,
              private emailService: EmailService, private authenticator: AuthenticatorService) {
    this.truckID = this.route.snapshot.paramMap.get('truckID');
    this.groupID = this.route.snapshot.paramMap.get('groupID');
  }

  get getTruckloadRates(): RateGrid {
    if (this.truck?.shipments && this.truck.shipments.length > 0 && this.truck.shipments[0].targetRates) {
      const rates = this.truck.shipments[0].targetRates;
      return {
        targetRateID: rates.targetRateID,
        rateType: RateType.TARGET_TL,
        creationDate: rates.creationDate,
        fuelSurchargeBuy: rates.fuelSurchargeBuy,
        fuelSurchargeSell: rates.fuelSurchargeSell,
        targetBuy: rates.targetBuy,
        targetSell: rates.targetSell,
        carrierID: null,
        carrierName: null,
        carrierQuote: undefined,
        clientCost: null,
        clientQuote: undefined,
        customCost: null,
        customerQuote: undefined,
        expirationDate: null,
        feesMap: undefined,
        ilCost: null,
        isVolumeRate: false,
        negotiationType: null,
        quoteID: undefined,
        transitTime: undefined,
        warning: undefined,
        id: 0,
        exceedsLinearFoot: false,
        exceedsCubicCapacity: false,
        exceedsMaxWeight: false,
        isTLRate: true,
        processingFee: null,
        carrierCharge: undefined,
        customerCharge: undefined,
        fuelSurchargeAvg: rates.fuelSurchargeAvg,
        ratePerMileAvg: rates.ratePerMileAvg,
        marketAvg: rates.marketAvg,
        marketLow: rates.marketLow,
        marketHigh: rates.marketHigh,
        originName: rates.originName,
        originType: rates.originType,
        destinationName: rates.destinationName,
        destinationType: rates.destinationType,
        timeFrame: rates.timeFrame,
        equipment: rates.equipment,
        serviceProviderType: null,
        mileage: rates.mileage
      };
    }

    return {
      targetRateID: null,
      rateType: RateType.TARGET_TL,
      creationDate: null,
      fuelSurchargeBuy: null,
      fuelSurchargeSell: null,
      targetBuy: null,
      targetSell: null,
      carrierID: null,
      carrierName: null,
      carrierQuote: null,
      clientCost: null,
      clientQuote: undefined,
      customCost: null,
      customerQuote: undefined,
      expirationDate: null,
      feesMap: undefined,
      ilCost: null,
      isVolumeRate: false,
      negotiationType: null,
      quoteID: undefined,
      transitTime: undefined,
      warning: undefined,
      id: 0,
      exceedsLinearFoot: false,
      exceedsCubicCapacity: false,
      exceedsMaxWeight: false,
      isTLRate: true,
      processingFee: null,
      carrierCharge: undefined,
      customerCharge: undefined,
      fuelSurchargeAvg: null,
      ratePerMileAvg: null,
      marketAvg: null,
      marketLow: null,
      marketHigh: null,
      originName: null,
      originType: null,
      destinationName: null,
      destinationType: null,
      timeFrame: null,
      equipment: null,
      serviceProviderType: null,
      mileage: null
    };
  }

  get getNumOfStops() {
    let numOfStops = [];
    if (this.truck?.shipments){
      for (let i = 1; i <= this.truck.shipments.length; i++) {
        numOfStops.push(i);
      }
    }
    return numOfStops;
  }

  ngOnInit(): void {
    this.truckerToolsActive = environment.TRUCKER_TOOLS_API_ACTIVE;
    this.spinner.show('trackingDetails').then();

    this.gs.isValidPermission().then(data => {
      this.isInternalUser = data;
    });

    this.accessoriesTypes = Object.assign({}, ...Constants.ACCESSORIAL_TYPES_DROPDOWN.map((x) => ({[x.value]: x.item})));
    this.setUser();

    this.getGroupCustomizations(this.groupID);
    const fn = () => {
      this.getTruckData();
    };
    const availableCarriers = sessionStorage.getItem('availableCarriers');
    const carrierData = availableCarriers ? JSON.parse(availableCarriers) : null;
    this.setCarriers(carrierData, fn);

    let component = this;
    $('#offerQuotesModal').on('hidden.bs.modal', () => {
      component.loadOfferId = null;
      component.offerQuote = null;
      component.newOfferQuote = false;
    });
  }

  setUser() {
    this.authenticator.subscribe(() => {
      this.userName = this.authenticator?.user?.username ?? '';
    });
  }

  setCarriers(carriersData: CarrierDetail[], fn: any = null) {
    if (carriersData && carriersData.length > 0) {
      this.carrierList = carriersData;
      if (typeof fn === 'function') { fn(); }
    } else {
      this.cps.getAvailableCarriers().subscribe({
        next: response => {
          this.carrierList = response;
        },
        complete: async () => {
          if (typeof fn === 'function') {
            fn();
          }
        }
      });
    }
  }

  changeMade() {
    this.changesMade = true;
    const tlQuotes = this.createManualQuoteMapping();
    this.tic.calculateFinancialReview(tlQuotes);
    this.validateReasonCode();
  }

  getTruckFees(e: any) {
    this.truck!.truckFees = e;
    this.changeMade();
  }

  getTruckNotUsedEvent(event: any) {
    if (event && event != '') {
      this.flagTruckNotUsed = true;
      this.truckNotUsedNote = event;
    } else {
      this.flagTruckNotUsed = false;
      this.truckNotUsedNote = '';
    }
    this.changeMade();
  }

  getAllLineItems() {
    let lineItems: LineItem[] = [];
    if (this.truck?.shipments) {
      for (const shipment of this.truck.shipments) {
        for (const lineItem of shipment.lineItems) {
          lineItems.push(lineItem);
        }
      }
    }
    return lineItems;
  }

  calculateTotal(type: any) {
    const lineItems = this.getAllLineItems();
    let total = 0;

    for (const lineItem of lineItems) {
      switch (type) {
        case 'hu': {
          total += lineItem.handlingUnits ?? 0;
          break;
        }
        case 'pieces': {
          total += lineItem.pieces ?? 0;
          break;
        }
        case 'weight': {
          total += lineItem.unitWeight ?? 0;
          break;
        }
        case 'total weight': {
          total += lineItem.totalWeight;
          break;
        }
      }
    }
    return total;
  }

  saveChanges(): any {
    let tic = this.tic;
    if (!tic.validateLocationUpdate()) { return false; }
    const notes = tic.getNotes();

    notes.forEach((note: any) => {
      tic.notes.addNoteService(note.shipmentId, note.isClientNote, note.isNeedsManagement, note.text);
    });

    if (!tic.disabledTrackingContacts() && !this.validatingTrackingContacts()) { return false; }
    if (!this.validatingMails()) { return false; }
    if (!this.validatingTruckFees()) { return false; }
    if (this.validateQuotesMissingReasonCode()) { return false; }
    if (!this.validateQuotesMissingEquipment()) { return false; }

    if (!this.quotes.checkSelectedQuoteandInsuranceAmount()) {
      $('#checkInsuranceAmount').addClass('is-invalid');
      return false;
    }

    // Convert times to UTC from TZ
    if (this.truck?.shipments) {
      for (let i = 0; i < this.truck.shipments.length; i++) {
        const shipperTZ = this.truck.shipments[i].shipper?.timezone ? this.truck.shipments[i].shipper?.timezone : 'UTC';
        const consigneeTZ = this.truck.shipments[i].consignee?.timezone ? this.truck.shipments[i].consignee?.timezone : 'UTC';

        this.truck.shipments[i].shipmentDetail.pickupAppointmentStart =
          this.isDate(this.truck.shipments[i].shipmentDetail.pickupAppointmentStart) ?
            this.convertDatetimeToUtc(this.truck.shipments[i].shipmentDetail.pickupAppointmentStart, shipperTZ) : null;
        this.truck.shipments[i].shipmentDetail.pickupAppointmentStop =
          this.isDate(this.truck.shipments[i].shipmentDetail.pickupAppointmentStop) ?
            this.convertDatetimeToUtc(this.truck.shipments[i].shipmentDetail.pickupAppointmentStop, shipperTZ) : null;
        this.truck.shipments[i].shipmentDetail.deliveryAppointmentStart =
          this.isDate(this.truck.shipments[i].shipmentDetail.deliveryAppointmentStart) ?
            this.convertDatetimeToUtc(this.truck.shipments[i].shipmentDetail.deliveryAppointmentStart, consigneeTZ) : null;
        this.truck.shipments[i].shipmentDetail.deliveryAppointmentStop =
          this.isDate(this.truck.shipments[i].shipmentDetail.deliveryAppointmentStop) ?
            this.convertDatetimeToUtc(this.truck.shipments[i].shipmentDetail.deliveryAppointmentStop, consigneeTZ) : null;
      }
    }

    const clientQuotes = this.setQuoteSentToClientState ? this.tic.onClickSaveClientQuote()
      : (this.truck?.tlQuotes?.filter((item) => item.clientQuote == true) ?? []);

    const tlQuotesArray = this.truck?.tlQuotes?.filter((item) => item.clientQuote == false) ?? [];
    this.truck!.tlQuotes = [];
    this.truck!.tlQuotes = this.createManualQuoteMapping(true, tlQuotesArray);
    for (const quote of clientQuotes) {
      this.truck?.tlQuotes?.push(quote);
    }
    this.tic.getStopReferenceFields(this.truck);

    if (this.truck?.tlQuotes) {
      for (let tlQuote of this.truck.tlQuotes) {
        if (!tlQuote.carrierName || tlQuote.carrierName === '') { tlQuote.carrierName = this.getCarrierValue(tlQuote.carrierID); }
      }
    }

    for (const statusUpdate of this.cards.updateStatusArray) {
      if (statusUpdate.trackingState !== '' && statusUpdate.trackingDate !== '') {
        this.truck!.lastUpdated = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    if (this.validateMissingTargetRate()) {
      this.generateAndSaveTargetRate();
    } else {
      this.processTruckChanges();
    }
  }

  processTruckChanges() {
    this.gs.isValidPermission().then(data => {
      if (data) {
        this.spinner.show('savingTrackingDetails').then();

        // ADD SHIPMENT TO TRUCK
        if (this.tic.addShipment != null && this.tic.addShipment != 0) {
          const stopOrder = this.truck?.shipments?.length ?? 0;
          const shipmentID = this.tic.addShipment;
          this.tss.addShipmentToTruck(this.truck, shipmentID, stopOrder.toString()).subscribe();
        }

        let shipmentDetails: any;
        // this.truck = this.convertToProcess(this.truck);

        // UPDATE TRUCK: DATES - FEES - QUOTES
        this.tss.updateTruck(this.truck).subscribe({
          next: response => {
            shipmentDetails = response.shipments.length == 1 ? response.shipments[0] : response.shipments[response.shipments.length - 1];

            this.createAccesorialFeeNotes();

            if (this.carrierOnboarded) {
              for (let i = 0; i < this.carrierOnboardedNotes.length; i++) {
                const note: Note = {
                  notText: this.carrierOnboardedNotes[i].note,
                  notCognitoUsername: this.userName,
                  notID: null,
                  notTimeStamp: new Date(),
                  clientNote: false,
                  isNeedsManagement: false
                } as Note;
                const shipId = this.truck?.shipments ? this.truck.shipments[this.truck.shipments.length - 1].shipmentDetail.shipmentID : 0
                this.rs.addNote(Number(shipId), false, note).subscribe();
              }
            }

            if (this.quoteAssigned) {
              let carrierQuoteSelected = '';
              let isQuoteAssigned = false;

              if (this.truck?.tlQuotes) {
                for (let i = 0; i < this.truck.tlQuotes.length; i++) {
                  if (this.truck.tlQuotes[i].assigned) {
                    isQuoteAssigned = true;
                    this.selectedQuoteID = this.truck.tlQuotes[i].carrierID;
                    carrierQuoteSelected = this.truck.tlQuotes[i].carrierName ?? '';
                  }
                }
              }

              if (isQuoteAssigned) {
                // validate if selected quote changed
                if (this.selectedQuoteID && this.carrierQuoteAssigned && this.selectedQuoteID !== this.carrierQuoteAssigned) {
                  const noteText = 'Quote of the carrier \'' + carrierQuoteSelected + '\' has been selected by ' + this.userName;
                  // add note to every shipment
                  if (this.truck?.shipments) {
                    for (let i = 0; i < this.truck.shipments.length; i++) {
                      const note: Note = {
                        notText: noteText,
                        notCognitoUsername: this.userName,
                        notID: null,
                        notTimeStamp: new Date(),
                        clientNote: false,
                        isNeedsManagement: false
                      } as Note;
                      const shipId = this.truck?.shipments ? this.truck.shipments[i].shipmentDetail.shipmentID : 0
                      this.rs.addNote(Number(shipId), false, note).subscribe();

                      // SEND TRACKING EMAIL ON BOOKED STATUS
                      if (this.enableTrackingEmails) {
                        this.buildBookedSendMail(i, carrierQuoteSelected);
                      }
                    }
                  }
                }
              } else {
                if (this.selectedQuoteRemoved || this.selectedQuoteDeselected) {
                  const noteText = 'Quote has been ' + (this.selectedQuoteRemoved ? 'Removed' : 'Deselected') +
                    ' by ' + this.userName + ' on truckload details page.';
                  // add note to every shipment
                  if (this.truck?.shipments) {
                    for (let i = 0; i < this.truck.shipments.length; i++) {
                      const note: Note = {
                        notText: noteText,
                        notCognitoUsername: this.userName,
                        notID: null,
                        notTimeStamp: new Date(),
                        clientNote: false,
                        isNeedsManagement: false
                      } as Note;
                      const shipId = this.truck?.shipments ? this.truck.shipments[i].shipmentDetail.shipmentID : 0
                      this.rs.addNote(Number(shipId), false, note).subscribe();

                      let statusUpdate = {
                        shipmentID: this.truck.shipments[i].shipmentDetail.shipmentID,
                        actualDate: null,
                        trackingDate: new Date().toISOString().slice(0, 16),
                        trackingMessage: '',
                        trackingState: 'Prebooked',
                        currentCity: '',
                        currentState: '',
                        enteredBy: this.userName
                      };

                      let trackDate = new Date(statusUpdate.trackingDate);
                      trackDate.setMinutes(trackDate.getMinutes() - trackDate.getTimezoneOffset());
                      // @ts-ignore
                      statusUpdate.trackingDate = new Date(trackDate.getFullYear(), trackDate.getMonth(),
                        trackDate.getDate(), trackDate.getHours(), trackDate.getMinutes(), trackDate.getSeconds());
                      this.tss.updateTruckTracking(this.truck.truckID, statusUpdate).subscribe();
                    }
                  }
                }
              }
            } else {
              let carrierQuoteSelected = '';
              if (this.truck?.tlQuotes) {
                for (let i = 0; i < this.truck.tlQuotes.length; i++) {
                  if (this.truck.tlQuotes[i].assigned) {
                    this.quoteAssigned = true;
                    this.selectedQuoteID = this.truck.tlQuotes[i].carrierID;
                    carrierQuoteSelected = this.truck.tlQuotes[i].carrierName ?? '';
                  }
                }
              }

              if (this.quoteAssigned) {
                const noteText = 'Quote of the carrier \'' + carrierQuoteSelected + '\' has been selected by '
                  + this.userName;
                // add note to every shipment
                if (this.truck?.shipments) {
                  for (let i = 0; i < this.truck.shipments.length; i++) {
                    const note: Note = {
                      notText: noteText,
                      notCognitoUsername: this.userName,
                      notID: null,
                      notTimeStamp: new Date(),
                      clientNote: false,
                      isNeedsManagement: false
                    } as Note;
                    const shipId = this.truck?.shipments ? this.truck.shipments[i].shipmentDetail.shipmentID : 0
                    this.rs.addNote(Number(shipId), false, note).subscribe();

                    if (!this.flagTruckNotUsed) {
                      let statusUpdate = {
                        shipmentID: (this.truck?.shipments ? this.truck.shipments[i].shipmentDetail.shipmentID : 0),
                        actualDate: null,
                        trackingDate: new Date().toISOString().slice(0, 16),
                        trackingMessage: '',
                        trackingState: 'Booked',
                        currentCity: '',
                        currentState: '',
                        enteredBy: this.userName
                      };
                      let trackDate = new Date(statusUpdate.trackingDate);
                      trackDate.setMinutes(trackDate.getMinutes() - trackDate.getTimezoneOffset());
                      // @ts-ignore
                      statusUpdate.trackingDate = new Date(trackDate.getFullYear(), trackDate.getMonth(),
                        trackDate.getDate(), trackDate.getHours(), trackDate.getMinutes(), trackDate.getSeconds());

                      this.tss.updateTruckTracking(this.truck.truckID, statusUpdate).subscribe({
                        next: () => {
                          // SEND TRACKING EMAIL ON BOOKED STATUS
                          if (this.enableTrackingEmails) {
                            this.buildBookedSendMail(i, carrierQuoteSelected);
                          }
                        }
                      });
                    }
                  }
                }
              }
            }

            if (this.setQuoteSentToClientState) {
              // SET QUOTE_SENT_TO_CLIENT STATUS
              this.setClientQuoteStatus();
            } else {
              // INSERT STATUS HISTORY
              for (let statusUpdate of this.cards.updateStatusArray) {
                if (statusUpdate.trackingState != '' && statusUpdate.trackingDate != '') {
                  statusUpdate.actualDate = statusUpdate.trackingDate;
                  const statusDate = statusUpdate.trackingDate;
                  const trackDate = new Date(statusUpdate.trackingDate);
                  statusUpdate.trackingDate = new Date(trackDate.getFullYear(), trackDate.getMonth(),
                    trackDate.getDate(), trackDate.getHours(), trackDate.getMinutes(), trackDate.getSeconds());
                  statusUpdate.enteredBy = this.userName;

                  this.tss.updateTruckTracking(this.truck?.truckID, statusUpdate).subscribe({
                    next: () => {
                      this.sendStatusNotificationMail(statusUpdate, statusDate);
                    }
                  });
                }
              }
            }

            setTimeout(() => {
              this.spinner.hide('savingTrackingDetails').then();
              if (this.newCarrierEvent) {
                sessionStorage.removeItem('availableCarriers');
              }
              Swal.fire({
                icon: 'success', title: '', html: 'Truckload successfully updated', timer: 2000,
                timerProgressBar: true
              }).then(() => {
                this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
                  this.router.navigate(['SPAs/tracking/truckload-details/' + this.truckID + '/' + this.groupID]);
                });
              });
            }, 1000);

          },
          complete: async () => {

            this.spinner.hide('savingTrackingDetails').then();
            await this.createAuditingNotes(shipmentDetails);

            if (this.flagTruckNotUsed) {
              const note: Note = {
                notText: this.truckNotUsedNote,
                notCognitoUsername: this.userName,
                notID: null,
                notTimeStamp: new Date(),
                clientNote: false,
                isNeedsManagement: false
              } as Note;
              const shipId = this.truck?.shipments ? this.truck.shipments[this.truck.shipments.length - 1].shipmentDetail.shipmentID : 0;
              this.rs.addNote(parseInt(shipId), false, note).subscribe();
            }
          }
        });
      }
    });
  }

  validateStatusForPosting() {
    const truckState = this.truck?.state?.toString() ?? '';
    return truckState === 'FINDING_QUOTES' || truckState === 'PREBOOKED' || truckState === 'QUOTE_SENT_TO_CLIENT' ||
      truckState === 'PENDING';
  }

  validateStatusForProNumber(): boolean {
    return this.truck?.proLoadNumber != null && this.truck?.proLoadNumber !== '';
  }

  convertDatetimeToUtc(date: any, timezone: any) {
    if (timezone != '' && date != '') {
      const dateInPT = momentTimezone.tz(date, 'YYYY-MM-DDTHH:mm', timezone);
      const dateInUTC = dateInPT.utc();
      const dateStringInUTC = dateInUTC.format('YYYY-MM-DDTHH:mm');
      // const dateInPT = moment.tz(date, 'YYYY-MM-DDTHH:mm', timezone);
      // const dateInUTC = moment.utc(dateInPT);
      // const tzOffset = moment(new Date()).utcOffset();
      // const dateStringInUTC = dateInUTC.utcOffset(tzOffset).format('YYYY-MM-DDTHH:mm');
      if (dateStringInUTC != 'Invalid date') {
        return formatDate(dateStringInUTC, 'yyyy-MM-ddTHH:mm', 'en-US');
      }
      return '';
    } else {
      return date;
    }
  }

  getTruckData() {
    this.tss.getTruck(this.truckID ?? '').subscribe({
      next: (response: any) => {
        this.originalTruckload = JSON.parse(JSON.stringify(response));
        this.truck = this.dateTzConverter(response);
        this.oldTruckload = JSON.parse(JSON.stringify(this.truck));

        if (this.truck?.tlQuotes) {
          for (let i = 0; i < this.truck.tlQuotes.length; i++) {
            if (this.truck.tlQuotes[i].quoteID && this.truck.tlQuotes[i].assigned && !this.truck.tlQuotes[i].truckNotUsed) {
              this.quoteSelected = this.truck.tlQuotes[i];
            }

            if (this.truck.tlQuotes[i].quoteID && this.truck.tlQuotes[i].truckNotUsed) {
              this.quotesNotUsed.push(this.truck.tlQuotes[i]);
            }

            if (this.truck.tlQuotes[i]) {
              if (this.truck.tlQuotes[i].assigned && this.truck.tlQuotes[i].carrierID !== '1') {
                this.quoteAssigned = true;
              }
              if (this.truck.tlQuotes[i].assigned && this.truck.tlQuotes[i].carrierID !== '1') {
                this.carrierQuoteAssigned = this.truck.tlQuotes[i].carrierID;
              }
              if (this.truck.tlQuotes[i].carrierID === '1') {
                this.clientQuoteSelected = true;
              }
            }
          }
        }

        this.truck?.shipments?.forEach((s) => {
          this.shipmentIDs.push(s?.shipmentDetail?.shipmentID);
          const date = s.shipmentDetail.enteredShipDate;
          s.shipmentDetail.enteredShipDate = date && date !== '' ? moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD') : date;
        });

        this.truckFees = this.truck?.truckFees ?? [];
        this.totalBreakDownCharges(this.truckFees);
        this.editSetManualTruckFees(this.truck?.truckFees ?? []);
        this.totalTargetBuy = this.truck?.shipments && this.truck.shipments[this.truck.shipments.length - 1].targetRates ?
          parseFloat(this.truck.shipments[this.truck.shipments.length - 1].targetRates?.targetBuy ?? '0') : 0;
        this.totalTargetSell = this.truck?.shipments && this.truck.shipments[this.truck.shipments.length - 1].targetRates ?
          parseFloat(this.truck.shipments[this.truck.shipments.length - 1].targetRates?.targetSell ?? '0') : 0;
        this.setMileage();
        if (this.truck?.mapUrl) {
          // document.getElementById('mapiframe').src = this.truck?.mapUrl;
          $("#mapiframe").attr("src", this.truck.mapUrl);
        }
      },
      error: (error: any) => {
        this.spinner.hide('trackingDetails');
        this.loadTruckDetails.set(true);
        Swal.fire('Truckload Shipment', (error.toString().toLowerCase().includes('shipment not found') ?
          'Truck does not have shipments or stops.' : error), 'warning').then(() => {
        });
      },
      complete: async () => {
        this.loadTruckDetails.set(true);
        this.spinner.hide('trackingDetails').then();
        this.editSetManualQuotes(this.truck?.tlQuotes?.filter((x) => x.clientQuote == false) ?? []);
        this.getLineItems();
        // this.disableControls = this.disableForPrebill();
        setTimeout(() => {
          if (!this.quotesLoaded) {
            this.spinner.show('trackingDetails').then();
          }
        }, 100);
      }
    });
  }

  totalBreakDownCharges(truckFees: any) {
    let totalCarrierCharge = 0;
    let totalCustomerCharge = 0;
    if (truckFees.length > 0) {
      truckFees.forEach((item: any) => {
        totalCarrierCharge = totalCarrierCharge + parseFloat(item.amount);
        totalCustomerCharge = totalCustomerCharge + parseFloat(item.sellAmount);
      });
    }
    this.carrierCharge = totalCarrierCharge;
    this.customerCharge = totalCustomerCharge;
  }

  statusEmailBody() {
    return '\n' + '______________________________________________________________________________________________' +
      '_______________________________' + '\n' +
      'Truck ID: ' + (this.truck?.truckID != null ? this.truck.truckID : '') + '\n' +
      'BOL#s:' + this.getListBOLNumbers() + '\n' +
      'Ship Date: ' + (this.truck?.shipDate ? formatDate(this.truck.shipDate, 'MM/dd/yyyy', 'en', '') : '') + '\n' +
      'Origin: ' + (this.truck?.shipments && this.truck.shipments[0].shipper?.city && this.truck.shipments[0].shipper?.state ?
        this.truck.shipments[0].shipper?.city.toUpperCase() + ', ' + this.truck.shipments[0].shipper?.state + ' ' : '') + '\n' +
      'Destination: ' + (this.truck?.shipments && this.truck.shipments[this.truck.shipments.length - 1].consignee?.city &&
      this.truck.shipments[this.truck.shipments.length - 1].consignee?.state ?
        this.truck.shipments[this.truck.shipments.length - 1].consignee?.city.toUpperCase() + ', ' +
        this.truck.shipments[this.truck.shipments.length - 1].consignee?.state.toUpperCase() + ' ' : '') + '\n\n' +
      'If you have additional questions or requests please contact your Logistics Planner directly at truckload@il2000.com' +
      '\n' + 'or 1-877-373-4525.';
  }

  getListBOLNumbers() {
    let BOLs = [];
    if (this.truck?.shipments) {
      for (const shipment of this.truck.shipments) {
        BOLs.push(' ' + shipment.shipmentDetail.bolNumber);
      }
    }
    return BOLs;
  }

  isCarrierOnboarded(id: any) {
    let val = false;
    for (const carrier of this.carrierList) {
      if (carrier.carrierID?.toString() === id.toString()) {
        val = Boolean(carrier.onboarded);
        break;
      }
    }
    return val;
  }

  getCarrierValue(id: any, field: string = '') {
    let val: any;
    for (const carrier of this.carrierList) {
      if (carrier.carrierID?.toString() === id.toString() ) {
        val = field === 'MC' ? carrier.mcNumber : carrier.carrierName;
        break;
      }
    }
    return val;
  }

  fillRatesTable() {
    if (this.truck?.shipments && this.truck.shipments?.length > 0) {
      if (this.truck.shipments[this.truck.shipments.length - 1].targetRates) {
        const targetBuy = this.totalTargetBuy;
        const targetSell = this.totalTargetSell;

        setTimeout(() => {
          const rates = this.truck?.shipments ? this.truck.shipments[this.truck.shipments.length - 1].targetRates : null;
          const carrierCharge = targetBuy - Number(rates?.fuelSurchargeBuy);
          const customerCharge = (targetSell - Number(rates?.fuelSurchargeSell));
          const mileage = rates?.mileage ? rates.mileage : (this.truck?.mileage ?? 0);
          const marketLow = rates?.marketLow ? this.dollarUS.format(parseFloat(rates.marketLow)) : '-';
          const marketHigh = rates?.marketHigh ? this.dollarUS.format(parseFloat(rates.marketHigh)) : '-';
          const fdate = rates?.creationDate ? rates.creationDate.split('-')[1] + '/' + rates.creationDate.split('-')[2] + '/' + rates.creationDate.split('-')[0] : '';
          const marketAvg = rates?.marketAvg ? this.dollarUS.format(parseFloat(rates?.marketAvg)) : '-';

          const newHtmlContent = '<tr class="odd">' +
            '<td class=" text-center primary-blue"><span class="text-center">' + fdate + '</span></td>' +
            '<td class=" text-center primary-blue"><span class="text-center">' + parseFloat(mileage.toString()) + '</span></td>' +
            '<td class=" text-center primary-blue"><span class="text-center">' + marketLow + '</span></td>' +
            '<td class=" text-center primary-blue"><span class="text-center">' + marketAvg + '</span></td>' +
            '</tr>';
          $('#truckloadRatesDataTable tbody').append(newHtmlContent);
          $('#truckloadRatesDataTable tbody tr:first-child').remove();

          const newHtmlContent1 = '<tr class="odd">' +
            '<td class=" text-center red"><span class="text-center">' + marketHigh + '</span></td>' +
            '<td class=" text-center red"><span class="text-center">' +
            this.dollarUS.format(parseFloat(targetBuy)) + '</span></td>' +
            '<td class=" text-center primary-blue"><span class="text-center">' +
            this.dollarUS.format(parseFloat(targetSell)) + '</span></td>' +
            '<td class=" text-center red"><span class="text-center">' +
            this.dollarUS.format(parseFloat(rates?.fuelSurchargeBuy ?? '0')) + '</span></td>' +
            '<td class=" text-center primary-blue"><span class="text-center">' +
            this.dollarUS.format(parseFloat(rates?.fuelSurchargeSell ?? '0')) + '</span></td>' +
            '<td class=" text-center red"><span class="text-center">' +
            this.dollarUS.format(parseFloat(carrierCharge.toString())) + '</span></td>' +
            '<td class=" text-center primary-blue"><span class="text-center">' +
            this.dollarUS.format(parseFloat(customerCharge.toString())) + '</span></td>' +
            '</tr>';
          $('#truckloadRatesMoreDataTable tbody').append(newHtmlContent1);
          $('#truckloadRatesMoreDataTable tbody tr:first-child').remove();
        }, 1000);
      }
    }
  }

  setMileage() {
    this.truck!.mileage = 0;
    const shipperZip = this.truck?.shipments ? this.truck.shipments[0].shipper?.zip : '';
    const consigneeZip = this.truck?.shipments ? this.truck.shipments[this.truck.shipments.length - 1].consignee?.zip : '';
    this.ms.getMileage(shipperZip ?? '', consigneeZip ?? '', 'Truckload').subscribe({
      next: response => {
        this.truck!.mileage = response.mileage;
        this.fillRatesTable();
        if (this.rateGrid) {
          this.rateGrid.mileage = response.mileage;
        }
      },
      error: ()=> {
        this.fillRatesTable();
      }
    });
  }

  onSelectCarrier() {
    this.tic.disableStatus = false;
    const tlQuote = this.quotes.quotes;
    let quoteAssigned = null;
    for (const i in tlQuote.value) {
      if (tlQuote.value[i].quoteID && tlQuote.value[i].assigned && !tlQuote.value[i].truckNotUsed) {
        quoteAssigned = tlQuote.value[i];
      }
    }
    this.quoteSelected = quoteAssigned;

    // validate if selected quote has carrier onboarded, if onboarded then able to change status
    for (const i in tlQuote.value) {
      if (tlQuote.value[i].carrierID && tlQuote.value[i].carrierID.toString() !== '1' && tlQuote.value[i].assigned) {
        this.tic.disableStatus = !this.isCarrierOnboarded(tlQuote.value[i].carrierID);
        if (!this.tic.disableStatus) { return; }
      }
    }

    // validate if quotes has carrier onboarded, if onboarded then able to change status
    for (const i in tlQuote.value) {
      if (tlQuote.value[i].carrierID && tlQuote.value[i].carrierID.toString() !== '1') {
        this.tic.disableStatus = !this.isCarrierOnboarded(tlQuote.value[i].carrierID);
        if (this.tic.disableStatus) {
          $('#trackingStatus').val('');
          break;
        }
      }
    }
  }

  createManualQuoteMapping(saveQuotes = false, carrierQuotes: TLManualQuote[] | null = null): any {
    let tlQuotesArray = [] as TLManualQuote[];
    const tlQuote = this.quotes.quotes;
    for (const i in tlQuote.value) {
      if ((tlQuote.value[i].carrierID && tlQuote.value[i].carrierID !== '') || tlQuote.value[i].clientCost ||
        tlQuote.value[i].carrierCost) {
        let quoteNote = tlQuote.value[i].notes;
        if (tlQuote.value[i].currencyID !== tlQuote.value[i].defaultCurrencyID) {
          quoteNote = quoteNote + (quoteNote !== '' ? '. ' : '') + 'User ' + this.userName +
            ' has enabled currency override ' + (tlQuote.value[i].currencyID == 2 ? '(CAD).' : '(USD).');
        }
        tlQuotesArray.push(
          {
            quoteID: tlQuote.value[i].quoteID,
            carrierName: tlQuote.value[i].carrierName,
            carrierID: tlQuote.value[i].carrierID ? tlQuote.value[i].carrierID : '',
            clientCost: tlQuote.value[i].clientCost,
            carrierCost: tlQuote.value[i].carrierCost,
            quoteNumber: tlQuote.value[i].quoteNumber,
            transitTime: tlQuote.value[i].transitTime,
            notes: quoteNote,
            assigned: tlQuote.value[i].assigned,
            truckNotUsed: tlQuote.value[i].truckNotUsed,
            equipment: tlQuote.value[i].equipment,
            reasonCode: tlQuote.value[i].reasonCode,
            lostReasonNotes: tlQuote.value[i].lostReasonNotes,
            currencyID: tlQuote.value[i].currencyID,
            exchangeRate: tlQuote.value[i].exchangeRate,
            rateDate: tlQuote.value[i].rateDate,
            exchangeInfo: tlQuote.value[i].exchangeInfo,
            clientQuote: tlQuote.value[i].clientQuote
          }
        );
      }
    }

    if (saveQuotes) {
      for (const item of tlQuotesArray) {
        if (item.quoteID == null || item.quoteID === '') {
          carrierQuotes?.push(item);
        } else {
          if (carrierQuotes) {
            for (let j = 0; j < carrierQuotes.length; j++) {
              if (carrierQuotes[j].quoteID === item.quoteID) { carrierQuotes[j] = item; }
            }
          }
        }
      }

      this.quotes.quotesRemoved.forEach((f: any) => {
        const index = carrierQuotes?.findIndex(q => q.quoteID == f) ?? -1;
        if (index > -1) { carrierQuotes?.splice(index, 1); }
      });

      return carrierQuotes;
    }

    return tlQuotesArray;
  }

  editSetManualQuotes(quotes: TLManualQuote[] = []) {
    this.manualQuotesLoaded = true;
    for (const quote of quotes as TLManualQuote[]) {
      let selectedValue = null;
      let mcnumber = '';
      if (quote.carrierID === '1') {
        selectedValue = [{
          item: quote.carrierName,
          value: quote.carrierID.toString()
        }];
      } else {
        if (quote.carrierID && quote.carrierID !== '' && quote.carrierID !== '0') {
          const value = this.carrierList.find(i => i.carrierID?.toString() === quote.carrierID?.toString());
          if (value) {
            mcnumber = value.mcNumber ?? '';
            const mcNumber = value.mcNumber ? 'MC: #' + value.mcNumber + '. ' : '';
            const dotNumber = value.dotNumber ? 'DOT: #' + value.dotNumber : '';
            const descNumbers = mcNumber + dotNumber;
            selectedValue = [{
              item: value.carrierName + (descNumbers !== '' ? ' (' + descNumbers + ')' : ''),
              value: value.carrierID?.toString() ?? ''
            }];
          }
        }
      }

      this.tlQuotes.push({
        quoteID: quote.quoteID,
        carrierName: quote.carrierName,
        carrierID: quote.carrierID,
        clientCost: quote.clientCost,
        carrierCost: quote.carrierCost,
        quoteNumber: quote.quoteNumber,
        transitTime: quote.transitTime,
        notes: quote.notes,
        assigned: quote.assigned,
        truckNotUsed: quote.truckNotUsed,
        equipment: quote.equipment,
        reasonCode: quote.reasonCode,
        lostReasonNotes: quote.lostReasonNotes,
        currencyID: quote.currencyID,
        exchangeRate: quote.exchangeRate,
        rateDate: quote.rateDate,
        exchangeInfo: quote.exchangeInfo,
        clientQuote: quote.clientQuote,
        mcNumber: mcnumber,
        selected: selectedValue
      });
    }
  }

  editSetManualTruckFees(truckFees: TruckFees[]) {
    for (const truckFee of truckFees) {
      this.oldTruckFees.push({
        truckFeesId: truckFee.truckFeesId,
        truckId: truckFee.truckId,
        accessorialTypeId: truckFee.accessorialTypeId,
        amount: truckFee.amount,
        sellAmount: truckFee.sellAmount,
        carrierCharge: truckFee.carrierCharge,
        customerCharge: truckFee.customerCharge,
        truckQuoteId: truckFee.truckQuoteId,
        carrierId: truckFee.carrierId,
        feeIncurredAt: truckFee.feeIncurredAt,
        feeStartTime: truckFee.feeStartTime,
        feeEndTime: truckFee.feeEndTime,
        stopNum: truckFee.stopNum
      });
    }
  }

  getLineItems() {
    this.rateRequestLineItems.length = 0;
    let rateRequestLineItems = [];
    if (this.truck?.shipments) {
      for (const shipment of this.truck.shipments as ShipmentSave[]) {
        for (const items of shipment.lineItems as LineItem[]) {
          rateRequestLineItems.push(items);
        }
      }
    }
    this.rateRequestLineItems = rateRequestLineItems;
    if (this.rateGrid) {
      this.rateGrid.lineItems = this.rateRequestLineItems;
    } else {
      setTimeout(() => {
        if (this.rateGrid) this.rateGrid.lineItems = this.rateRequestLineItems
      }, 3000);
    }
  }

  onBtnEditShipmentClick() {
    this.spinner.show('savingTrackingDetails').then();
    this.router.navigate(['SPAs/new/truckload/' + this.truckID + '/' + this.groupID]).then(() => {
      this.spinner.hide('savingTrackingDetails').then();
    });
  }

  createCarrierOnboardedNote(event: any) {
    this.carrierOnboarded = true;
    const filtered = this.carrierOnboardedNotes.filter((val) => {
      return val.index != event.index;
    });
    this.carrierOnboardedNotes.length = 0;
    this.carrierOnboardedNotes = filtered;
    this.carrierOnboardedNotes.push(event);
  }

  removeOnboardNote(event: any) {
    const filtered = this.carrierOnboardedNotes.filter((val) => {
      return val.index != event;
    });
    this.carrierOnboardedNotes.length = 0;
    this.carrierOnboardedNotes = filtered;
    this.carrierOnboarded = this.carrierOnboardedNotes.length > 0;
  }

  async createAuditingNotes(shipmentDetails: any) {
    let notesText = [];

    const options: any = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };

    this.truck = this.dateTzConverter(this.truck);

    // log any changes for TL Quotes
    let lineText: string[] = [];
    let quoteFound = false;
    for (let i = 0; i < this.tlQuotes.length; i++) {
      quoteFound = false;
      lineText.length = 0;
      for (let j = 0; j < (this.truck?.tlQuotes?.length ?? 0); j++) {
        if (this.truck?.tlQuotes && this.tlQuotes[i].quoteID == this.truck.tlQuotes[j].quoteID) {
          quoteFound = true;
          const quoteCarrierName = this.truck?.tlQuotes[j].carrierName ? this.truck.tlQuotes[j].carrierName : '';
          // Note: no need to validate the MC number just validate the carrier Name
          if (this.tlQuotes[i].carrierName !== this.truck?.tlQuotes[j].carrierName && (this.tlQuotes[i].carrierName && this.tlQuotes[i].carrierName != '' && this.truck.tlQuotes[j].carrierName && this.truck.tlQuotes[j].carrierName != '')) {
            lineText.push('Carrier Name updated from (' + (this.tlQuotes[i].carrierName ? this.tlQuotes[i].carrierName : ' ') + ') to (' + (this.truck?.tlQuotes[j].carrierName ? this.truck.tlQuotes[j].carrierName : ' ') + ').');
          }
          if (this.tlQuotes[i].carrierCost !== this.truck?.tlQuotes[j].carrierCost) {
            lineText.push('Carrier Cost updated from (' + (this.tlQuotes[i].carrierCost ? this.tlQuotes[i].carrierCost + ' ' + (this.tlQuotes[i].currencyID == 2 ? 'CAD' : 'USD') : ' ') + ') to (' + (this.truck?.tlQuotes[j].carrierCost ? this.truck.tlQuotes[j].carrierCost + ' ' + (this.truck?.tlQuotes[j].currencyID == 2 ? 'CAD' : 'USD') : ' ') + ').');
          }
          if (this.tlQuotes[i].clientCost !== this.truck?.tlQuotes[j].clientCost) {
            lineText.push('Client Cost updated from (' + (this.tlQuotes[i].clientCost ? this.tlQuotes[i].clientCost + ' ' + (this.truck?.shipments?.[0]?.carrierDetail?.carcutAbbreviation ?? '' ): ' ') + ') to (' + (this.truck?.tlQuotes[j].clientCost ? this.truck.tlQuotes[j].clientCost + ' ' + (this.truck?.shipments?.[0]?.carrierDetail?.carcutAbbreviation ?? '') : ' ') + ').');
          }
          if (this.tlQuotes[i].notes !== this.truck?.tlQuotes[j].notes) {
            lineText.push('Note updated from (' + (this.tlQuotes[i].notes ? this.tlQuotes[i].notes : ' ') + ') to (' + (this.truck?.tlQuotes[j].notes ? this.truck.tlQuotes[j].notes : ' ') + ').');
          }
          if (this.tlQuotes[i].quoteNumber !== this.truck?.tlQuotes[j].quoteNumber) {
            lineText.push('Quote Number updated from (' + (this.tlQuotes[i].quoteNumber ? this.tlQuotes[i].quoteNumber : ' ') + ') to (' + (this.truck?.tlQuotes[j].quoteNumber ? this.truck.tlQuotes[j].quoteNumber : ' ') + ').');
          }
          if (this.tlQuotes[i].transitTime !== this.truck?.tlQuotes[j].transitTime) {
            lineText.push('Transit time updated from (' + (this.tlQuotes[i].transitTime ? this.tlQuotes[i].transitTime : ' ') + ') to (' + (this.truck?.tlQuotes[j].transitTime ? this.truck.tlQuotes[j].transitTime : ' ') + ').');
          }
          if (this.tlQuotes[i].equipment !== this.truck?.tlQuotes[j].equipment) {
            lineText.push('Equipment updated from (' + (this.tlQuotes[i].equipment ? this.tlQuotes[i].equipment : ' ') + ') to (' + (this.truck?.tlQuotes[j].equipment ? this.truck.tlQuotes[j].equipment : ' ') + ').');
          }
          if (this.tlQuotes[i].reasonCode !== this.truck?.tlQuotes[j].reasonCode) {
            lineText.push('Reason code updated from (' + (this.tlQuotes[i].reasonCode ? this.tlQuotes[i].reasonCode : ' ') + ') to (' + (this.truck?.tlQuotes[j].reasonCode ? this.truck.tlQuotes[j].reasonCode : ' ') + ').');
          }
          if (this.tlQuotes[i].currencyID !== this.truck?.tlQuotes[j].currencyID) {
            const currencyFromName = Constants.CURRENCY_DROPDOWN.find(x => x.value == this.tlQuotes[i].currencyID)?.item;
            const currencyToName = Constants.CURRENCY_DROPDOWN.find(x => x.value == this.truck?.tlQuotes?.[j].currencyID)?.item;
            lineText.push('Currency updated from (' + (this.tlQuotes[i].currencyID ? currencyFromName : ' ') + ') to (' + (this.truck?.tlQuotes[j].currencyID ? currencyToName : ' ') + ').');
          }
          if (this.truck?.tlQuotes[j].exchangeRate && this.truck?.tlQuotes[j].exchangeRate != 1 && this.truck.tlQuotes[j].exchangeRate != this.tlQuotes[i].exchangeRate) {
            lineText.push('Exchange rate: ' + (this.truck?.tlQuotes[j].exchangeRate ? this.truck.tlQuotes[j].exchangeRate : ' ') + '.');
          }
          if (lineText.length > 0) { notesText.push('Quote updated, Quote ID: ' + this.tlQuotes[i].quoteID + ', Carrier: ' + quoteCarrierName + '. \r\n' + lineText.join('\r\n')); }
        }
      }
      if (!quoteFound) {
        notesText.push('Quote Removed, ' + (this.tlQuotes[i].carrierName ? ('Carrier: ' + this.tlQuotes[i].carrierName + '.') : '') + ' Quote ID: ' + this.tlQuotes[i].quoteID + '.');
      }
    }

    // log any Accessories changes
    let AccessoryFound = false;
    const accessoriesTypesList = Constants.ACCESSORIAL_TYPES_DROPDOWN;
    for (let i = 0; i < this.oldTruckFees.length; i++) {
      AccessoryFound = false;
      lineText.length = 0;
      for (let j = 0; j < (this.truck?.truckFees?.length ?? 0); j++) {
        if (this.oldTruckFees[i].truckFeesId == this.truck?.truckFees[j].truckFeesId) {
          AccessoryFound = true;
          const accessoriesFromName = accessoriesTypesList.find(x => x.value == this.oldTruckFees[i].accessorialTypeId?.toString());
          const accessoriesToName = accessoriesTypesList.find(x => x.value == this.truck?.truckFees[j].accessorialTypeId?.toString());

          if (this.oldTruckFees[i].truckQuoteId !== this.truck?.truckFees[j].truckQuoteId) {
            lineText.push('Quote ID updated from (' + (this.oldTruckFees[i].truckQuoteId ? this.oldTruckFees[i].truckQuoteId : ' ') + ') to (' + (this.truck?.truckFees[j].truckQuoteId ? this.truck.truckFees[j].truckQuoteId : ' ') + ').');
          }

          if (this.oldTruckFees[i].amount !== this.truck?.truckFees[j].amount) {
            lineText.push('Buy amount updated from (' + (this.oldTruckFees[i].amount ? this.oldTruckFees[i].amount : ' ') + ') to (' + (this.truck?.truckFees[j].amount ? this.truck.truckFees[j].amount : ' ') + ').');
          }

          if (this.oldTruckFees[i].sellAmount !== this.truck?.truckFees[j].sellAmount) {
            lineText.push('Sell amount updated from (' + (this.oldTruckFees[i].sellAmount ? this.oldTruckFees[i].sellAmount : ' ') + ') to (' + (this.truck?.truckFees[j].sellAmount ? this.truck.truckFees[j].sellAmount : ' ') + ').');
          }

          if (this.oldTruckFees[i].accessorialTypeId !== this.truck?.truckFees[j].accessorialTypeId) {
            lineText.push('Type updated from (' + (this.oldTruckFees[i].accessorialTypeId ? (accessoriesFromName?.item ?? '') : ' ') + ') to (' + (this.truck?.truckFees[j].accessorialTypeId ? (accessoriesToName?.item ?? '') : ' ') + ').');
          }

          if (this.oldTruckFees[i].feeIncurredAt !== this.truck?.truckFees[j].feeIncurredAt) {
            lineText.push('Occurred At updated from (' + (this.oldTruckFees[i].feeIncurredAt ? this.oldTruckFees[i].feeIncurredAt : ' ') + ') to (' + (this.truck?.truckFees[j].feeIncurredAt ? this.truck.truckFees[j].feeIncurredAt : ' ') + ').');
          }

          if (this.oldTruckFees[i].feeStartTime !== this.truck?.truckFees[j].feeStartTime) {
            lineText.push('Time In updated from (' + (this.oldTruckFees[i].feeStartTime ? this.oldTruckFees[i].feeStartTime : ' ') + ') to (' + (this.truck?.truckFees[j].feeStartTime ? this.truck.truckFees[j].feeStartTime : ' ') + ').');
          }

          if (this.oldTruckFees[i].feeEndTime !== this.truck?.truckFees[j].feeEndTime) {
            lineText.push('Time Out updated from (' + (this.oldTruckFees[i].feeEndTime ? this.oldTruckFees[i].feeEndTime : ' ') + ') to (' + (this.truck?.truckFees[j].feeEndTime ? this.truck.truckFees[j].feeEndTime : ' ') + ').');
          }

          if (this.oldTruckFees[i].stopNum !== this.truck?.truckFees[j].stopNum) {
            lineText.push('Stop # updated from (' + (this.oldTruckFees[i].stopNum ? this.oldTruckFees[i].stopNum : ' ') + ') to (' + (this.truck?.truckFees[j].stopNum ? this.truck.truckFees[j].stopNum : ' ') + ').');
          }

          if (lineText.length > 0) { notesText.push('Accessory ' + (accessoriesToName?.item ?? '') + ' updated. \r\n'  + lineText.join('\r\n')); }
        }
      }
      if (!AccessoryFound) {
        const accessoriesFromName = accessoriesTypesList.find(x => x.value == this.oldTruckFees[i].accessorialTypeId?.toString());
        notesText.push('Accessory ' + (accessoriesFromName?.item ?? '') + ' Removed.');
      }
    }

    // log any Truckload changes
    if (this.oldTruckload?.nickName !== this.truck?.nickName) {
      notesText.push('NICKNAME updated from (' + (this.oldTruckload?.nickName ? this.oldTruckload.nickName : ' ') + ') to (' + (this.truck?.nickName ? this.truck.nickName : ' ') + ')');
    }

    if (this.oldTruckload?.driverPhone !== this.truck?.driverPhone) {
      notesText.push('DRIVER PHONE updated from (' + (this.oldTruckload?.driverPhone ? this.oldTruckload.driverPhone : ' ') + ') to (' + (this.truck?.driverPhone ? this.truck.driverPhone : ' ') + ')');
    }

    if (this.oldTruckload?.proLoadNumber !== this.truck?.proLoadNumber) {
      notesText.push('PRO/LOAD updated from (' + (this.oldTruckload?.proLoadNumber ? this.oldTruckload.proLoadNumber : ' ') + ') to (' + (this.truck?.proLoadNumber ? this.truck.proLoadNumber : ' ') + ')');
    }

    if (this.oldTruckload?.licensePlateNo !== this.truck?.licensePlateNo) {
      notesText.push('LICENSE PLATE updated from (' + (this.oldTruckload?.licensePlateNo ? this.oldTruckload.licensePlateNo : ' ') + ') to (' + (this.truck?.licensePlateNo ? this.truck.licensePlateNo : ' ') + ')');
    }

    if (this.oldTruckload?.trailerNumber !== this.truck?.trailerNumber) {
      notesText.push('TRAILER NUMBER (Number assigned to cargo trailer) updated from (' + (this.oldTruckload?.trailerNumber ? this.oldTruckload.trailerNumber : ' ') + ') to (' + (this.truck?.trailerNumber ? this.truck.trailerNumber : ' ') + ')');
    }

    if (this.oldTruckload?.extTruckNumber !== this.truck?.extTruckNumber) {
      notesText.push('TRUCK NUMBER (External Truck Number, Number assigned to truck or vehicle.) updated from (' + (this.oldTruckload?.extTruckNumber ? this.oldTruckload.extTruckNumber : ' ') + ') to (' + (this.truck?.extTruckNumber ? this.truck.extTruckNumber : ' ') + ')');
    }

    if (this.oldTruckload?.tractorNumber !== this.truck?.tractorNumber) {
      notesText.push('TRACTOR NUMBER updated from (' + (this.oldTruckload?.tractorNumber ? this.oldTruckload.tractorNumber : ' ') + ') to (' + (this.truck?.tractorNumber ? this.truck.tractorNumber : ' ') + ')');
    }

    if (this.oldTruckload?.isProblem !== this.truck?.isProblem) {
      notesText.push('PRIORITY/ELEVATED updated from (' + (this.oldTruckload?.isProblem ? 'Checked' : 'Not Checked') + ') to (' + (this.truck?.isProblem ? 'Checked' : 'Not Checked') + ')');
    }

    if (this.oldTruckload?.pickupExceptionFK !== this.truck?.pickupExceptionFK) {
      const oldExceptionName = this.oldTruckload?.pickupExceptionFK ? (this.tic.exceptionDropdown().find(x => x.ExceptionID == this.oldTruckload?.pickupExceptionFK)?.ExceptionName) : ' ';
      const newExceptionName = this.truck?.pickupExceptionFK ? (this.tic.exceptionDropdown().find(x => x.ExceptionID == this.truck?.pickupExceptionFK)?.ExceptionName) : ' ';
      notesText.push('PICKUP EXCEPTION updated from (' + oldExceptionName + ') to (' + newExceptionName + ')');
    }

    if (this.oldTruckload?.deliveryExceptionFK !== this.truck?.deliveryExceptionFK) {
      const oldExceptionName = this.oldTruckload?.deliveryExceptionFK ? (this.tic.exceptionDropdown().find(x => x.ExceptionID == this.oldTruckload?.deliveryExceptionFK)?.ExceptionName) : ' ';
      const newExceptionName = this.truck?.deliveryExceptionFK ? (this.tic.exceptionDropdown().find(x => x.ExceptionID == this.truck?.deliveryExceptionFK)?.ExceptionName) : ' ';
      notesText.push('DELIVERY EXCEPTION updated from (' + oldExceptionName + ') to (' + newExceptionName + ')');
    }

    if (this.oldTruckload?.salesRep !== this.truck?.salesRep) {
      const newCarrierSalesName = this.truck?.salesRep ? (this.tic.salesRepDropdown().find(x => x.UserID == this.truck?.salesRep)?.UserName) : ' ';
      notesText.push('CARRIER SALES REP updated from (' + (this.oldTruckload?.salesRepUser ? this.oldTruckload.salesRepUser : ' ') + ') to (' + newCarrierSalesName + ')');
    }

    // pickupAppointmentStart
    if (this.oldTruckload?.shipments?.[0].shipmentDetail.pickupAppointmentStart?.replace('T', ' ')?.substring(0, 16) !== this.truck?.shipments?.[0].shipmentDetail.pickupAppointmentStart?.replace('T', ' ')?.substring(0, 16)) {
      notesText.push('PICKUP WINDOW START updated from (' + (this.isDate(this.oldTruckload?.shipments?.[0].shipmentDetail.pickupAppointmentStart) ? new Date(this.oldTruckload?.shipments?.[0].shipmentDetail.pickupAppointmentStart).toLocaleDateString('en-US', options) : ' ') + ') to (' + (this.isDate(this.truck?.shipments?.[0].shipmentDetail.pickupAppointmentStart) ? new Date(this.truck?.shipments?.[0].shipmentDetail.pickupAppointmentStart).toLocaleDateString('en-US', options) : ' ') + ')');
    }

    // pickup Appointment stop
    if (this.oldTruckload?.shipments?.[0].shipmentDetail.pickupAppointmentStop?.replace('T', ' ')?.substring(0, 16) !== this.truck?.shipments?.[0].shipmentDetail.pickupAppointmentStop?.replace('T', ' ')?.substring(0, 16)) {
      notesText.push('PICKUP WINDOW STOP updated from (' + (this.isDate(this.oldTruckload?.shipments?.[0].shipmentDetail.pickupAppointmentStop) ? new Date(this.oldTruckload?.shipments?.[0].shipmentDetail.pickupAppointmentStop).toLocaleDateString('en-US', options) : ' ') + ') to (' + (this.isDate(this.truck?.shipments?.[0].shipmentDetail.pickupAppointmentStop) ? new Date(this.truck?.shipments?.[0].shipmentDetail.pickupAppointmentStop).toLocaleDateString('en-US', options) : ' ') + ')');
    }

    const sLen = this.truck?.shipments ? (this.truck.shipments.length - 1) : -1;
    // Delivery Date Appointment Start
    if (this.oldTruckload?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStart?.replace('T', ' ')?.substring(0, 16) !== this.truck?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStart?.replace('T', ' ')?.substring(0, 16)) {
      notesText.push('DELIVERY WINDOW START updated from (' + (this.isDate(this.oldTruckload?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStart) ? new Date(this.oldTruckload?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStart).toLocaleDateString('en-US', options) : ' ') + ') to (' + (this.isDate(this.truck?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStart) ? new Date(this.truck?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStart).toLocaleDateString('en-US', options) : ' ') + ')');
    }

    // Delivery Date Appointment Stop
    if (this.oldTruckload?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStop?.replace('T', ' ')?.substring(0, 16) !== this.truck?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStop?.replace('T', ' ')?.substring(0, 16)) {
      notesText.push('DELIVERY WINDOW STOP updated from (' + (this.isDate(this.oldTruckload?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStop) ? new Date(this.oldTruckload?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStop).toLocaleDateString('en-US', options) : ' ') + ') to (' + (this.isDate(this.truck?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStop) ? new Date(this.truck?.shipments?.[sLen].shipmentDetail.deliveryAppointmentStop).toLocaleDateString('en-US', options) : ' ') + ')');
    }

    if (this.oldTruckload?.shipments?.[0].shipmentDetail.actualShipDate?.replace('T', ' ') !== this.truck?.shipments?.[0].shipmentDetail.actualShipDate?.replace('T', ' ')) {
      notesText.push('ACTUAL PICKUP DATE updated from (' + (this.isDate(this.oldTruckload?.shipments?.[0].shipmentDetail.actualShipDate) ? this.oldTruckload?.shipments?.[0].shipmentDetail.actualShipDate.split('T')[0] : ' ') + ') to (' + (this.isDate(this.truck?.shipments?.[0].shipmentDetail.actualShipDate) ? this.truck?.shipments?.[0].shipmentDetail.actualShipDate.split('T')[0] : ' ') + ')');
    }

    if (this.oldTruckload?.deliveryDate?.replace('T', ' ') !== this.truck?.deliveryDate?.replace('T', ' ')) {
      notesText.push('ACTUAL DELIVERY DATE updated from (' + (this.isDate(this.oldTruckload?.deliveryDate) ? this.oldTruckload?.deliveryDate?.split('T')[0] : ' ') + ') to (' + (this.isDate(this.truck?.deliveryDate) ? this.truck?.deliveryDate?.split('T')[0] : ' ') + ')');
    }

    for (let i = 0; i < notesText.length; i++) {
      const note: Note = {
        notText: notesText[i],
        notCognitoUsername: this.userName,
        notID: null,
        notTimeStamp: new Date(),
        clientNote: false,
        isNeedsManagement: false
      } as Note;
      this.rs.addNote(shipmentDetails.shipmentDetail.shipmentID, false, note).subscribe();
    }

    lineText = [];
    if (this.truck?.shipments) {
      for (let i = 0; i < this.truck.shipments.length; i++) {
        lineText.length = 0;
        // PO number
        if (this.oldTruckload?.shipments?.[i].shipmentDetail.poNumber !== this.truck?.shipments[i].shipmentDetail.poNumber) {
          lineText.push('PO Number (STOP #' + this.truck.shipments[i].shipmentDetail.shipmentID + ') updated from (' +
            (this.oldTruckload?.shipments?.[i].shipmentDetail.poNumber ?
              this.oldTruckload.shipments[i].shipmentDetail.poNumber : ' ') + ') to (' +
            (this.truck?.shipments[i].shipmentDetail.poNumber ? this.truck.shipments[i].shipmentDetail.poNumber : ' ') + ')');
        }

        // Special Instructions
        if (this.oldTruckload?.shipments?.[i].shipmentDetail.specialInstructions !==
          this.truck.shipments[i].shipmentDetail.specialInstructions) {
          lineText.push('Special Instructions (STOP #' + this.truck.shipments[i].shipmentDetail.shipmentID + ') updated from (' +
            (this.oldTruckload?.shipments?.[i].shipmentDetail.specialInstructions ?
              this.oldTruckload.shipments[i].shipmentDetail.specialInstructions : ' ') + ') to (' +
            (this.truck?.shipments[i].shipmentDetail.specialInstructions ?
              this.truck.shipments[i].shipmentDetail.specialInstructions : ' ') + ')');
        }

        if (lineText.length > 0) {
          const shipId = Number(this.truck?.shipments[i].shipmentDetail.shipmentID);
          const note: Note = {
            notText: lineText.join('\r\n'),
            notCognitoUsername: this.userName,
            notID: null,
            notTimeStamp: new Date(),
            clientNote: false,
            isNeedsManagement: false
          } as Note;
          this.rs.addNote(shipId, false, note).subscribe();
        }
      }
    }
  }

  getGroupCustomizations(groupID: number) {
    this.showCheckInsuranceAmount = false;
    this.poMoniker = null;
    this.igs.getGroupCustomizations(groupID).subscribe({
      next: response => {
        for (const customization of response as Customization[]) {
          if (customization.customizationID == 87) {
            this.showCheckInsuranceAmount = true;
          }
          if (customization.customizationID == 10) {
            this.poMoniker = customization.stringValue;
          }
          if (customization.customizationID == 76) {
            this.enableTrackingEmails = true;
          }
        }
      }
    });
  }

  getLastStop(): Location {
    let stops: Location[] = [];

    if (this.truck?.shipments) {
      for (const shipments of this.truck.shipments) {
        const stop: any = shipments.consignee;
        const consignee: Location = {
          id: stop.id,
          name: stop.name,
          plant: stop.plant,
          streetAddress: stop.streetAddress,
          address2: stop.address2,
          address3: stop.address3,
          city: stop.city,
          state: stop.state,
          zip: stop.zip,
          phone: stop.phone,
          contact: stop.contact,
          country: stop.country,
          email: stop.email
        };
        stops.push(consignee);
      }
    }

    let lastStop: any = null;
    if (stops.length > 0) { lastStop = stops[stops.length - 1]; }
    return lastStop;
  }

  dateTzConverter(data: any) {
    let count = 0;
    for (const shipment of data.shipments) {
      const consigneeTimezone = shipment.consignee.timezone;
      const shipperTimezone = shipment.shipper.timezone;

      const pickupAppointmentStart = !this.isDate(shipment.shipmentDetail.pickupAppointmentStart) ? null
        : this.convertTimezone(shipment.shipmentDetail.pickupAppointmentStart, shipperTimezone);
      const pickupAppointmentStop = !this.isDate(shipment.shipmentDetail.pickupAppointmentStop) ? null
        : this.convertTimezone(shipment.shipmentDetail.pickupAppointmentStop, shipperTimezone);
      const deliveryAppointmentStart = !this.isDate(shipment.shipmentDetail.deliveryAppointmentStart) ? null
        : this.convertTimezone(shipment.shipmentDetail.deliveryAppointmentStart, consigneeTimezone);
      const deliveryAppointmentStop = !this.isDate(shipment.shipmentDetail.deliveryAppointmentStop) ? null
        : this.convertTimezone(shipment.shipmentDetail.deliveryAppointmentStop, consigneeTimezone);

      data.shipments[count].shipmentDetail.pickupAppointmentStart = pickupAppointmentStart;
      data.shipments[count].shipmentDetail.pickupAppointmentStop = pickupAppointmentStop;
      data.shipments[count].shipmentDetail.deliveryAppointmentStart = deliveryAppointmentStart;
      data.shipments[count].shipmentDetail.deliveryAppointmentStop = deliveryAppointmentStop;
      count++;
    }
    return data;
  }

  convertTimezone(timedate: any, timezone: any) {
    if (timezone && timedate) {
      const myDate = momentTimezone.utc(timedate).tz(timezone);
      return myDate.format('YYYY-MM-DD HH:mm:ss');
    }
    return timedate;
  }

  validateMissingTargetRate() {
    let flagMissingTargetRate = false;
    const targetRate = this.truck?.shipments ? this.truck.shipments[this.truck.shipments.length - 1].targetRates :  null;
    if (targetRate == null || (targetRate && targetRate.targetBuy == null)) { flagMissingTargetRate = true; }
    if (this.tlQuotes.length === 0 && (this.truck?.tlQuotes?.length ?? 0) > 0 && flagMissingTargetRate) {
      return true;
    } else if (this.tlQuotes.length > 0 && (this.truck?.tlQuotes?.length ?? 0) > 0 && flagMissingTargetRate) {
      return true;
    }
    return false;
  }

  generateAndSaveTargetRate() {
    let targetRate: TruckloadRate | null = null;
    const data = this.rateGrid.ratesGridForm.get('selectedRate')?.value;
    if (data.assigned && data.isTLRate && data.targetBuy != null && data.targetSell != null) {
      targetRate = {
        targetRateID: this.rateGrid.ratesGridForm.get('selectedRate')?.value.targetRateID,
        creationDate: this.rateGrid.ratesGridForm.get('selectedRate')?.value.creationDate,
        fuelSurchargeBuy: this.rateGrid.ratesGridForm.get('selectedRate')?.value.fuelSurchargeBuy,
        fuelSurchargeSell: this.rateGrid.ratesGridForm.get('selectedRate')?.value.fuelSurchargeSell,
        targetBuy: this.rateGrid.ratesGridForm.get('selectedRate')?.value.targetBuy,
        targetSell: this.rateGrid.ratesGridForm.get('selectedRate')?.value.targetSell,
        fuelSurchargeAvg: this.rateGrid.ratesGridForm.get('selectedRate')?.value.fuelSurchargeAvg,
        ratePerMileAvg: this.rateGrid.ratesGridForm.get('selectedRate')?.value.ratePerMileAvg,
        marketAvg: this.rateGrid.ratesGridForm.get('selectedRate')?.value.marketAvg,
        marketLow: this.rateGrid.ratesGridForm.get('selectedRate')?.value.marketLow,
        marketHigh: this.rateGrid.ratesGridForm.get('selectedRate')?.value.marketHigh,
        originName: this.rateGrid.ratesGridForm.get('selectedRate')?.value.originName,
        originType: this.rateGrid.ratesGridForm.get('selectedRate')?.value.originType,
        destinationName: this.rateGrid.ratesGridForm.get('selectedRate')?.value.destinationName,
        destinationType: this.rateGrid.ratesGridForm.get('selectedRate')?.value.destinationType,
        timeFrame: this.rateGrid.ratesGridForm.get('selectedRate')?.value.timeFrame,
        equipment: this.rateGrid.ratesGridForm.get('selectedRate')?.value.equipment,
        mileage: this.rateGrid.ratesGridForm.get('selectedRate')?.value.mileage
      };
      if (this.truck?.shipments) this.truck.shipments[this.truck.shipments.length - 1].targetRates = targetRate;
      this.processTruckChanges();
    } else {
      this.retrieveTruckloadRates();
    }
  }

  onRatesSelected(event = false) {
    let targetRate: TruckloadRate | null = null;
    const data = this.rateGrid.ratesGridForm.get('selectedRate')?.value;
    if (event && data.assigned && data.isTLRate && data.targetBuy != null && data.targetSell != null) {
      targetRate = {
        targetRateID: null,
        creationDate: data.creationDate,
        fuelSurchargeBuy: data.fuelSurchargeBuy,
        fuelSurchargeSell: data.fuelSurchargeSell,
        targetBuy: data.targetBuy,
        targetSell: data.targetSell,
        fuelSurchargeAvg: data.fuelSurchargeAvg,
        ratePerMileAvg: data.ratePerMileAvg,
        marketAvg: data.marketAvg,
        marketLow: data.marketLow,
        marketHigh: data.marketHigh,
        originName: data.originName,
        originType: data.originType,
        destinationName: data.destinationName,
        destinationType: data.destinationType,
        timeFrame: data.timeFrame,
        equipment: data.equipment,
        mileage: data.mileage
      };
      if (this.truck?.shipments) this.truck.shipments[this.truck.shipments.length - 1].targetRates = targetRate;
    }
  }

  retrieveTruckloadRates() {
    this.rateGrid.buildRateRequest();
    this.spinner.show('truckloadRatesGrid').then();
    this.rateService.getTruckloadRates(this.rateGrid.tlRateRequest).subscribe({
      next: response => {
        this.rateGrid.truckloadResponseData = response;
      },
      error: () => {
        this.spinner.hide('truckloadRatesGrid').then();
        this.processTruckChanges();
      },
      complete: () => {
        this.rateGrid.setTruckloadRateData();
        this.rateGrid.setSelectedValue(this.rateGrid.truckloadRatesData()[0]);
        this.onRatesSelected(true);
        this.spinner.hide('truckloadRatesGrid').then();
        this.processTruckChanges();
      }
    });
  }

  openOfferQuotesModal(isNewQuote = false, offerId: string | null = null) {
    this.loadOfferId = null;
    this.offerQuote = null;
    if (isNewQuote) {
      this.newOfferQuote = true;
      $('#offerQuotesModal').modal('show');
    } else {
      this.newOfferQuote = false;
      this.spinner.show('createLoadTrackSpinner').then();
      this.tts.getOfferById(offerId).subscribe({
        next: (response: TruckerToolsOffer | null) => {
          this.loadOfferId = response?.loadOfferId?.toString() ?? null;
          this.offerQuote = response;
          this.spinner.hide('createLoadTrackSpinner').then();
          $('#offerQuotesModal').modal('show');
        },
        error: (error: any) => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Get Offer', '<i>' + error + '</i>', 'warning');
        }
      });
    }
  }

  onReceiveTTEvent(event: any, getQuotes = false) {
    if (event) {
      if (getQuotes) { this.carrierQuotes.onClickRetrieveQuotes(); }
      setTimeout(() => {
        this.spinner.hide('savingTrackingDetails').then();
        this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
          this.router.navigate(['SPAs/tracking/truckload-details/' + this.truckID + '/' + this.groupID]);
        });
      }, 100);
    }
  }

  onBtnCreateAsLTL() {
    document.getElementById('createAsLTLModalButton')?.click();
  }

  confirmCreateAsLTL() {
    this.tss.convertTruckToLTL(this.truckID, this.userName).subscribe({
      next: () => {
        if (this.truck?.shipments) {
          for (const shipment of this.truck.shipments) {
            const url = this.router.serializeUrl(
              this.router.createUrlTree(['/SPAs/tracking/tracking-details/' + shipment.shipmentDetail.shipmentID + '/' + shipment.client?.groupID])
            );
            window.open(url, '_blank');
          }
        }
        this.spinner.hide('spinnerShipmentForm').then();
        this.router.navigate(['/SPAs/new'], {replaceUrl: true});
      },
      error: () => {
        this.spinner.hide('spinnerShipmentForm').then();
      }
    });
  }

  createAccesorialFeeNotes() {
    if (this.truck?.truckFees) {
      for (const fee of this.truck.truckFees) {
        if (fee.truckFeesId == null && fee.accessorialTypeId != null) {
          const accessorialName = Constants.ACCESSORIAL_TYPES_DROPDOWN.find(x => x.value == fee.accessorialTypeId?.toString());
          const noteText = 'Accessorial Added: ' + (accessorialName?.item ?? '') + '. Carrier Charge $' + (fee.amount ? fee.amount : '0') + ' ' +
            this.truck?.shipments?.[0]?.carrierDetail?.carcutAbbreviation + '. Client Charge $' + (fee.sellAmount ? fee.sellAmount : '0') + ' ' +
            this.truck?.shipments?.[0]?.carrierDetail?.carcutAbbreviation + '.' +
            (fee.feeIncurredAt == null || fee.feeIncurredAt == '' ? '' : ' Ocurred at ' + fee.feeIncurredAt + '.') +
            (fee.stopNum == null || fee.stopNum == 0 ? '' : ' Stop #' + fee.stopNum + '.') +
            (fee.feeStartTime == null || fee.feeStartTime == '' ? '' : ' Time In ' + fee.feeStartTime.replace('T', ' ') + '.') +
            (fee.feeEndTime == null || fee.feeEndTime == '' ? '' : ' Time Out ' + fee.feeEndTime.replace('T', ' ') + '.');

          const note: Note = {
            notText: noteText,
            notCognitoUsername: this.userName,
            notID: null,
            notTimeStamp: new Date(),
            clientNote: false,
            isNeedsManagement: false
          } as Note;
          const shipId = this.truck?.shipments ? this.truck.shipments[this.truck.shipments.length - 1].shipmentDetail.shipmentID : 0;
          this.rs.addNote(parseInt(shipId), false, note).subscribe();
        }
      }
    }
  }

  validatingTruckFees() {
    if (this.truck?.truckFees.length == 0) { return true; }
    if (this.truck?.truckFees.length == 1) {
      if (!this.truck.truckFees[0].amount && !this.truck.truckFees[0].sellAmount && !this.truck.truckFees[0].accessorialTypeId) {
        this.truck.truckFees = [];
        return true;
      }
    }

    let validTruckFees = true;
    const truckFees: TruckFees[] = this.truck?.truckFees ?? [];
    for (let i = 0; i < truckFees.length; i++) {

      if (truckFees[i].accessorialTypeId == null || truckFees[i].accessorialTypeId?.toString() == '') {
        $('#accessorialTypeId' + i).addClass('is-invalid');
        validTruckFees = false;
      }

      if (truckFees[i].amount == null || truckFees[i].amount?.toString() == '') {
        $('#amount' + i).addClass('is-invalid');
        validTruckFees = false;
      }

      if (truckFees[i].sellAmount == null || truckFees[i].sellAmount?.toString() == '') {
        $('#sellAmount' + i).addClass('is-invalid');
        validTruckFees = false;
      }
    }

    return validTruckFees;
  }

  quotesLoadedComplete() {
    this.quotesLoaded = true;
    this.spinner.hide('trackingDetails').then();
  }

  validateQuotesMissingReasonCode() {
    let flagReasonCode = false;
    for (let i = 0; i < this.quotes.quotes.length; i++) {
      if (this.quotes.quotes.at(i).get('assigned')?.value == true && this.quotes.validateReasonCode(i)) {
        flagReasonCode = true;
        break;
      }
    }
    return flagReasonCode;
  }

  validateQuotesMissingEquipment() {
    for (let i = 0; i < this.quotes.quotes.controls.length; i++) {
      const equipmentValue = this.quotes.quotes.controls[i].value.equipment;
      const carrierValue = this.quotes.quotes.controls[i].value.carrierID;
      if (carrierValue) {
        if (equipmentValue === null || equipmentValue === '') {
          $('#equipment' + i).addClass('is-invalid');
          return false;
        }
      }
    }
    return true;
  }

  disableForPrebill() {
    // validate whether 72 hours have passed since the shipment was marked as delivered
    if (this.truck?.state == 'DELIVERED') {
      let currentDateObj = new Date();
      const numberOfMlSeconds = currentDateObj.getTime();
      const subtractHour = (72 * 60) * 60 * 1000;
      const newDateObj = new Date(numberOfMlSeconds - subtractHour);

      const prebillTimestamp = this.truck?.shipments ?
        this.truck.shipments[this.truck.shipments.length - 1].shipmentDetail.preBillEntryTimestamp : null;

      if (prebillTimestamp) {
        const prebilldate = moment(prebillTimestamp.replace('T', ' '), 'YYYY-MM-DD hh:mm:ss').toDate();
        if (newDateObj > prebilldate) { return true; }
      }

      const trackingStatus = this.truck?.shipments ? this.truck.shipments[this.truck.shipments.length - 1].historicalEvents : [];
      const ts = trackingStatus.find((item) => {
        return item.trackingState == 'DELIVERED'
      });
      if (ts) {
        const prebilldate = moment(ts.entryTimeStamp?.replace('T', ' '), 'YYYY-MM-DD hh:mm:ss').toDate();
        if (newDateObj > prebilldate) { return true; }
      }
    }

    return false;
  }

  validateReasonCode() {
    for (let i = 0; i < this.quotes.quotes.length; i++) {
      if (this.quotes.quotes.at(i).get('assigned')?.value == true) {
        this.quotes.hideReasonCode(i);
        break;
      }
    }
  }

  onQuoteRemovedEvent(event: any) {
    this.selectedQuoteRemoved = event;
  }

  onSelectedQuoteEvent(event: any) {
    this.selectedQuoteDeselected = event;
  }

  async duplicateLoadOnClick() {
    Swal.fire({
      title: 'Load duplication',
      icon: 'question',
      html: 'Do you want to duplicate shipment?',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Continue',
      input: 'text',
      inputLabel: 'Type number of duplicates to be generated, Max. value 10.',
      inputValue: 1,
      didOpen: () => {
        $('input[type="text"].swal2-input').on('keypress', (event) => {
          const key = event.keyCode;
          return !(key < 48 || key > 57);
        });
      },
      inputValidator: (value): any => {
        if (!value) { return 'Number of duplicates must be provided and must be greater than zero!'; }
        if (parseInt(value) === 0) { return 'Number of duplicates must be provided and must be greater than zero!'; }
        if (parseInt(value) > 10) { return 'Maximum number of duplicates is 10.'; }
      },
      inputAttributes: {
        maxlength: '2',
        onpaste: 'return false;',
        ondrop: 'return false;'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show('trackingDetailsSpinner').then();
        const numOfCopies = parseInt(result.value);
        this.idShipmentsCopied = [];
        this.originalTruckload!.truckID = null;
        this.originalTruckload!.loadPosted = false;
        this.originalTruckload!.loadBoardID = null;
        this.originalTruckload!.deliveryDate = null;
        this.originalTruckload!.carrierId = null;
        this.originalTruckload!.carrierName = null;
        this.originalTruckload!.state = 'PENDING';
        this.originalTruckload!.mapUrl = null;
        this.originalTruckload!.truckFees = [];
        this.originalTruckload!.tlQuotes = [];
        this.originalTruckload!.isProblem = false;
        this.originalTruckload!.nickName = null;
        this.originalTruckload!.salesRep = null;
        this.originalTruckload!.driverPhone = null;
        this.originalTruckload!.licensePlateNo = null;
        this.originalTruckload!.trailerNumber = null;
        this.originalTruckload!.extTruckNumber = null;
        this.originalTruckload!.tractorNumber = null;
        let isPastDate = false;
        let shipdate = new Date(this.originalTruckload?.shipDate ?? '');
        shipdate.setDate(shipdate.getDate() + 1);
        this.originalTruckload!.shipDate = null;
        if (shipdate < new Date()) {
          this.originalTruckload!.quoteDueBy = null;
          isPastDate = true;
        }

        if (this.originalTruckload?.shipments) {
          for (let i = 0; i < this.originalTruckload.shipments.length; i++) {
            this.originalShipment = this.originalTruckload.shipments[i];
            let shipmentToCopy: ShipmentSave = {
              shipmentDetail: this.originalShipment.shipmentDetail,
              client: this.originalShipment.client,
              user: {
                userID: null,
                userName: this.userName
              },
              carrierDetail: null,
              shipper: this.originalShipment.shipper,
              consignee: this.originalShipment.consignee,
              billTo: this.originalShipment.billTo,
              lineItems: [],
              referenceFields: [],
              openReferenceFields: [],
              manualQuotes: [],
              accessorials: [],
              historicalEvents: [],
              targetRates: null,
              notificationMails: [],
              whiteGlove: this.originalShipment.whiteGlove,
              trackingContacts: []
            };
            shipmentToCopy.shipmentDetail.shipmentID = null;
            shipmentToCopy.shipmentDetail.shipmentStatus = 'PENDING';
            shipmentToCopy.shipmentDetail.enteredShipDate = null;
            shipmentToCopy.shipmentDetail.createdOn = moment().utc().toDate();
            shipmentToCopy.shipmentDetail.carrier = null;
            shipmentToCopy.shipmentDetail.carrierID = null;
            shipmentToCopy.shipmentDetail.proNumber = null;
            shipmentToCopy.shipmentDetail.poNumber = null;
            shipmentToCopy.shipmentDetail.bolNumber = null;
            shipmentToCopy.shipmentDetail.ilCost = null;
            shipmentToCopy.shipmentDetail.customerCost = null;
            shipmentToCopy.shipmentDetail.quotedCost = null;
            shipmentToCopy.shipmentDetail.quoteID = null;
            shipmentToCopy.shipmentDetail.truckID = null;
            shipmentToCopy.shipmentDetail.actualDeliveryDate = null;
            shipmentToCopy.shipmentDetail.actualShipDate = null;
            shipmentToCopy.shipmentDetail.scheduledDeliveryDate = null;
            shipmentToCopy.shipmentDetail.deliveryAppointmentDate = null;
            shipmentToCopy.shipmentDetail.originalShipDate = null;
            shipmentToCopy.shipmentDetail.originalDeliveryDate = null;
            if (isPastDate) {
              shipmentToCopy.shipmentDetail.pickupAppointmentStart = null;
              shipmentToCopy.shipmentDetail.pickupAppointmentStop = null;
              shipmentToCopy.shipmentDetail.deliveryAppointmentStart = null;
              shipmentToCopy.shipmentDetail.deliveryAppointmentStop = null;
            } else {
              shipmentToCopy.shipmentDetail.pickupAppointmentStart = null;
              shipmentToCopy.shipmentDetail.pickupAppointmentStop = null;
              shipmentToCopy.shipmentDetail.deliveryAppointmentStart = null;
              shipmentToCopy.shipmentDetail.deliveryAppointmentStop = null;
            }
            shipmentToCopy.shipmentDetail.pickupException = null;
            shipmentToCopy.shipmentDetail.deliveryException = null;
            if (this.originalTruckload?.shipments) this.originalTruckload.shipments[i] = shipmentToCopy;
          }
        }

        if (numOfCopies === 1) {
          this.sendCreateShipment(this.originalTruckload);
        } else {
          for (let i = 0; i < numOfCopies; i++) {
            setTimeout(() => {
              this.sendCreateShipment(this.originalTruckload, numOfCopies);
            }, 1000);
          }
          setTimeout(() => {
            this.closeDuplicationModal();
          }, 3000);
        }
      } else {
        // cancel duplicates
        return;
      }
    });
  }

  async sendCreateShipment(truckload: any, numOfCopies = 1) {
    let shipmentCopied: any = null;
    this.tss.saveTruck(truckload).subscribe({
      next: response => {
        shipmentCopied = response;
      },
      error: () => {
        this.spinner.hide('trackingDetailsSpinner').then();
      },
      complete: async () => {
        this.idShipmentsCopied?.push(shipmentCopied.truckID);
        window.open('/SPAs/new/truckload/' + shipmentCopied.truckID + '/' + shipmentCopied.shipments[0].client.groupID, '_blank');
        if (numOfCopies === 1) {
          this.closeDuplicationModal();
        }
      }
    });
  }

  closeDuplicationModal() {
    this.spinner.hide('trackingDetailsSpinner').then();
    this.Toast.fire({
      icon: 'success',
      title: 'Load duplication',
      html: 'Load duplicates succesfully.'
    }).then(() => {
      Swal.fire('Load duplication', 'Truckload IDs: ' + this.idShipmentsCopied?.join(', ') + '.', 'success');
    });
  }

  onMailSent() {
    this.tic.onMailSent();
    this.getUserId();
  }

  updateCarrierSalesRep(salesRepId: any) {
    this.tss.updateTruckSalesRep(this.truck?.truckID, salesRepId).subscribe({
      next: () => {
        this.spinner.hide('trackingDetailsSpinner').then();
      },
      error: () => {
        this.spinner.hide('trackingDetailsSpinner').then();
      }
    });
  }

  getUserId() {
    let user: any;
    this.spinner.show('trackingDetailsSpinner').then();
    this.usrService.getUserByUserName(this.userName).subscribe({
      next: response => {
        user = response;
        this.truck!.salesRep = user.UserID;
        this.truck!.salesRepUser = user.UserName;
        this.updateCarrierSalesRep(user.UserID);
        this.tic.setCarrierSalesRep(user.UserID, user.UserName);
      },
      error: () => {
        this.spinner.hide('trackingDetailsSpinner').then();
      }
    });
  }

  validatingMails() {
    let validMails = true;
    const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    let stopIndex = 0;
    if (this.truck?.shipments) {
      for (const shipment of this.truck.shipments) {
        if (shipment.notificationMails.length > 0) {
          let index = 0;
          for (const mail of shipment.notificationMails) {
            if (mail.statusNotEmail && mail.statusNotEmail !== '') {
              if (reg.test(mail.statusNotEmail)) {
                $('#statusNotEmailTL' + stopIndex + '-' + index).removeClass('is-invalid').removeClass('invalid-mail');
              } else {
                $('#statusNotEmailTL' + stopIndex + '-' + index).addClass('is-invalid').addClass('invalid-mail');
                this.scrollTo(document.querySelector('input#statusNotEmailTL' + stopIndex + '-' + index));
                validMails = false;
              }
            }
            index = index + 1;
          }
        }
        stopIndex = stopIndex + 1;
      }
    }
    return validMails;
  }

  sendStatusNotificationMail(statusUpdate: any, trackDate: any) {
    let carrierName = '';
    const shipmentID: string = statusUpdate.shipmentID.toString();
    const trackingState: string = statusUpdate.trackingState.toString();
    const selectedQuote = this.truck?.tlQuotes?.filter(item => item.assigned == true) ?? [];
    if (selectedQuote.length > 0) {
      carrierName = selectedQuote[0].carrierName ?? '';
    }

    if (this.truck?.shipments) {
      for (const shipment of this.truck.shipments) {
        if (shipment.shipmentDetail.shipmentID.toString() === shipmentID) {
          if (shipment.notificationMails.length > 0) {
            for (const mail of shipment.notificationMails) {
              if (mail.statusNotEmail && mail.statusNotEmail !== '') {
                this.emailService.sendTrackingMailTL(this.truckID, shipment, statusUpdate, trackDate, mail.statusNotEmail, carrierName,
                  false);
              }
            }
          }
          // SEND TRACKING EMAIL ON BOOKED / DELIVERED STATUS
          if (this.enableTrackingEmails && (trackingState === 'BOOKED' || trackingState === 'DELIVERED')) {
            this.getTrackingContactsAndSendMail(shipment, statusUpdate, trackDate, carrierName);
            const lastStopID = this.truck.shipments[this.truck.shipments.length - 1].shipmentDetail.shipmentID.toString();
            if (this.truck?.shipments.length > 1 && shipmentID === lastStopID && trackingState === 'DELIVERED') {
              for (const stops of this.truck.shipments) {
                if (stops.shipmentDetail.shipmentID.toString() !== shipmentID && stops.shipmentDetail.shipmentStatus !== 'DELIVERED') {
                  this.getTrackingContactsAndSendMail(stops, statusUpdate, trackDate, carrierName);
                }
              }
            }
          }
        }
      }
    }
  }

  scrollTo(el: Element | null) {
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
    }
  }

  setCarrierCurrency() {
    let carCurrency = this.truck?.shipments && this.truck?.shipments[0]?.carrierDetail?.carcutAbbreviation ?
      this.truck?.shipments[0]?.carrierDetail?.carcutAbbreviation : 'USD';
    if (!(this.truck?.tlQuotes && this.truck.tlQuotes.length > 0)) { return carCurrency; }
    const selectedQuote = this.truck.tlQuotes.filter(item => item.assigned == true);
    if (selectedQuote.length > 0) { carCurrency = selectedQuote[0].currencyID == 2 ? 'CAD' : 'USD'; }
    return carCurrency;
  }

  saveChangesClientQuote() {
    this.setQuoteSentToClientState = true;
    this.saveChanges();
  }

  setClientQuoteStatus() {
    if (this.truck && this.truck.state == 'FINDING_QUOTES') {
      let statusUpdate: any = {
        shipmentID: this.truck?.shipments ? this.truck.shipments[this.truck.shipments.length - 1].shipmentDetail.shipmentID : null,
        actualDate: null,
        trackingDate: new Date().toISOString().slice(0, 16),
        trackingMessage: '',
        trackingState: 'QUOTE_SENT_TO_CLIENT',
        currentCity: '',
        currentState: '',
        enteredBy: this.userName,
      };
      let trackDate = new Date(statusUpdate.trackingDate);
      trackDate.setMinutes(trackDate.getMinutes() - trackDate.getTimezoneOffset());
      statusUpdate.trackingDate = new Date(
        trackDate.getFullYear(),
        trackDate.getMonth(),
        trackDate.getDate(),
        trackDate.getHours(),
        trackDate.getMinutes(),
        trackDate.getSeconds()
      );
      this.tss.updateTruckTracking(this.truck?.truckID, statusUpdate).subscribe();
    }
    this.setQuoteSentToClientState = false;
  }

  isDate(date: any) {
    return (!(date == '' || date == null || date == '0000-00-00 00:00:00' || date == '0000-00-00T00:00:00' || date == 'Invalid date'));
  }

  getTrackingContactsAndSendMail(shipment: any, statusUpdate: any, trackDate: string, carrierName: string) {
    if (shipment?.trackingContacts) {
      const trackingState = statusUpdate.trackingState.toString().toUpperCase();
      const contactMails = [];
      for (const contact of shipment.trackingContacts) {
        contactMails.push({
          emailAddress: contact.emailAddress,
          booked: trackingState === 'BOOKED' ? contact.eventProfile?.booked : false,
          delivered: trackingState === 'DELIVERED' ? contact.eventProfile?.delivered : false
        });
      }
      const filteredContactMails = contactMails.filter((v, i, a) => a.findIndex(v2 => (JSON.stringify(v) === JSON.stringify(v2))) === i);
      for (const contact of filteredContactMails) {
        if ((trackingState === 'BOOKED' && contact.booked) ||
          (trackingState === 'DELIVERED' && contact.delivered)) {
          this.emailService.sendTrackingMailTL(this.truckID, shipment, statusUpdate, trackDate, contact.emailAddress, carrierName, true);
        }
      }
    }
  }

  validatingTrackingContacts() {
    let validMails = true;
    const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    let stopIndex = 0;
    if (this.truck?.shipments) {
      for (const shipment of this.truck.shipments) {
        if (shipment.trackingContacts.length > 0) {
          let index = 0;
          for (const mail of shipment.trackingContacts) {
            if (mail.emailAddress && mail.emailAddress !== '') {
              if (reg.test(mail.emailAddress)) {
                $('#emailAddressTL' + stopIndex + '-' + index).removeClass('is-invalid')
                  .removeClass('invalid-mail');
              } else {
                $('#emailAddressTL' + stopIndex + '-' + index).addClass('is-invalid')
                  .addClass('invalid-mail');
                this.scrollTo(document.querySelector('input#emailAddressTL' + stopIndex + '-' + index));
                validMails = false;
              }
              const elementName = '#trackingEventsTL' + stopIndex + '-' + index;
              if (!mail.eventProfile?.booked && !mail.eventProfile?.delivered) {
                $(elementName).addClass('is-invalid');
                $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').attr('style', 'border-color: #dc3545 !important');
                this.scrollTo(document.querySelector('input' + elementName));
                validMails = false;
              } else {
                $(elementName).removeClass('is-invalid');
                $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').attr('style', 'border-color: #adadad !important');
              }
            } else {
              if (mail.FirstName || mail.LastName || mail.mobilePhoneNumber || mail.eventProfile?.booked || mail.eventProfile?.delivered) {
                $('#emailAddressTL' + stopIndex + '-' + index).addClass('is-invalid').addClass('invalid-mail');
                this.scrollTo(document.querySelector('input#emailAddressTL' + stopIndex + '-' + index));
                validMails = false;
              }
            }
            index = index + 1;
          }
        }
        stopIndex = stopIndex + 1;
      }
    }
    return validMails;
  }

  buildBookedSendMail(index: number, carrierName: string) {
    const statusUpdateMail = {
      shipmentID: this.truck?.shipments?.[index].shipmentDetail.shipmentID,
      trackingDate: new Date().toISOString().slice(0, 16),
      trackingMessage: 'Quote of the carrier \'' + carrierName + '\' has been selected.',
      trackingState: 'BOOKED',
      currentCity: '',
      currentState: '',
      enteredBy: this.userName
    };
    this.getTrackingContactsAndSendMail(this.truck?.shipments?.[index], statusUpdateMail,
      new Date().toISOString().slice(0, 16), carrierName);
    if (this.truck?.shipments?.[index].notificationMails && this.truck?.shipments?.[index].notificationMails.length > 0) {
      for (const mail of this.truck.shipments[index].notificationMails) {
        if (mail && mail.statusNotEmail && mail.statusNotEmail !== '') {
          this.emailService.sendTrackingMailTL((this.truck?.truckID?.toString() ?? null), this.truck.shipments[index], statusUpdateMail,
            new Date().toISOString().slice(0, 16), mail.statusNotEmail, carrierName, false);
        }
      }
    }
  }
}
