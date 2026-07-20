import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Constants} from '../../../../constants/constants';
import {TrackingService} from '../../../../services/tracking/tracking.service';
import {TruckerToolsService} from '../../../../services/TruckerTools/trucker-tools.service';
import {CarrierProfilingService} from '../../../../services/carrier-profiling/carrier-profiling.service';
import {
  AdditionalField,
  Area,
  CarrierProfile, CertificationStatus,
  Coverage,
  Dot,
  DOTTestingInfo,
  RMISCarrierStatusExpanded
} from '../../../../interfaces/carrier-rmis';
import {Global} from '../../../../common/global';
import {NgxSpinnerService} from 'ngx-spinner';
import Swal from 'sweetalert2';
import {CarrierDetail} from '../../../../interfaces/carrier-detail';
import {TruckerToolsCarrier} from '../../../../interfaces/Trucker-Tools-Carrier';
import {ActivatedRoute} from '@angular/router';
import {Router} from '@angular/router';
import {CarrierInfo} from '../../../../interfaces/carrier-rmis-attach';
import {CarrierPrequalify} from '../../../../interfaces/carrier-prequalify';
import {EmailModal} from '../../../../components/email-modal/email-modal';
import {CarrierMcLeodResponse, Payee} from '../../../../interfaces/carrier-mcleod';
import {environment} from '../../../../../environments/environment';

@Component({
  selector: 'app-carrier-management',
  standalone: false,
  templateUrl: './carrier-management.html',
  styleUrl: './carrier-management.css',
})
export class CarrierManagement implements OnInit, AfterViewInit {

  constructor(private fb: FormBuilder, private ts: TrackingService, private cps: CarrierProfilingService, private tts: TruckerToolsService,
              private spinner: NgxSpinnerService, private route: ActivatedRoute, private router: Router, ) {
    this.mcNumber = this.route.snapshot.paramMap.get('mcNumber');
  }
  @ViewChild(EmailModal) email!: EmailModal;
  @Input() isModal = false;
  @Input() newCarrier = false;
  @Input() onboardCarrier = false;
  @Input() carrierMCNumber: string | null = null;
  @Input() carrierDotNumber: string | null = null;
  @Input() modalNetwotkTT = false;
  @Input() modalCarrierCertified = false;
  @Input() modalCertificationVerified: string | null = null;
  @Input() Data: any;
  @Input() carrierInfo!: CarrierInfo | null;
  @Output() newCarrierEvent = new EventEmitter<any>(true);
  rmisCarrier!: RMISCarrierStatusExpanded | null;
  mcleodCarrier!: Payee;
  carrierManagementForm!: FormGroup;
  yesNoDropdown: string[] = [];
  carrierProfile!: CarrierProfile | null;
  carrierDOT!: Dot | null;
  dotInfo!: DOTTestingInfo | null;
  certificationStatus!: CertificationStatus | null ;
  insuranceInfo!: Coverage[] | null;
  global = Global;
  operatingAreas!: Area[] | null;
  additionalFields!: AdditionalField[] | null;
  mcNumber: string | null = null;
  dotNumber: string | null = null;
  panelExpanded = false;
  panel1Expanded = false;
  stateList: any[] = Constants.STATE_DROPDOWN;
  panel2Expanded = false;
  panel3Expanded = false;
  disableEmailBtn = false;
  disableBtn = false;
  hasInsurance = false;
  isNetworkTTStatus = false;
  carrierCertified = false;
  certificationVerified: string | null = null;
  Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
  meetsClientRules = false;
  carrierSource = environment.CARRIER_SOURCE;

  protected readonly parseFloat = parseFloat;

  ngOnInit(): void {
    this.disableBtn = true;
    Constants.YES_NO_DROPDOWN.forEach(value => {
      this.yesNoDropdown.push(value.item);
    });

    // initiate form groups
    this.carrierManagementForm = this.fb.group({
      carrierName: ['', Validators.required],
      DotNumber: [''],
      McNumber: [''],
      carrierScac: [''],
      TiberID: [''],
      compliance: ['NO'],
      factoring: ['NO'],
      companyContact: this.fb.control(''),
      companyAddress: this.fb.control(''),
      companyEmail: this.fb.control(''),
      companyPhone: this.fb.control(''),
      companyZip: this.fb.control(''),
      companyCity: this.fb.control(''),
      companyState: this.fb.control(''),
      remitName: this.fb.control(''),
      remitAddress: this.fb.control(''),
      remitZip: this.fb.control(''),
      remitCity: this.fb.control(''),
      remitState: this.fb.control(''),
      paymentMethod: this.fb.control(''),
      dispatchName: this.fb.control(''),
      dispatchEmail: this.fb.control(''),
      dispatchPhone: this.fb.control('')
    });

    this.carrierToolTip();

    if (this.mcNumber != null && this.mcNumber !== '') {
      if (this.carrierSource === 'RMIS') {
        this.getCarrierByMCNumberFromRMIS(true);
      } else {
        this.searchCarrier(true, 'MC');
      }
    } else {
      if (this.carrierMCNumber != null && this.carrierMCNumber !== '') {
        this.carrierManagementForm.get('McNumber')?.setValue(this.carrierMCNumber);
      } else if (this.carrierDotNumber != null && this.carrierDotNumber !== '') {
        this.carrierManagementForm.get('DotNumber')?.setValue(this.carrierDotNumber);
      }
    }
  }

  ngAfterViewInit() {
    if (this.Data) {
      if (this.carrierSource === 'RMIS') {
        this.rmisCarrier = this.Data.RMISCarrierStatusExpanded;
        this.setFullRMISCarrierInformation(this.rmisCarrier);
      } else {
        this.setFullCarrierInformation(this.Data);
      }
    } else if (this.carrierInfo) {
      this.setCarrierInformation(this.carrierInfo);
    } else if (this.carrierMCNumber != null && this.carrierMCNumber !== '') {
      this.carrierManagementForm.get('McNumber')?.setValue(this.carrierMCNumber);
    } else if (this.carrierDotNumber != null && this.carrierDotNumber !== '') {
      this.carrierManagementForm.get('DotNumber')?.setValue(this.carrierDotNumber);
    }
  }

  setControlValue(value: any, controlName = '') {
    if (controlName === 'compliance') {
      this.carrierManagementForm.get('compliance')?.setValue(value);
    }
    if (controlName === 'factoring') {
      this.carrierManagementForm.get('factoring')?.setValue(value);
    }
    if (controlName === 'acceptCCPayment') {
      this.carrierManagementForm.get('acceptCCPayment')?.setValue(value);
    }
  }

  setCityStateByZip(zip: string, origin: string) {
    this.ts.getCityStateByZip(zip, 'USA').subscribe(
      (response: any) => {
        if (origin === 'company') {
          this.carrierManagementForm.get('companyCity')?.setValue(response.city);
          this.carrierManagementForm.get('companyState')?.setValue(response.state);
        }
        if (origin === 'remit') {
          this.carrierManagementForm.get('remitCity')?.setValue(response.city);
          this.carrierManagementForm.get('remitState')?.setValue(response.state);
        }
      },
      () => {
        if (origin === 'company') {
          this.carrierManagementForm.get('companyCity')?.setValue('');
          this.carrierManagementForm.get('companyState')?.setValue('');
        }
        if (origin === 'remit') {
          this.carrierManagementForm.get('remitCity')?.setValue('');
          this.carrierManagementForm.get('remitState')?.setValue('');
        }
      }
    );
  }

  getCarrierByMCNumberFromRMIS(paramRoute: boolean = false) {
    if (paramRoute) { this.carrierManagementForm.get('McNumber')?.setValue(this.mcNumber); }
    const mcNumber = this.carrierManagementForm.get('McNumber')?.value;
    if (mcNumber === '') { return; }
    this.resetCarrierForm();
    this.carrierManagementForm.get('McNumber')?.setValue(mcNumber);
    this.disableBtn = true;
    const typeNumber = 'MC';
    const carrierNumber = mcNumber;
    this.spinner.show('spinnerCarrierForm').then();
    this.cps.getCarrierFromRmis(mcNumber).subscribe({
      next: (response) => {
        this.rmisCarrier = null;
        this.carrierInfo = null;
        if (response.RMISCarrierStatusExpanded.Header.Result === 'SUCCESS') {
          this.rmisCarrier = response.RMISCarrierStatusExpanded;
          this.setFullRMISCarrierInformation(this.rmisCarrier);
          this.disableBtn = false;
          this.cps.getCarrier(carrierNumber, typeNumber).subscribe(resp => {
            this.isNetworkTTStatus = resp?.inNetworkTT;
            this.carrierCertified = resp?.isCertified;
            this.certificationVerified = resp?.certificationVerified;
          });
        } else {
          this.prequalifyCarrier(mcNumber, 'MC');
        }
      },
      error: () => {
        this.carrierManagementForm.reset();
        this.spinner.hide('spinnerCarrierForm').then();
        Swal.fire('Search Carrier', 'something\'s wrong', 'error');
      }, complete: () => {
        this.spinner.hide('spinnerCarrierForm').then();
      }
    });
  }

  setFullRMISCarrierInformation(carrier: RMISCarrierStatusExpanded | null) {
    this.hasInsurance = false;
    this.carrierManagementForm.get('carrierName')?.setValue(carrier?.Carrier.CompanyName);
    this.carrierManagementForm.get('McNumber')?.setValue(carrier?.Carrier.MCNumber);
    this.carrierManagementForm.get('carrierScac')?.setValue(carrier?.CarrierProfile.SCAC ?
      carrier.CarrierProfile.SCAC.toUpperCase() : '');
    this.carrierManagementForm.get('DotNumber')?.setValue(carrier?.Carrier.DOTNumber);
    this.carrierManagementForm.get('factoring')?.setValue(carrier?.CarrierProfile.Factory ?
      carrier?.CarrierProfile.Factory.toUpperCase() : 'NO');
    this.carrierManagementForm.get('companyAddress')?.setValue(carrier?.Carrier.Address1);
    this.carrierManagementForm.get('companyCity')?.setValue(carrier?.Carrier.City);
    this.carrierManagementForm.get('companyState')?.setValue(carrier?.Carrier.St);
    this.carrierManagementForm.get('companyZip')?.setValue(carrier?.Carrier.Zip);
    this.carrierManagementForm.get('companyContact')?.setValue(carrier?.Carrier.Contact);
    this.carrierManagementForm.get('companyPhone')?.setValue(carrier?.Carrier.Phone);
    this.carrierManagementForm.get('companyEmail')?.setValue(carrier?.Carrier.Email);
    this.carrierManagementForm.get('remitName')?.setValue(carrier?.Carrier.Payto);
    this.carrierManagementForm.get('remitAddress')?.setValue(carrier?.Carrier.PaytoAddress);
    this.carrierManagementForm.get('remitCity')?.setValue(carrier?.Carrier.PaytoCity);
    this.carrierManagementForm.get('remitState')?.setValue(carrier?.Carrier.PaytoSt);
    this.carrierManagementForm.get('remitZip')?.setValue(carrier?.Carrier.PaytoZip);

    if (carrier?.Carrier.Contacts) {
      const dispatch: any = carrier?.Carrier.Contacts.Contact.find(c => c['@Type'] === 'DISPATCH');
      if (dispatch) {
        this.carrierManagementForm.get('dispatchName')?.setValue(dispatch.CompanyName);
        this.carrierManagementForm.get('dispatchEmail')?.setValue(dispatch.Email);
        this.carrierManagementForm.get('dispatchPhone')?.setValue(dispatch.Phone);
      }
    }

    if (carrier?.CarrierProfile) { this.carrierProfile = carrier?.CarrierProfile; }
    if (carrier?.DOT) { this.carrierDOT = carrier?.DOT; }
    if (carrier?.DOTTestingInfo) { this.dotInfo = carrier?.DOTTestingInfo; }
    if (carrier?.Coverages) { this.insuranceInfo = carrier?.Coverages.Coverage; }
    if (carrier?.CertificationStatus) { this.certificationStatus = carrier?.CertificationStatus; }
    if (carrier?.Coverages.Coverage) {
      const insurance: any = carrier?.Coverages.Coverage.find(c => c.Status === 'Valid' && c.CoverageDescription === 'CARGO');
      if (insurance) {
        this.hasInsurance = true;
      }
    }
    if (carrier?.CarrierProfile.OperatingArea) { this.operatingAreas = carrier?.CarrierProfile.OperatingArea.Area; }

    if (carrier?.CarrierProfile.AdditionalFields &&
      carrier?.CarrierProfile.AdditionalFields.AdditionalField.find(c => c.Description.includes('PreferredLane'))) {
      this.additionalFields = carrier?.CarrierProfile.AdditionalFields.AdditionalField.filter(c => c.Description.includes('PreferredLane'));
    }
  }

  carrierToolTip() {
    // Allow tool tip on btn
    $('#btnSearchCarrier').attr({
      'data-bs-toggle': 'tooltip',
      title: 'Type a MCNumber and click to search',
      'data-placement': 'bottom'
    });

    $('#btnSearchCarrierDot, #btnSearchCarrierDotRmis').attr({
      'data-bs-toggle': 'tooltip',
      title: 'Type a DOT Number and click to search',
      'data-placement': 'bottom'
    });

    // Enable Tool Tip On Hover
    $('[data-bs-toggle="tooltip"]').tooltip({
      trigger: 'hover'
    });
  }

  onClickAttachCarrier() {
    const mcNumber = this.carrierManagementForm.get('McNumber')?.value;
    const DotNumber = this.carrierManagementForm.get('DotNumber')?.value;
    if ((mcNumber === '' || mcNumber == null) && (DotNumber === '' || DotNumber == null)) {
      Swal.fire('Onboarding Carrier', 'To onboarding carrier, please type Mc number or Dot number', 'warning');
      return;
    }

    let typeNumber = 'MC';
    let carrierNumber = mcNumber;
    if (mcNumber === '') {
      typeNumber = 'DOT';
      carrierNumber = DotNumber;
    }

    this.spinner.show('spinnerCarrierForm').then();
    this.cps.onboardingCarrier(carrierNumber, typeNumber).subscribe({
      next: (response) => {
        if (response.RMISAttachCarrier.Header.Result === 'ERROR') {
          Swal.fire('Onboarding Carrier', 'Unable to attach carrier, ' + response.RMISAttachCarrier.Header.Errors.Error, 'warning');
        } else {
          this.carrierManagementForm.reset();
          this.cps.getCarrier(carrierNumber, typeNumber).subscribe({
            next: (resp) => {
              this.newCarrierEvent.emit(resp);
              if (this.isModal) { this.closeNewCarrierModal(); }
            },
            error: () => {
              if (this.isModal) { this.closeNewCarrierModal(); }
            }
          });
          Swal.fire('Onboarding Carrier', 'Carrier onboarded successfully', 'success');
          this.disableBtn = true;
        }
      },
      error: (error: any) => {
        this.spinner.hide('spinnerCarrierForm').then();
        Swal.fire('Onboarding Carrier', error.toString(), 'warning');
        if (this.isModal) { this.closeNewCarrierModal(); }
      },
      complete: () => {
        this.spinner.hide('spinnerCarrierForm').then();
      }
    });
  }

  closeNewCarrierModal() {
    this.carrierManagementForm.reset();
    $('#newCarrierModal').modal('hide');
    $('#carrierMonitoringModal').modal('hide');
    this.disableBtn = true;
  }

  onClickNewCarrier(validate: boolean = true, mailSent: boolean = false) {
    if (validate && !this.carrierManagementForm.valid) {
      return;
    }

    this.spinner.show('spinnerCarrierForm').then();
    const onboard = this.carrierSource === 'MCLEOD' ? this.validatingCarrierMcLeod(this.mcleodCarrier) : false;
    const newCarrier: CarrierDetail = {
      carrierName: this.carrierManagementForm.get('carrierName')?.value,
      scac: this.carrierManagementForm.get('carrierScac')?.value ?
        this.carrierManagementForm.get('carrierScac')?.value.toString().toUpperCase() : '',
      mcNumber: this.carrierManagementForm.get('McNumber')?.value,
      dotNumber: this.carrierManagementForm.get('DotNumber')?.value,
      address1: this.carrierManagementForm.get('companyAddress')?.value,
      carrierID: null,
      city: this.carrierManagementForm.get('companyCity')?.value,
      phone: this.carrierManagementForm.get('companyPhone')?.value,
      postalCode: this.carrierManagementForm.get('companyZip')?.value,
      state: this.carrierManagementForm.get('companyState')?.value,
      tiberID: this.carrierManagementForm.get('TiberID')?.value,
      onboarded: (onboard ? 1 : 0),
      inNetworkTT: null
    };

    this.cps.saveCarrier(newCarrier).subscribe({
      next: (response) => {
        this.closeNewCarrierModal();
        this.spinner.hide('spinnerCarrierForm').then();
        if (this.isModal) {
          if (!mailSent) { this.Toast.fire('Add Carrier', 'Carrier created successfully', 'success'); }
          if (mailSent) { this.Toast.fire('Onboard Carrier', 'invitation successfully sent', 'success'); }
        } else {
          if (!mailSent) { Swal.fire('Add Carrier', 'Carrier created successfully', 'success'); }
          if (mailSent) { Swal.fire('Onboard Carrier', 'invitation successfully sent', 'success'); }
        }
        this.disableBtn = true;
        this.newCarrierEvent.emit(response);
      },
      error: (error: any) => {
        this.spinner.hide('spinnerCarrierForm').then();
        Swal.fire(mailSent ? 'Onboard Carrier' : 'Add Carrier', error.toString(), 'warning');
        if (this.isModal) { this.closeNewCarrierModal(); }
      }
    });
  }

  headerClicked(sectionId: string) {
    if (sectionId === '#certificationHeader') {
      this.panelExpanded = !$(sectionId).hasClass('show');
    }
    if (sectionId === '#carrierHeader') {
      this.panel1Expanded = !$(sectionId).hasClass('show');
    }
    if (sectionId === '#carrierHeader1') {
      this.panel1Expanded = !$(sectionId).hasClass('show');
    }
    if (sectionId === '#carrierHeader2') {
      this.panel2Expanded = !$(sectionId).hasClass('show');
    } else {
      this.panel3Expanded = !$(sectionId).hasClass('show');
    }
  }

  onClickDetachCarrier() {
    const mcNumber = this.carrierManagementForm.get('McNumber')?.value;
    const DotNumber = this.carrierManagementForm.get('DotNumber')?.value;
    if ((mcNumber === '' || mcNumber == null) && (DotNumber === '' || DotNumber == null)) {
      Swal.fire('Onboarding Carrier', 'To Detach carrier, please type Mc number or Dot number', 'warning');
      return;
    }

    let typeNumber = 'MC';
    let carrierNumber = mcNumber;
    if (mcNumber === '') {
      typeNumber = 'DOT';
      carrierNumber = DotNumber;
    }

    this.spinner.show('spinnerCarrierForm').then();
    this.cps.detachCarrier(carrierNumber, typeNumber).subscribe({
      next: (response) => {
        if (response.RMISAttachCarrier.Header.Result === 'ERROR') {
          Swal.fire('Detach Carrier', 'Unable to Detach carrier, ' + response.RMISAttachCarrier.Header.Errors.Error, 'warning');
        } else {
          this.carrierManagementForm.reset();
          Swal.fire('Detach Carrier', 'Carrier Detached successfully', 'success');
        }
      },
      error: (error: any) => {
        this.spinner.hide('spinnerCarrierForm').then();
        Swal.fire('Detach Carrier', error.toString(), 'warning');
      },
      complete: () => {
        this.spinner.hide('spinnerCarrierForm').then();
      }
    });
  }

  onboardingMailSent() {
    this.onClickNewCarrier(false, true);
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

  setCarrierInformation(carrier: CarrierInfo) {
    this.carrierManagementForm.get('carrierName')?.setValue(carrier.CompanyName);
    this.carrierManagementForm.get('McNumber')?.setValue(carrier.MCNumber);
    this.carrierManagementForm.get('carrierScac')?.setValue('');
    this.carrierManagementForm.get('DotNumber')?.setValue(carrier.DOTNumber);
    this.carrierManagementForm.get('factoring')?.setValue('NO');
    this.carrierManagementForm.get('companyAddress')?.setValue(carrier.Address1);
    this.carrierManagementForm.get('companyCity')?.setValue(carrier.City);
    this.carrierManagementForm.get('companyState')?.setValue(carrier.St);
    this.carrierManagementForm.get('companyZip')?.setValue(carrier.Zip);
    this.carrierManagementForm.get('companyContact')?.setValue(carrier.Contact);
    this.carrierManagementForm.get('companyPhone')?.setValue(carrier.Phone);
    this.carrierManagementForm.get('companyEmail')?.setValue(carrier.Email);
  }

  prequalifyCarrier(mcNumber: string, type: string) {
    this.cps.qualifyCarrier(mcNumber, type).subscribe({
      next: (response) => {
        const prequalify: CarrierPrequalify = response;
        this.carrierInfo = prequalify.NonAttachedCarrierStatusRequestAPI.CarrierInfo;
        this.setCarrierInformation(this.carrierInfo);
        if (prequalify.NonAttachedCarrierStatusRequestAPI.MeetsClientRules.Insurance_OK.toUpperCase() === 'NO') {
          this.meetsClientRules = false;
          Swal.fire('Search Carrier', 'Carrier ' + this.carrierInfo.CompanyName + ' Does not meet Insurance requirements', 'warning');
        }
        if (prequalify.NonAttachedCarrierStatusRequestAPI.ExistsInRMISSystem.ExistsInRMISSystem.toUpperCase() === 'NO' &&
          prequalify.NonAttachedCarrierStatusRequestAPI.MeetsClientRules.Insurance_OK.toUpperCase() === 'NO') {
          this.meetsClientRules = false;
          Swal.fire('Search Carrier', 'Carrier ' + this.carrierInfo.CompanyName + ' Does not meet DOT requirements', 'warning');
        }
        this.disableBtn = false;
        this.cps.getCarrier(mcNumber, type).subscribe({
          next: res => {
            this.isNetworkTTStatus = res?.inNetworkTT;
            this.carrierCertified = res?.isCertified;
            this.certificationVerified = res?.certificationVerified;
          }
        });
      },
      error: () => {
        this.carrierManagementForm.reset();
        Swal.fire('Search Carrier', 'Carrier with MC Number <b>' + mcNumber + '</b> Not found in RMIS', 'warning');
      },
      complete: () => {
        this.spinner.hide('spinnerCarrierForm').then();
      }
    });
  }

  getCarrierByDotFromRMIS(paramRoute: boolean = false) {
    if (paramRoute) { this.carrierManagementForm.get('DotNumber')?.setValue(this.dotNumber); }
    const dotNumber = this.carrierManagementForm.get('DotNumber')?.value;
    if (dotNumber === '') { return; }
    this.resetCarrierForm();
    this.carrierManagementForm.get('DotNumber')?.setValue(dotNumber);
    this.spinner.show('spinnerCarrierForm').then();
    this.disableBtn = true;
    const typeNumber = 'DOT';
    this.cps.getCarrierFromRmisByDOT(dotNumber).subscribe({
      next: (response) => {
        this.rmisCarrier = null;
        this.carrierInfo = null;
        if (response.RMISCarrierStatusExpanded.Header.Result === 'SUCCESS') {
          this.rmisCarrier = response.RMISCarrierStatusExpanded;
          this.setFullRMISCarrierInformation(this.rmisCarrier);
          this.cps.getCarrier(dotNumber, typeNumber).subscribe({
            next: resp => {
              this.isNetworkTTStatus = resp?.inNetworkTT;
              this.carrierCertified = resp?.isCertified;
              this.certificationVerified = resp?.certificationVerified;
            }
          });
          this.disableBtn = false;
        } else {
          this.prequalifyCarrier(dotNumber, 'DOT');
        }
      },
      error: () => {
        this.carrierManagementForm.reset();
        this.spinner.hide('spinnerCarrierForm').then();
        Swal.fire('Search Carrier', 'something\'s wrong', 'error');
      },
      complete: () => {
        this.spinner.hide('spinnerCarrierForm').then();
      }
    });
  }

  resetCarrierForm() {
    this.modalNetwotkTT = false;
    this.modalCarrierCertified = false;
    this.modalCertificationVerified = null;
    this.certificationVerified = null;
    this.carrierCertified = false;
    this.meetsClientRules = false;
    this.hasInsurance = false;
    this.rmisCarrier = null;
    this.carrierInfo = null;
    this.carrierProfile = null;
    this.carrierDOT = null;
    this.dotInfo = null;
    this.certificationStatus = null;
    this.insuranceInfo = null;
    this.operatingAreas = null;
    this.additionalFields = null;
    this.mcNumber = null;
    this.dotNumber = null;
    this.disableEmailBtn = true;
    this.disableBtn = true;
    this.carrierManagementForm.reset();
  }

  validateMeetRules() {
    if (!this.meetsClientRules) {
      const fnc = () => {
        Swal.fire({
          title: 'Are you sure you wish to continue onboarding this Carrier?',
          html: '<div style="text-align:justify">This Carrier Does not meet DOT or insurance company requirements.</div>',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Continue'
        }).then((result) => {
          if (result.isConfirmed) {
            this.email.getEmailAttachmentBody();
            $('#emailModalEmailComponent').modal('show');
          } else {
            $('#emailModalEmailComponent').modal('hide');
          }
        });
      };
      setTimeout(fnc, 100);
    }
  }

  syncCarrier(paramRoute: boolean = false) {
    if (paramRoute) { this.carrierManagementForm.get('McNumber')?.setValue(this.mcNumber); }
    const mcNumber = this.carrierManagementForm.get('McNumber')?.value;
    const DotNumber = this.carrierManagementForm.get('DotNumber')?.value;
    if ((mcNumber === '' || mcNumber == null) && (DotNumber === '' || DotNumber == null)) {
      Swal.fire('Sync Carrier', 'Please type Mc number or Dot number', 'warning');
      return;
    }

    let typeNumber = 'MC';
    let carrierNumber = mcNumber;
    if (mcNumber === '') {
      typeNumber = 'DOT';
      carrierNumber = DotNumber;
    }

    if (!this.isModal) {
      this.spinner.show('spinnerCarrierForm').then();
    } else {
      this.spinner.show('spinnerManualQuotesForm').then();
    }

    this.cps.getCarrier(carrierNumber, typeNumber).subscribe({
      next: resp => {
        const carrierID = resp?.carrierID;
        const onboarded = resp?.onboarded;
        const mcNum = resp?.mcNumber;
        const dotNum = resp?.dotNumber;
        if (onboarded === 1) {
          if (this.carrierSource === 'RMIS') {
            this.cps.getCarrierFromRmis(mcNum).subscribe({
              next: (response) => {
                if (response.RMISCarrierStatusExpanded.Header.Result === 'SUCCESS') {
                  const syncCarrierObject: TruckerToolsCarrier = {
                    carrier_name: response.RMISCarrierStatusExpanded.Carrier?.CompanyName,
                    mc: response.RMISCarrierStatusExpanded.Carrier?.MCNumber,
                    dot: response.RMISCarrierStatusExpanded.Carrier?.DOTNumber,
                    scac: response.RMISCarrierStatusExpanded.CarrierProfile.SCAC ?
                      response.RMISCarrierStatusExpanded.CarrierProfile.SCAC.toUpperCase() : '',
                    external_id: carrierID,
                    non_usa_mc: false,
                    contact_name: response.RMISCarrierStatusExpanded.Carrier?.Contact,
                    contact_phone: response.RMISCarrierStatusExpanded.Carrier?.Phone,
                    contact_email: response.RMISCarrierStatusExpanded.Carrier?.Email,
                    truck_numbers: response.RMISCarrierStatusExpanded.DOTTestingInfo?.Tot_Pwr,
                    in_network: true,
                    book_it_now: true,
                    rejected : null,
                    carrierLevel: 1
                  };
                  this.syncCarrierToTT(syncCarrierObject, false);
                } else {
                  if (!this.isModal) {
                    this.spinner.hide('spinnerCarrierForm').then();
                  } else {
                    this.spinner.hide('spinnerManualQuotesForm').then();
                  }
                  Swal.fire('Sync Carrier', response.RMISCarrierStatusExpanded.Header.Errors.Error, 'warning');
                  return;
                }
              },
              error: (error: any) => {
                this.showError(error);
              }
            });
          } else {
            this.cps.searchCarrier(dotNum).subscribe({
              next: (response) => {
                if (response && response.payee) {
                  const payee: Payee = Array.isArray(response.payee) ? response.payee[0] : response.payee;
                  const syncCarrierObject: TruckerToolsCarrier = {
                    carrier_name: payee['@name'],
                    mc: payee.drs_payee['@icc_number'],
                    dot: payee.drs_payee['@dot_number'],
                    scac: payee.drs_payee['@scac'] ?? '',
                    external_id: carrierID,
                    non_usa_mc: false,
                    contact_name: '',
                    contact_phone: payee['@phone_number']?.replace(/-/g, ''),
                    contact_email: payee['@email'],
                    truck_numbers: payee.drs_payee['@power_units'] ? parseInt(payee.drs_payee['@power_units']) : 0,
                    in_network: true,
                    book_it_now: true,
                    rejected : null,
                    carrierLevel: 1
                  };
                  this.syncCarrierToTT(syncCarrierObject, false);
                } else {
                  if (!this.isModal) {
                    this.spinner.hide('spinnerCarrierForm').then();
                  } else {
                    this.spinner.hide('spinnerManualQuotesForm').then();
                  }
                  Swal.fire('Sync Carrier', 'Carrier with DOT Number <b>' + dotNum + '</b> Not found.', 'warning');
                  return;
                }
              },
              error: (error: any) => {
                this.showError(error);
              }
            });
          }
        } else {
          this.showError('Unable to fetch Onboarded value');
        }
      },
      error: (error: any) => {
        this.showError(error);
      }
    });
  }

  rejectCarrier(paramRoute: boolean = false) {
    if (paramRoute) { this.carrierManagementForm.get('McNumber')?.setValue(this.mcNumber); }
    const mcNumber = this.carrierManagementForm.get('McNumber')?.value;
    const DotNumber = this.carrierManagementForm.get('DotNumber')?.value;
    if ((mcNumber === '' || mcNumber == null) && (DotNumber === '' || DotNumber == null)) {
      Swal.fire('Sync Carrier', 'Please type Mc number or Dot number', 'warning');
      return;
    }

    let typeNumber = 'MC';
    let carrierNumber = mcNumber;
    if (mcNumber === '') {
      typeNumber = 'DOT';
      carrierNumber = DotNumber;
    }

    if (!this.isModal) {
      this.spinner.show('spinnerCarrierForm').then();
    } else {
      this.spinner.show('spinnerManualQuotesForm').then();
    }

    this.cps.getCarrier(carrierNumber, typeNumber).subscribe({
      next: resp => {
        const carrierID = resp?.carrierID;
        const onboarded = resp?.onboarded;
        const mcNum = resp?.mcNumber;
        const dotNum = resp?.dotNumber;
        if (onboarded === 1) {
          if (this.carrierSource === 'RMIS') {
            this.cps.getCarrierFromRmis(mcNum).subscribe({
              next: (response) => {
                if (response.RMISCarrierStatusExpanded.Header.Result === 'SUCCESS') {
                  const syncRejectObject: TruckerToolsCarrier = {
                    carrier_name: response.RMISCarrierStatusExpanded.Carrier?.CompanyName,
                    mc: response.RMISCarrierStatusExpanded.Carrier?.MCNumber,
                    dot: response.RMISCarrierStatusExpanded.Carrier?.DOTNumber,
                    scac: response.RMISCarrierStatusExpanded.CarrierProfile.SCAC ?
                      response.RMISCarrierStatusExpanded.CarrierProfile.SCAC.toUpperCase() : '',
                    external_id: carrierID,
                    non_usa_mc: false,
                    contact_name: response.RMISCarrierStatusExpanded.Carrier?.Contact,
                    contact_phone: response.RMISCarrierStatusExpanded.Carrier?.Phone,
                    contact_email: response.RMISCarrierStatusExpanded.Carrier?.Email,
                    truck_numbers: response.RMISCarrierStatusExpanded.DOTTestingInfo?.Tot_Pwr,
                    in_network: true,
                    book_it_now: true,
                    rejected: -1,
                    carrierLevel: 1
                  };
                  this.syncCarrierToTT(syncRejectObject, true);
                }
              },
              error: (error: any) => {
                this.showError(error);
              }
            });
          } else {
            this.cps.searchCarrier(dotNum).subscribe({
              next: (response) => {
                if (response && response.payee) {
                  const payee: Payee = Array.isArray(response.payee) ? response.payee[0] : response.payee;
                  const syncRejectObject: TruckerToolsCarrier = {
                    carrier_name: payee['@name'],
                    mc: payee.drs_payee['@icc_number'],
                    dot: payee.drs_payee['@dot_number'],
                    scac: payee.drs_payee['@scac'] ?? '',
                    external_id: carrierID,
                    non_usa_mc: false,
                    contact_name: '',
                    contact_phone: payee['@phone_number']?.replace(/-/g, ''),
                    contact_email: payee['@email'],
                    truck_numbers: payee.drs_payee['@power_units'] ? parseInt(payee.drs_payee['@power_units']) : 0,
                    in_network: true,
                    book_it_now: true,
                    rejected : -1,
                    carrierLevel: 1
                  };
                  this.syncCarrierToTT(syncRejectObject, true);
                }
              },
              error: (error: any) => {
                this.showError(error);
              }
            });
          }
        } else {
          this.showError('Unable to fetch Onboarded value');
        }
      },
      error: (error: any) => {
        this.showError(error);
      }
    });
  }

  setFullCarrierInformation(carrier: CarrierMcLeodResponse) {
    const payee: Payee = Array.isArray(carrier.payee) ? carrier.payee[0] : carrier.payee;
    this.hasInsurance = false;
    this.carrierManagementForm.get('carrierName')?.setValue(payee['@name']);
    this.carrierManagementForm.get('McNumber')?.setValue(payee.drs_payee['@icc_number']);
    this.carrierManagementForm.get('carrierScac')?.setValue(payee.drs_payee['@scac'] ?? '');
    this.carrierManagementForm.get('DotNumber')?.setValue(payee.drs_payee['@dot_number']);
    this.carrierManagementForm.get('factoring')?.setValue(payee.drs_payee['@pay_factoring_company'] === 'Y' ? 'YES' : 'NO');
    this.carrierManagementForm.get('companyAddress')?.setValue(payee['@address1']);
    this.carrierManagementForm.get('companyCity')?.setValue(payee['@city']);
    this.carrierManagementForm.get('companyState')?.setValue(payee['@state']);
    this.carrierManagementForm.get('companyZip')?.setValue(payee['@zip_code']);
    this.carrierManagementForm.get('companyContact')?.setValue(payee['@name']);
    this.carrierManagementForm.get('companyPhone')?.setValue(payee['@phone_number'] ? payee['@phone_number'].replace(/-/g, '') : '');
    this.carrierManagementForm.get('companyEmail')?.setValue(payee['@email']);

    if (payee.drs_payee['@cargo_ins_on_file'] === 'Y' &&
      (payee.drs_payee['@cargo_ins_amount'] !== '' && parseFloat(payee.drs_payee['@cargo_ins_amount']) > 0)) {
      this.hasInsurance = true;
    }
    this.mcleodCarrier = payee;
  }

  searchCarrier(paramRoute: boolean = false, typeNumber = 'DOT') {
    if (paramRoute) {
      if (typeNumber === 'DOT') { this.carrierManagementForm.get('DotNumber')?.setValue(this.mcNumber); }
      if (typeNumber !== 'DOT') { this.carrierManagementForm.get('McNumber')?.setValue(this.mcNumber); }
    }
    const carrierNumber = typeNumber === 'DOT' ? this.carrierManagementForm.get('DotNumber')?.value :
      this.carrierManagementForm.get('McNumber')?.value;
    if (carrierNumber === '') { return; }
    this.resetCarrierForm();
    if (typeNumber === 'DOT') { this.carrierManagementForm.get('DotNumber')?.setValue(carrierNumber); }
    if (typeNumber !== 'DOT') { this.carrierManagementForm.get('McNumber')?.setValue(carrierNumber); }
    this.spinner.show('spinnerCarrierForm').then();
    this.disableBtn = true;
    this.cps.searchCarrier(carrierNumber, typeNumber).subscribe({
      next: (response) => {
        this.carrierInfo = null;
        if (response && response.payee) {
          this.cps.getCarrier(carrierNumber, typeNumber).subscribe({
            next: resp => {
              this.isNetworkTTStatus = resp?.inNetworkTT;
              this.carrierCertified = resp?.isCertified;
              this.certificationVerified = resp?.certificationVerified;
              this.setFullCarrierInformation(response);
            }, error: () => {
              this.setFullCarrierInformation(response);
            }
          });
          this.disableBtn = false;
        } else {
          Swal.fire('Search Carrier', 'Carrier with ' + typeNumber + ' Number <b>' + carrierNumber + '</b> Not found.', 'warning');
          return;
        }
      },
      error: () => {
        this.carrierManagementForm.reset();
        this.spinner.hide('spinnerCarrierForm').then();
        Swal.fire('Search Carrier', 'something\'s wrong', 'error');
      },
      complete: () => {
        this.spinner.hide('spinnerCarrierForm').then();
      }
    });
  }

  validatingCarrierMcLeod(data: Payee) {
    let carrierFlag = true;
    const dotInfo = data.drs_payee;
    if (dotInfo['@highway_id_number'] && dotInfo['@highway_id_number'] !== '' && dotInfo['@highway_status'] === 'O') {
    } else {
      carrierFlag = false;
    }
    if (dotInfo['@highway_rule_assessment'] &&
      (dotInfo['@highway_rule_assessment'] === 'P' || dotInfo['@highway_rule_assessment'] === 'A')) {
    } else {
      carrierFlag = false;
    }
    if (dotInfo['@no_dispatch'] && dotInfo['@no_dispatch'] === 'N') {
    } else {
      carrierFlag = false;
    }
    if (dotInfo['@perform_rating'] && dotInfo['@perform_rating'] !== '') {
      carrierFlag = false;
    }
    return carrierFlag;
  }

  syncCarrierToTT(syncCarrierObject: TruckerToolsCarrier, isNetworkTTStatus: boolean) {
    this.tts.syncCarrier(syncCarrierObject).subscribe({
      next: (response) => {
        if (response.statusCode.toString() === '200') {
          if (!this.isModal) {
            this.spinner.hide('spinnerCarrierForm').then();
            Swal.fire({icon: 'success', title: 'Sync Carrier', html: response.message})
              .then((result) => {
                if (result.isConfirmed) {
                  this.isNetworkTTStatus = isNetworkTTStatus;
                  this.router.navigate(['/SPAs/carriers']).then();
                  return;
                }
              });
          } else {
            this.spinner.hide('spinnerManualQuotesForm').then();
            Swal.fire({icon: 'success', title: 'Sync Carrier', html: response.message})
              .then((result) => {
                if (result.isConfirmed) {
                  $('#carrierMonitoringModal').modal('hide');
                  return;
                }
              });
          }
        } else {
          if (!this.isModal) {
            this.spinner.hide('spinnerCarrierForm').then();
          } else {
            this.spinner.hide('spinnerManualQuotesForm').then();
          }
          Swal.fire('Sync Carrier', 'Something went wrong', 'warning');
          return;
        }
      },
      error: (error: any) => {
        this.showError(error);
      }
    });
  }

  showError(error: any) {
    if (!this.isModal) {
      this.spinner.hide('spinnerCarrierForm').then();
      Swal.fire('Sync Carrier', error, 'warning');
      return;
    } else {
      this.spinner.hide('spinnerManualQuotesForm').then();
      Swal.fire({icon: 'warning', title: 'Sync Carrier', html: error}).then((result) => {
        if (result.isConfirmed) {
          $('#carrierMonitoringModal').modal('hide');
          return;
        }
      });
    }
  }
}
