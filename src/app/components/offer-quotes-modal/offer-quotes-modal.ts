import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TruckerToolsOffer} from '../../interfaces/Trucker-Tools-Offer';
import {NgxSpinnerService} from 'ngx-spinner';
import {TruckerToolsService} from '../../services/TruckerTools/trucker-tools.service';
import Swal from 'sweetalert2';
import {CarrierProfilingService} from '../../services/carrier-profiling/carrier-profiling.service';
import {CarrierDetail} from '../../interfaces/carrier-detail';
import {Dropdown} from '../../interfaces/dropdown';
import {TruckerToolsCarrier} from '../../interfaces/Trucker-Tools-Carrier';
import {Note} from '../../interfaces/note';
import {ReportsService} from '../../services/reports/reports.service';
import {TruckSave} from '../../interfaces/truck-save';
import {environment} from '../../../environments/environment';
import {Payee} from '../../interfaces/carrier-mcleod';
import {AuthenticatorService} from '@aws-amplify/ui-angular';
import {EmailModal} from '../email-modal/email-modal';

@Component({
  selector: 'app-offer-quotes-modal',
  standalone: false,
  templateUrl: './offer-quotes-modal.html',
  styleUrl: './offer-quotes-modal.css',
})
export class OfferQuotesModal implements OnInit, OnChanges {
  @ViewChild(EmailModal) onboardEmail!: EmailModal;
  @Output() offersEvent = new EventEmitter<boolean>(false);
  @Input() newQuote = false;
  @Input() loadOfferId: string | null = null;
  @Input() truckLoad: TruckSave | null = null;
  @Input() offerQuote: TruckerToolsOffer | null = null;
  offerQuotesForm: FormGroup = new FormGroup({});
  carrierList: CarrierDetail[] = [] as CarrierDetail[];
  dropdownList: Dropdown[] = [];
  dropdownSettings = {};
  private userName = '';
  rmisFailed = false;
  carrierExist = true;
  carrierName = '';
  carrierSource = environment.CARRIER_SOURCE; // 'RMIS' | 'MCLEOD'

  constructor(private fb: FormBuilder, private spinner: NgxSpinnerService, private tts: TruckerToolsService,
              private cps: CarrierProfilingService, private rs: ReportsService, private authServ: AuthenticatorService) {
    // initiate form groups
    this.offerQuotesForm = this.fb.group({
      loadNumber: [null, Validators.required],
      loadOfferId: [null],
      threadId: [null],
      carrierID: [null],
      carrierName: [null, Validators.required],
      carrierSelected: [[]],
      mcNumber: [null],
      carrierScac: [null],
      contactName: [null],
      contactPhone: [null],
      contactEmail: [null, Validators.required],
      offerAmount: [null, Validators.required],
      offerMessage: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.setUser();
    this.dropdownSettings = {
      singleSelection: true,
      idField: 'value',
      textField: 'item',
      allowSearchFilter: true,
      closeDropDownOnSelection: true,
      searchPlaceholderText: 'Type MC Number',
      itemsShowLimit: 5
    };

    this.getCarrierList();

    $('#offerQuoteCarriersModal').on('hidden.bs.modal', () => {
      $('#offerQuotesModal').modal('show');
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      if (this.newQuote || this.offerQuote == null) {
        if (this.offerQuotesForm) { this.offerQuotesForm.reset(); }
      }

      if (this.offerQuote != null) {
        this.carrierExist = true;
        this.offerQuotesForm.get('loadNumber')?.setValue(this.truckLoad?.proLoadNumber);
        this.offerQuotesForm.get('loadOfferId')?.setValue(this.offerQuote.loadOfferId);
        this.offerQuotesForm.get('threadId')?.setValue(this.offerQuote.threadId);
        const carrier = this.getCarrierValue(this.offerQuote.mcNumber, true);
        if (carrier == null) { this.carrierExist = false; }
        this.offerQuotesForm.get('carrierID')?.setValue(carrier?.carrierID);
        this.offerQuotesForm.get('carrierName')?.setValue(this.offerQuote.carrierName);
        this.offerQuotesForm.get('carrierSelected')?.setValue([]);
        this.offerQuotesForm.get('mcNumber')?.setValue(this.offerQuote.mcNumber);
        this.offerQuotesForm.get('carrierScac')?.setValue(this.offerQuote.scacCode);
        this.offerQuotesForm.get('contactName')?.setValue(this.offerQuote.contactName);
        this.offerQuotesForm.get('contactPhone')?.setValue(this.offerQuote.contactPhone);
        this.offerQuotesForm.get('contactEmail')?.setValue(this.offerQuote.contactEmail);
        this.offerQuotesForm.get('offerAmount')?.setValue(this.offerQuote.amount);
        this.offerQuotesForm.get('offerMessage')?.setValue(this.offerQuote.notes);
      }
    }
  }

  setUser() {
    this.authServ.subscribe(() => {
      this.userName = this.authServ.user.username;
    });
  }

  callCreateOffer() {
    if (this.offerQuotesForm.get('carrierName')?.value == null || this.offerQuotesForm.get('carrierName')?.value == '') {
      Swal.fire('Create quote', '<i>Please Select a Carrier</i>', 'warning');
      return;
    }

    const amount = this.offerQuotesForm.get('offerAmount')?.value;
    if (amount == null) {
      Swal.fire('Create quote', '<i>Please type the amount of the quote, amount must be greater than zero</i>', 'warning');
      return;
    } else if (parseFloat(amount.toString()) == 0) {
      Swal.fire('Create quote', '<i>Please type the amount of the quote, amount must be greater than zero</i>', 'warning');
      return;
    }

    if (this.offerQuotesForm.get('offerMessage')?.value == null || this.offerQuotesForm.get('offerMessage')?.value == '') {
      Swal.fire('Create quote', '<i>Please type a message for the quote</i>', 'warning');
      return;
    }

    const carrier = this.getCarrierValue(this.offerQuotesForm.get('mcNumber')?.value, true);
    if (carrier == null || carrier && carrier.inNetworkTT == false) {
      this.syncCarrierAndCreateOffer(this.offerQuotesForm.get('mcNumber')?.value, (carrier ? carrier.carrierID : null));
    } else {
      this.sendCreateOffer();
    }
  }

  sendCreateOffer() {
    const offer: TruckerToolsOffer = {
      offerId: null,
      loadNumber: this.newQuote ? (this.truckLoad?.proLoadNumber ?? '') : (this.offerQuote?.loadNumber ?? ''),
      amount: this.offerQuotesForm.get('offerAmount')?.value,
      notes: this.offerQuotesForm.get('offerMessage')?.value,
      loadOfferId: this.newQuote ? null : (this.offerQuote?.loadOfferId ?? null),
      threadId: this.newQuote ? null : (this.offerQuote?.threadId ?? null),
      offerTimestamp: null,
      offerType: null,
      carrierName: this.newQuote ? this.offerQuotesForm.get('carrierName')?.value : this.offerQuote?.carrierName,
      mcNumber: this.newQuote ? this.offerQuotesForm.get('mcNumber')?.value : this.offerQuote?.mcNumber,
      scacCode: this.newQuote ? this.offerQuotesForm.get('carrierScac')?.value : this.offerQuote?.scacCode,
      contactName: this.newQuote ? this.offerQuotesForm.get('contactName')?.value : this.offerQuote?.contactName,
      contactPhone: this.newQuote ? this.offerQuotesForm.get('contactPhone')?.value : this.offerQuote?.contactPhone,
      contactEmail: this.newQuote ? this.offerQuotesForm.get('contactEmail')?.value : this.offerQuote?.contactEmail,
    };

    this.spinner.show('spinnerOfferQuotesForm').then();
    this.tts.createOffers(offer).subscribe({
      next: () => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
        this.addNote(( this.newQuote ? 'Quote created in' : 'Counter offer sent to') + ' Trucker tools for carrier: ' +
          offer.carrierName + ', amount: $' + offer.amount);
        Swal.fire('Create quote', 'Quote created successfully', 'success').then(() => {
          this.offersEvent.emit(true);
        });
        this.closeOfferQuoteModal();
      },
      error: error => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
        Swal.fire('Create quote', '<i>' + error + '</i>', 'warning');
      }
    });
  }

  callApproveOffer() {
    const carrier = this.getCarrierValue(this.offerQuote?.mcNumber, true);
    if (carrier == null) {
      Swal.fire({
        title: '<div style="font-size: 1.5rem">Out-of-network Carrier. Are you sure to select this quote?</div>',
        icon: 'question',
        html: '<div class="text-center" style="font-size: 1rem">If you select this quote we will send a message to initiate ' +
          'the onboard process to the carrier, and we store it in our system.</div>',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#d33',
        confirmButtonText: '<div style="font-size: 1rem">Send email to onboard carrier and select quote</div>',
        cancelButtonText: 'Close',
      }).then((result) => {
        if (result.isConfirmed) {

          this.spinner.show('spinnerOfferQuotesForm').then();

          const fnc = () => {
            this.spinner.hide('spinnerOfferQuotesForm').then();
            this.onboardEmail.getEmailAttachmentBody();
            this.onboardEmail.sendEmail(false);
          };

          // start onboard carrier
          this.cps.attachCarrier(this.offerQuote?.mcNumber, 'MC', this.carrierSource).subscribe({
            next: () => {
              setTimeout(fnc, 500);
            },
            error: () => {
              // add carrier when onboard fail
              const newCarrier: CarrierDetail = {
                carrierName: this.offerQuote?.carrierName ?? '',
                scac: this.offerQuote?.scacCode ? this.offerQuote.scacCode.toString().toUpperCase() : '',
                mcNumber: this.offerQuote?.mcNumber ?? '',
                dotNumber: null,
                address1: null,
                carrierID: null,
                city: null,
                phone: null,
                postalCode: null,
                state: null,
                tiberID: null,
                onboarded: null,
                inNetworkTT: null
              };

              this.cps.saveCarrier(newCarrier).subscribe({
                next: () => {
                  setTimeout(fnc, 500);
                },
                error: () => {
                  this.spinner.hide('spinnerOfferQuotesForm').then();
                  Swal.fire('Search Carrier', 'Unable to save carrier', 'warning');
                }
              });
            }
          });
        }
      });
    } else {
      this.selectTruckerToolsQuote();
    }
  }

  callRejectOffer() {
    this.spinner.show('spinnerOfferQuotesForm').then();
    this.tts.rejectOffer(this.loadOfferId).subscribe({
      next: () => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
        this.addNote('Quote Rejected in Trucker tools for carrier: ' + (this.offerQuote?.carrierName ?? ''));
        Swal.fire('Reject quote', 'Quote Rejected successfully', 'success').then(() => {
          this.offersEvent.emit(true);
        });
        this.closeOfferQuoteModal();
      },
      error: error => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
        Swal.fire('Reject quote', '<i>' + error + '</i>', 'warning');
      }
    });
  }

  closeOfferQuoteModal() {
    this.offerQuotesForm.reset();
    this.newQuote = false;
    this.loadOfferId = null;
    $('#offerQuotesModal').modal('hide');
  }

  getCarrierList() {
    const carriersOnboard = sessionStorage.getItem('carriersOnboard');
    if (carriersOnboard) {
      this.onboardedCarrierList(JSON.parse(carriersOnboard));
    } else {
      this.cps.getOnboardedCarriers().subscribe({
        next: response => {
          if (response) { sessionStorage.setItem('carriersOnboard', JSON.stringify(response)); }
          this.onboardedCarrierList(response);
        }
      });
    }
  }

  onboardedCarrierList(carriers: any) {
    for (const carrier of carriers) {
      this.carrierList.push(carrier);
    }
    this.carrierList.forEach(value => {
      const mcNumber = value.mcNumber ? 'MC: #' + value.mcNumber + '. ' : '';
      const dotNumber = value.dotNumber ? 'DOT: #' + value.dotNumber : '';
      const descNumbers = mcNumber + dotNumber;
      this.dropdownList.push({
        item: value.carrierName + (descNumbers !== '' ? ' (' + descNumbers + ')' : ''),
        value: value.carrierID?.toString() ?? ''
      });
    });
  }

  setControlValue(value: any, select: boolean) {
    this.rmisFailed = false;
    if (!select) {
      this.offerQuotesForm.get('carrierID')?.setValue(null);
      this.offerQuotesForm.get('carrierName')?.setValue(null);
      this.offerQuotesForm.get('carrierSelected')?.setValue([]);
      this.offerQuotesForm.get('mcNumber')?.setValue(null);
      this.offerQuotesForm.get('carrierScac')?.setValue(null);
      this.offerQuotesForm.get('contactName')?.setValue(null);
      this.offerQuotesForm.get('contactPhone')?.setValue(null);
      this.offerQuotesForm.get('contactEmail')?.setValue(null);
    } else {
      this.offerQuotesForm.get('carrierID')?.setValue(value.value);
      const carrier = this.getCarrierValue(value.value);
      if (carrier?.mcNumber && carrier?.mcNumber !== '') {
        this.spinner.show('spinnerOfferQuotesForm').then();
        if (this.carrierSource === 'RMIS') {
          this.cps.getCarrierFromRmis(carrier.mcNumber).subscribe({
            next: response => {
              this.spinner.hide('spinnerOfferQuotesForm').then();
              this.offerQuotesForm.get('carrierName')?.setValue(response.RMISCarrierStatusExpanded.Carrier?.CompanyName);
              this.offerQuotesForm.get('mcNumber')?.setValue(response.RMISCarrierStatusExpanded.Carrier?.MCNumber);
              const scac = response.RMISCarrierStatusExpanded.CarrierProfile.SCAC ?
                response.RMISCarrierStatusExpanded.CarrierProfile.SCAC.toUpperCase() : '';
              this.offerQuotesForm.get('carrierScac')?.setValue(scac);
              this.offerQuotesForm.get('contactName')?.setValue(response.RMISCarrierStatusExpanded.Carrier?.Contact);
              this.offerQuotesForm.get('contactPhone')?.setValue(response.RMISCarrierStatusExpanded.Carrier?.Phone);
              this.offerQuotesForm.get('contactEmail')?.setValue(response.RMISCarrierStatusExpanded.Carrier?.Email);
            },
            error: () => {
              this.rmisFailed = true;
              this.spinner.hide('spinnerOfferQuotesForm').then();
              this.offerQuotesForm.get('carrierName')?.setValue(carrier?.carrierName);
              this.offerQuotesForm.get('mcNumber')?.setValue(carrier?.mcNumber);
              this.offerQuotesForm.get('carrierScac')?.setValue(carrier?.scac);
            }
          });
        } else {
          this.cps.searchCarrier(carrier.mcNumber, 'MC').subscribe({
            next: response => {
              this.spinner.hide('spinnerOfferQuotesForm').then();
              if (response && response.payee) {
                const payee: Payee = Array.isArray(response.payee) ? response.payee[0] : response.payee;
                this.offerQuotesForm.get('carrierName')?.setValue(payee['@name']);
                this.offerQuotesForm.get('mcNumber')?.setValue(payee.drs_payee['@icc_number']);
                this.offerQuotesForm.get('carrierScac')?.setValue(payee.drs_payee['@scac'] ?? '');
                this.offerQuotesForm.get('contactName')?.setValue('');
                this.offerQuotesForm.get('contactPhone')?.setValue(payee['@phone_number']?.replace(/-/g, ''));
                this.offerQuotesForm.get('contactEmail')?.setValue(payee['@email']);
              } else {
                this.rmisFailed = true;
                this.offerQuotesForm.get('carrierName')?.setValue(carrier?.carrierName);
                this.offerQuotesForm.get('mcNumber')?.setValue(carrier?.mcNumber);
                this.offerQuotesForm.get('carrierScac')?.setValue(carrier?.scac);
              }
            },
            error: () => {
              this.rmisFailed = true;
              this.spinner.hide('spinnerOfferQuotesForm').then();
              this.offerQuotesForm.get('carrierName')?.setValue(carrier?.carrierName);
              this.offerQuotesForm.get('mcNumber')?.setValue(carrier?.mcNumber);
              this.offerQuotesForm.get('carrierScac')?.setValue(carrier?.scac);
            }
          });
        }
      }
    }
  }

  getCarrierValue(value: any, searchByMcNumber = false) {
    let val: CarrierDetail | null = null;
    for (const carrier of this.carrierList) {
      if (searchByMcNumber) {
        if (carrier.mcNumber?.toUpperCase()?.replace('MC', '') == value.toUpperCase().replace('MC', '')) {
          val = carrier;
          break;
        }
      } else {
        if (carrier.carrierID == value) {
          val = carrier;
          break;
        }
      }
    }
    return val;
  }

  onKeyPressEvent(event: any) {
    return event.charCode == 46 || (event.charCode >= 48 && event.charCode <= 57);
  }

  onFocusOutEvent(event: any) {
    const amount = event.target.value;
    if (amount !== null && amount !== '') {
      const quoteAmount = (Math.round(parseFloat(amount.toString()) * 100) / 100).toFixed(2);
      this.offerQuotesForm.get('offerAmount')?.setValue(quoteAmount);
    }
  }

  syncCarrierAndCreateOffer(mcNumber: any, carrierId: any) {
    this.spinner.show('spinnerOfferQuotesForm').then();
    if (this.carrierSource === 'RMIS') {
      this.cps.getCarrierFromRmis(mcNumber).subscribe({
        next: response => {
          if (response.RMISCarrierStatusExpanded.Header.Result === 'SUCCESS') {
            const rmisInfo = response.RMISCarrierStatusExpanded;
            const syncCarrierObject: TruckerToolsCarrier = {
              carrier_name: rmisInfo.Carrier?.CompanyName,
              mc: rmisInfo.Carrier?.MCNumber,
              dot: rmisInfo.Carrier?.DOTNumber,
              scac: rmisInfo.CarrierProfile.SCAC ? rmisInfo.CarrierProfile.SCAC.toUpperCase() : '',
              external_id: carrierId,
              non_usa_mc: false,
              contact_name: rmisInfo.Carrier?.Contact,
              contact_phone: rmisInfo.Carrier?.Phone,
              contact_email: rmisInfo.Carrier?.Email ? rmisInfo.Carrier?.Email : this.offerQuotesForm.get('contactEmail')?.value,
              truck_numbers: rmisInfo.DOTTestingInfo?.Tot_Pwr,
              in_network: true,
              book_it_now: true,
              rejected: null,
              carrierLevel: 1
            };
            this.syncCarrierInNetwork(syncCarrierObject);
          } else {
            this.prequalifyCarrier(mcNumber, carrierId);
          }
        },
        error: error => {
          this.spinner.hide('spinnerOfferQuotesForm').then();
          Swal.fire('Validating Carrier', error, 'warning');
          return;
        }
      });
    } else {
      this.cps.searchCarrier(mcNumber, 'MC').subscribe({
        next: response => {
          if (response && response.payee) {
            const payee: Payee = Array.isArray(response.payee) ? response.payee[0] : response.payee;
            const syncCarrierObject: TruckerToolsCarrier = {
              carrier_name: payee['@name'],
              mc: payee.drs_payee['@icc_number'],
              dot: payee.drs_payee['@dot_number'],
              scac: payee.drs_payee['@scac'] ?? '',
              external_id: carrierId,
              non_usa_mc: false,
              contact_name: '',
              contact_phone: payee['@phone_number']?.replace(/-/g, ''),
              contact_email: payee['@email'] ?? this.offerQuotesForm.get('contactEmail')?.value,
              truck_numbers: payee.drs_payee['@power_units'] ? parseInt(payee.drs_payee['@power_units']) : 0,
              in_network: true,
              book_it_now: true,
              rejected : null,
              carrierLevel: 1
            };
            this.syncCarrierInNetwork(syncCarrierObject);
          } else {
            Swal.fire('Sync Carrier', 'Carrier with MC Number <b>' + mcNumber + '</b> Not found.', 'warning');
            return;
          }
        },
        error: error => {
          this.spinner.hide('spinnerOfferQuotesForm').then();
          Swal.fire('Validating Carrier', error, 'warning');
          return;
        }
      });
    }
  }

  addNote(message: string) {
    const todayDate: Date = new Date();
    todayDate.setSeconds(0);
    const note: Note = {
      notText: message,
      notCognitoUsername: this.userName,
      notTimeStamp: todayDate
    } as Note;
    const shipmentId = this.truckLoad?.shipments ? parseInt(this.truckLoad.shipments[this.truckLoad.shipments.length - 1].shipmentDetail.shipmentID) : 0;
    this.rs.addNote(shipmentId, false, note).subscribe();
  }

  selectTruckerToolsQuote() {
    this.spinner.show('spinnerOfferQuotesForm').then();
    this.tts.approveOffer(this.loadOfferId).subscribe({
      next: () => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
        this.addNote('Quote Selected in Trucker tools for carrier: ' + (this.offerQuote?.carrierName ?? ''));
        Swal.fire('Select quote', 'Quote selected successfully', 'success').then(() => {
          this.offersEvent.emit(true);
        });
        this.closeOfferQuoteModal();
      },
      error: error => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
        Swal.fire('Select quote', '<i>' + error + '</i>', 'warning');
      }
    });
  }

  searchCarrier() {
    const mcNumber = this.newQuote ? this.offerQuotesForm.get('mcNumber')?.value : (this.offerQuote?.mcNumber ?? '');
    if (mcNumber == '') {
      Swal.fire('Search Carrier', 'Carrier MC Number is missing', 'warning');
      return;
    }
    window.open('/SPAs/carriers/onboard/' + mcNumber, '_blank');
  }

  disableCounterOffer() {
    if (!this.newQuote && this.offerQuote) {
      const oldAmount = this.offerQuote.amount;
      const newAmount = this.offerQuotesForm.get('offerAmount')?.value == null || this.offerQuotesForm.get('offerAmount')?.value == ''
        ? '0' : this.offerQuotesForm.get('offerAmount')?.value;
      if (parseFloat(<string>oldAmount) === parseFloat(newAmount)) { return true; }
    }
    return false;
  }

  buildEmailDisplayBodyMessage() {
    const referenceText = 'Thank you for your interest in becoming an approved carrier for IL2000. ' +
      'We look forward to working with you.' + '\n' +
      'To start the process please click on the link below:' + '\n';
    const introMessage = 'https://il2000carriers.rmissecure.com/_s/reg/GeneralRequirementsV2.aspx' + '\n';
    const closingMessage = 'Thank you!' + '\n' + 'IL2000 Team.';

    return referenceText + '\n' + introMessage + '\n' + closingMessage;
  }

  buildEmailHtmlBodyMessage() {
    const referenceText = 'Thank you for your interest in becoming an approved carrier for IL2000. ' +
      'We look forward to working with you.' + '<br>' +
      'To start the process please click on the link below:' + '<br>';
    const introMessage = '<a href="https://il2000carriers.rmissecure.com/_s/reg/GeneralRequirementsV2.aspx" ' +
      'target="_blank">https://il2000carriers.rmissecure.com/_s/reg/GeneralRequirementsV2.aspx</a><br>';
    const closingMessage = 'Thank you!<br>' + 'IL2000 Team.<br>';

    return  referenceText + '<br>' + introMessage + '<br>' + closingMessage;
  }

  prequalifyCarrier(mcNumber: any, carrierId: any) {
    this.cps.qualifyCarrier(mcNumber, 'MC').subscribe({
      next: response => {
        const carrierInfo = response.NonAttachedCarrierStatusRequestAPI.CarrierInfo;
        const syncCarrierObject: TruckerToolsCarrier = {
          carrier_name: carrierInfo.CompanyName,
          mc: carrierInfo.MCNumber,
          dot: carrierInfo.DOTNumber,
          scac: null,
          external_id: carrierId,
          non_usa_mc: false,
          contact_name: carrierInfo.Contact ? carrierInfo.Contact : this.offerQuotesForm.get('contactName')?.value,
          contact_phone: carrierInfo.Phone ? carrierInfo.Phone : this.offerQuotesForm.get('contactPhone')?.value,
          contact_email: carrierInfo.Email ? carrierInfo.Email : this.offerQuotesForm.get('contactEmail')?.value,
          truck_numbers: null,
          in_network: true,
          book_it_now: true,
          rejected: null,
          carrierLevel: 1
        };
        this.syncCarrierInNetwork(syncCarrierObject);
      },
      error: () => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
        Swal.fire('Validating Carrier', 'Carrier not found in RMIS', 'warning');
      },
      complete: async () => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
      }
    });
  }

  syncCarrierInNetwork(syncCarrierObject: any) {
    this.tts.syncCarrier(syncCarrierObject).subscribe({
      next: response => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
        if (response.statusCode.toString() === '200') {
          this.sendCreateOffer();
        } else {
          Swal.fire('Sync Carrier In-Network', 'Something went wrong', 'warning');
          return;
        }
      },
      error: error => {
        this.spinner.hide('spinnerOfferQuotesForm').then();
        Swal.fire('Sync Carrier In-Network', error, 'warning');
        return;
      }
    });
  }
}
