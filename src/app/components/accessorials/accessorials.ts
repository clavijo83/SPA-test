import {Component, forwardRef, input, OnInit, output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from "@angular/forms";
import {Constants} from "../../constants/constants";
import {UtilityService} from '../../services/utility/utility.service';
import {TLManualQuote} from "../../interfaces/manual-quote";
import Swal from "sweetalert2";

@Component({
  selector: 'app-accessorials',
  standalone: false,
  templateUrl: './accessorials.html',
  styleUrl: './accessorials.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AccessorialsComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AccessorialsComponent),
      multi: true
    }
  ]
})
export class AccessorialsComponent implements OnInit {
  accId = null
  accessorialForm!: FormGroup;
  firstAccessorialsChecked = false;
  accessorialTypes = {};
  numOfStops = input<number[]>([]);
  truckFees = input<any>([]);
  shipmentType = input<'LTL' | 'Truckload'>('LTL');
  getTruckFees = output<any>();
  quotes = input<any>(null);
  quotesNotUsed = input<TLManualQuote[]>([]);
  truckNotUsedEvent = output<any>();
  currencyType = input('');
  carCurrencyType = input('');
  disabled = input(false);
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

  constructor(private ab: FormBuilder, public utilityservice: UtilityService) {
  }

  get accessorials() {
    return this.accessorialForm.get('accessorials') as FormArray;
  }

  get accessorialTypesList() {
    return Constants.ACCESSORIAL_TYPES_DROPDOWN
  }

  get feeIncurredAtList() {
    return Constants.FEE_INCURRED_AT_DROPDOWN
  }

  ngOnInit() {
    this.accessorialTypes = Object.assign({}, ...Constants.ACCESSORIAL_TYPES_DROPDOWN.map((x) => ({[x.item]: x.value})));
    let accessorialRows = [];
    if (this.truckFees().length > 0) {
      this.truckFees().forEach((d: any) => {
        accessorialRows.push(this.getAccessorials(d['truckFeesId'], d['truckId'], d['carrierCharge'],
          d['customerCharge'], d['accessorialTypeId'], d['amount'], d['sellAmount'], d['truckQuoteId'],
          d['carrierId'], d['feeIncurredAt'], d['feeStartTime'], d['feeEndTime'], d['stopNum'], (!d['truckQuoteId'])));
      });
    } else {
      accessorialRows.push(this.getAccessorials());
    }

    this.accessorialForm = this.ab.group({
      accessorials: this.ab.array(accessorialRows)
    });

    if (this.accessorials.length == 1 && (this.accessorials.at(0).get('accessorialTypeId')?.value == null || this.accessorials.at(0).get('accessorialTypeId')?.value == '')){
      setTimeout(() => { $("#accessorialTypeId0").prop("selectedIndex", 0) }, 1000)
    }
  }

  checkTwoDecimals(event: any) {
    const reg = /^-?\d*(\.\d{0,2})?$/;
    let input = event.target.value + String.fromCharCode(event.charCode);

    if (!reg.test(input)) {
      event.preventDefault();
    }
  }

  addAccessorials() {
    this.accessorials.push(this.getAccessorials());
    this.utilityservice.isrequired.push(false)
    setTimeout(() => { $("#accessorialTypeId" + (this.accessorials.length - 1)).prop("selectedIndex", 0) }, 100)
  }

  onChange(event: any, controlName = '', index: number) {
    let value = event.target.value
    if (controlName === 'accessorialTypeId') {
      if (value != '') $('#accessorialTypeId' + index).removeClass('is-invalid')
      if (value != '9' && value != 9) {
        this.accessorials.at(index).get('truckQuoteId')?.setValue(null, {onlySelf: false, emmitEvent: true})
        this.accessorials.at(index).get('carrierId')?.setValue(null, {onlySelf: false, emmitEvent: true})
        this.truckNotUsedEvent.emit(null)
      }
      this.edit(index, 'accessorialTypeId')
      this.ratesgridcheck()
    } else if (controlName === 'amount') {
      this.accessorials.at(index).get('carrierCharge')?.setValue(false, {onlySelf: false, emmitEvent: true});
      if (value !== ''){
        if (parseFloat(value) > 0) {
          this.accessorials.at(index).get('carrierCharge')?.setValue(true, {onlySelf: false, emmitEvent: true});
        }
        $('#amount' + index).removeClass('is-invalid')
      }
      this.edit(index, 'amount')
      this.ratesgridcheck()
    } else if (controlName === 'sellAmount') {
      this.accessorials.at(index).get('customerCharge')?.setValue(false, {onlySelf: false, emmitEvent: true});
      if (value !== ''){
        if (parseFloat(value) > 0) {
          this.accessorials.at(index).get('customerCharge')?.setValue(true, {onlySelf: false, emmitEvent: true});
        }
        $('#sellAmount' + index).removeClass('is-invalid')
      }
      this.edit(index, 'sellAmount')
      this.ratesgridcheck()
    } else if (controlName === 'truckQuoteId') {
      if (value){
        let quoteSelected = false
        for (let i = 0; i < this.accessorials.length; i++) {
          if (i != index && this.accessorials.at(i).get('truckQuoteId')?.value && this.accessorials.at(i).get('truckQuoteId')?.value == value){
            this.Toast.fire({
              icon: 'warning',
              title: 'Quote has already been selected.'
            })
            this.accessorials.at(index).get('truckQuoteId')?.setValue(null, {onlySelf: false, emmitEvent: true})
            this.accessorials.at(index).get('carrierId')?.setValue(null, {onlySelf: false, emmitEvent: true})
            quoteSelected = true
            break
          }
        }
        if (quoteSelected) return
        this.accessorials.at(index).get('carrierId')?.setValue(this.quotes().carrierID, {onlySelf: false, emmitEvent: true})
        this.truckNotUsedEvent.emit('Quote Id:' + this.quotes().quoteID + (this.quotes().carrierName && this.quotes().carrierName != '' ? ' - Carrier: ' + this.quotes().carrierName + ' ' + this.quotes().mcNumber : ' - No Carrier') + ', marked as Truck not Used')
      }
    }
    this.utilityservice.btnRate = true;
    this.getTruckFees.emit(this.accessorials.value)
  }

  checkAmount(index: number) {
    if (this.accessorials.at(index).get('amount')?.value === 0) return '0'
    return this.accessorials.at(index).get('amount')?.value ? this.accessorials.at(index).get('amount')?.value.toString() : null
  }

  checkType(index: number) {
    return this.accessorials.at(index).get('accessorialTypeId')?.value
  }

  checkSellAmount(index: number) {
    if (this.accessorials.at(index).get('sellAmount')?.value === 0) return '0'
    return this.accessorials.at(index).get('sellAmount')?.value ? this.accessorials.at(index).get('sellAmount')?.value.toString() : null
  }

  ratesgridcheck() {
    for (let i in this.utilityservice.isrequired) {
      if (this.utilityservice.isrequired[i]) {
        this.utilityservice.check = true;
        return
      }
      this.utilityservice.check = false;
    }
  }

  edit(index: number, control: string) {
    if (control === 'amount' || control === 'sellAmount' || control === 'accessorialTypeId' || control === 'truckQuoteId') {
      if (this.checkType(index) !== null && this.checkType(index) !== '' && ((this.checkAmount(index) === null || this.checkAmount(index) === '') || (this.checkSellAmount(index) === null || this.checkSellAmount(index) === ''))) {
        this.utilityservice.isrequired[index] = true;
      }
      if (this.checkType(index) == null || this.checkType(index) === '' && (this.checkAmount(index) !== '' && this.checkAmount(index) !== null || this.checkSellAmount(index) !== '' && this.checkSellAmount(index) !== null)) {
        this.utilityservice.isrequired[index] = true;
      }
      this.checkforfalse(index)
    }
  }

  checkforfalse(index: number) {
    if ((this.checkType(index) == '' || this.checkType(index) == null) && (this.checkAmount(index) == '' || this.checkAmount(index) == null)
      && (this.checkSellAmount(index) == '' || this.checkSellAmount(index) == null)) {
      this.utilityservice.isrequired[index] = false;
    }
    else if (this.checkType(index) != null && this.checkType(index) != '' && ((this.checkAmount(index) != '' && this.checkAmount(index) != null)
      && (this.checkSellAmount(index) != '' && this.checkSellAmount(index) != null)) ) {
      this.utilityservice.isrequired[index] = false;
    }
  }

  removeItem(index: number) {
    let emptyProductControl = this.ab.group({
      truckFeesId: [null],
      truckId: [null],
      carrierCharge: [false],
      customerCharge: [false],
      accessorialTypeId: [''],
      amount: [''],
      sellAmount: [''],
      truckQuoteId: [null],
      carrierId: [null],
      feeIncurredAt: [''],
      feeStartTime: [''],
      feeEndTime: [''],
      stopNum: [0],
      quoteIdEmpty: [true]
    });

    if (this.accessorials.length > 1) {
      this.utilityservice.isrequired.splice(index, 1)
      this.checkforfalse(index)
      this.accessorials.removeAt(index);
    } else {
      this.accessorials.setControl(0, emptyProductControl);
      this.utilityservice.isrequired[0] = false;
      this.firstAccessorialsChecked = false;
      setTimeout(() => { $("#accessorialTypeId0").prop("selectedIndex", 0) }, 100)
    }
    this.ratesgridcheck()
  }

  private getAccessorials(truckFeesId: number | null = null, truckId: number | null = null, carrierCharge = false, customerCharge = false, accessorialType: number | null = null, amount = '', sellAmount = '', truckQuoteId: number | null = null,
                          carrierId: number | null = null, feeIncurredAt = '', feeStartTime = '', feeEndTime = '', stopNum = 0, quoteIdEmpty = true) {
    return this.ab.group({
      truckFeesId: [truckFeesId],
      truckId: [truckId],
      carrierCharge: [carrierCharge],
      customerCharge: [customerCharge],
      accessorialTypeId: [accessorialType],
      amount: [amount],
      sellAmount: [sellAmount],
      truckQuoteId: [truckQuoteId],
      carrierId: [carrierId],
      feeIncurredAt: [feeIncurredAt],
      feeStartTime: [feeStartTime],
      feeEndTime: [feeEndTime],
      stopNum: [stopNum],
      quoteIdEmpty: [quoteIdEmpty]
    });
  }

  showFeeIncurredField(index: number){
    let feeId = this.accessorials.at(index).get('accessorialTypeId')?.value
    return feeId != null && (feeId.toString() == '2' || feeId.toString() == '3' || feeId.toString() == '7');
  }

  showFeeTimesField(index: number){
    let feeId = this.accessorials.at(index).get('accessorialTypeId')?.value
    return feeId != null && feeId.toString() == '2';
  }

  checkNegative(index: number, controlName: string, event: any) {
    let feeId = this.accessorials.at(index).get('accessorialTypeId')?.value
    if (feeId.toString() == '12'){
      let value = event.target.value
      if (value && value != ''){
        if (Math.sign(parseFloat(value)) == 1){
          this.accessorials.at(index).get(controlName)?.setValue('-' + value)
          this.getTruckFees.emit(this.accessorials.value)
        }
      }
    }
  }
}
