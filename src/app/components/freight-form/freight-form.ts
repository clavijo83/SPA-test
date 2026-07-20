import {
  Component,
  forwardRef,
  input,
  OnChanges,
  OnInit,
  output,
  ViewChild
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators
} from '@angular/forms';
import {DataTable} from '../data-table/data-table';
import {Product} from '../../interfaces/product';
import {Constants} from '../../constants/constants';
import {RateRequestLineItem} from '../../interfaces/rate-request-line-item';
import {LineItem2, LineItem} from '../../interfaces/line-item';
import {MileageService} from '../../services/mileage/mileage.service';
import {DensityService} from '../../services/density/density.service';
import {LinearFootService} from '../../services/linear-foot/linear-foot.service';
import {Dropdown} from '../../interfaces/dropdown';
import {UtilityService} from '../../services/utility/utility.service';

@Component({
  selector: 'app-freight-form',
  standalone: false,
  templateUrl: './freight-form.html',
  styleUrl: './freight-form.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FreightForm),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => FreightForm),
      multi: true
    }
  ]
})
export class FreightForm implements OnInit, OnChanges {
  @ViewChild(DataTable) dt!: DataTable;
  totalHUSum = 0;
  totalPiecesSum = 0;
  totalLbsSum = 0;
  myFormValueChanges$: any;
  freightForm!: FormGroup;
  productsToAdd: Product[] = [] as Product[];
  firstFreightChecked = false;
  lineItems = input<any[]>([]);
  clientHideSuggestedClass = input(false);
  productList = input<Product[]>([]);
  stops = input<any[]>([]);
  shipmentType = input('LTL');
  shipmentSubType = input<'Standard' | 'Multileg' | 'Dedicated Truck'>('Standard');
  disabled = input(false);
  multiStopRequired = input(false);
  productColumns = [
    {
      title: 'Code',
      data: 'code',
      orderable: true,
      className: 'text-left',
      render(data: any) {
        return data.toUpperCase();
      }
    },
    {
      title: 'Description',
      data: 'description',
      orderable: true,
      className: 'text-left'
    },
    {
      title: 'Class',
      data: 'productClass',
      orderable: true
    },
    {
      title: 'NMFC',
      data: 'nmfc',
      orderable: true
    },
  ];
  rateRequestLineItems: RateRequestLineItem[] = [];
  getLineItems = output<any>();
  mileage = 0;
  linearFeet = 0;
  totalUnitWeight = 0;
  totalCubicFeet = 0;
  totalDensity = 0;
  onUncheckedLineItems = output<any>();
  onAddNewFreight = output<any>();
  firstItemsLoaded = false;
  shipmentsEdit = input(false);
  prevLineItems: LineItem2[] = [];
  stopId = input('');
  showTotals = input(true);
  linearFeetLoaded = false;
  isMinimum: boolean[] = [true];

  constructor(private fb: FormBuilder, private ms: MileageService, private ds: DensityService, private lfs: LinearFootService,
              private us: UtilityService) {
  }

  get freights() {
    return this.freightForm?.get('freights') as FormArray;
  }

  get productItemList() {
    const productItemList: Dropdown[] = [];
    this.productList()?.forEach(value => {
      // Trim spaces for code and productID before pushing to productItemList
      const trimmedCode = value.code.toString().trim();
      const trimmedProductID = value.productID.toString().trim();
      // Check if the trimmed code is not an empty string before pushing to productItemList
      if (trimmedCode !== '') {
        productItemList.push({ item: trimmedCode, value: trimmedProductID });
      }
    });
    return productItemList;
  }

  get classDropdownValues() {
    const classDropdown: string[] = [];
    Constants.CLASS_DROPDOWN.forEach(value => {
      classDropdown.push(value.item);
    });
    return classDropdown;
  }

  get unitTypeDropdownValues() {
    const unitType: string[] = [];
    Constants.UNIT_TYPE_DROPDOWN.forEach(value => {
      if (this.shipmentType() === 'LTL' && value.item === 'TRUCK') {
        return;
      } else {
        unitType.push(value.item);
      }
    });
    return unitType;
  }

  ngOnInit() {
    if (this.lineItems() != undefined && this.lineItems().length !== 0) {
      this.freightForm = this.fb.group({
        freights: this.fb.array([])
      });
      this.setInitialLineItems(this.lineItems());
      this.updateTotals(this.freights.value);
    } else {
      this.freightForm = this.fb.group({
        freights: this.fb.array([
          this.getFreight()
        ])
      });
    }

    this.myFormValueChanges$ = this.freightForm.get('freights')?.valueChanges.subscribe(val => {
      if (this.shipmentsEdit() && !this.firstItemsLoaded) {
      } else {
        this.updateTotals(val);
        this.getSuggestedClasses();
        this.getLineItems.emit(this.freights.value);
      }
    });
  }

  ngOnChanges(): void {
    if (this.freights && this.shipmentsEdit() && !this.firstItemsLoaded && this.lineItems().length > 0) {
      this.firstItemsLoaded = true;
      this.updateTotals(this.freights.value);
    }
  }

  addFreights() {
    this.isMinimum.push(true);
    this.freights.push(this.getFreight());
    const index = this.freights.length;
    const val = {item: 'Do NOT stack line item ' + index, remove: false};
    this.onAddNewFreight.emit(val);
  }

  removeItem(index: number) {
    const emptyProductControl = this.fb.group({
      productID: [''],
      item: [''],
      description: [''],
      nmfcNumber: [''],
      classNumber: (this.shipmentType() === 'LTL' ? ['', Validators.required] : ['']),
      hm: [0],
      unitNumber: (this.stopId() !== null && this.stopId() !== '' ? [''] : ['', [Validators.required, Validators.min(1)]]),
      unitType: (this.stopId() !== null && this.stopId() !== '' ? ['PALLETS'] : ['PALLETS', Validators.required]),
      piecesNumber: (this.stopId() !== null && this.stopId() !== '' ? [''] : ['', [Validators.required, Validators.min(1)]]),
      piecesInputOne: [''],
      piecesInputTwo: (this.stopId() !== null && this.stopId() !== '' ? [''] : ['', [Validators.required, Validators.min(1)]]),
      length: [''],
      width: [''],
      height: [''],
      stackChk: [''],
      sameSkid: [''],
      location: (this.stopId() !== null && this.stopId() !== '' ? [''] : ['Final Destination'])
    });

    for (let i = 0; i < this.freights.length; i++) {
      this.onControlClick(this.stopId() + 'stackChk' + i, 'Do NOT stack line item ', i, true);
      this.onControlClick(this.stopId() + 'sameSkid' + i, 'Same Skid line item ', i, true);
    }

    // If there is only 1 line of freight, when the user clicks "x", then clear the fields
    // If there are more than 1 line of freight, allow the user to delete line 1 when "x" is clicked
    if (this.freights.length > 1) {
      this.freights.removeAt(index);
      this.isMinimum.splice(index, 1);
      for (let i = 0; i < this.freights.length; i++) {
        this.onControlClick(this.stopId() + 'stackChk' + i, 'Do NOT stack line item ', i);
        this.onControlClick(this.stopId() + 'sameSkid' + i, 'Same Skid line item ', i);
      }
    } else {
      this.freights.setControl(0, emptyProductControl);
      this.firstFreightChecked = false;
    }
  }

  /**
   * Update totals as soon as something changed on a freight group
   */
  updateTotals(freights: any) {
    this.totalHUSum = 0;
    this.totalPiecesSum = 0;
    this.totalLbsSum = 0;

    for (const i in freights) {
      const totalHU = freights[i].unitNumber;
      const totalPieces = freights[i].piecesNumber;
      const totalLbs = freights[i].piecesInputTwo;

      // update total price for all units
      this.totalHUSum += totalHU;
      this.totalPiecesSum += totalPieces;
      this.totalLbsSum += totalLbs;
    }

    // Calculate Totals
    if (this.freights.value.find((item: { unitType: string; }) => item.unitType == 'TRUCK')) {
      this.linearFeet = 53;
      this.prevLineItems = [];
    } else {
      this.calculateLinearFeet();
    }
    this.calculateTotalUnitWeight();
    this.calculateTotalCubicFeet();
    this.calculateTotalDensity();
  }

  setLineItemsForEdit(lineItems: LineItem[]) {
    this.isMinimum = [];
    for (const items of lineItems) {
      const productControl = this.fb.group({
        productID: [items.productID],
        item: [items.productCode],
        description: [items.productDescription],
        nmfcNumber: [items.nmfc],
        classNumber: (this.shipmentType() === 'LTL' ? [items.freightClass, Validators.required] : [items.freightClass]),
        hm: [items.hazmat],
        unitNumber: [items.handlingUnits, Validators.required],
        unitType: [items.unitType, Validators.required],
        piecesNumber: [items.pieces, Validators.required],
        piecesInputOne: [items.unitWeight],
        piecesInputTwo: [items.totalWeight, Validators.required],
        length: [items.length],
        width: [items.width],
        height: [items.height],
        stackChk: [items.stackable],
        sameSkid: [items.sameSkid],
        location: [items.location]
      });
      this.isMinimum.push(!items.sameSkid);
      // First freight item, set instead of push
      if (this.freights.length === 1 && !this.firstFreightChecked) {
        this.freights.setControl(0, productControl);
        // Identifies that first freight has been set since incrementing length will cause issues
        this.firstFreightChecked = true;
      } else {
        this.freights.push(productControl);
      }
    }
  }

  setInitialLineItems(lineItems: any) {
    // ADD FORM GROUP TO FROM ARRAY
    lineItems.forEach((value: any) => {
      this.isMinimum.push(true);
      this.freights.push(
        this.getFreight(
          value.productID , // productionID
          value.productCode, // item
          value.productDescription, // description
          value.nmfc, // nmfcNumber
          value.freightClass, // class
          value.hazmat, // hm
          value.handlingUnits, // units
          value.unitType, // unitType
          value.pieces ? value.pieces : value.handlingUnits, // pieces
          (this.us.isQuickRates) ? (value.weight / value.handlingUnits) : value.unitWeight, // CALC LBS/Units = (total weight/hu)/
          (this.us.isQuickRates) ? value.weight : value.totalWeight, // total weight
          value.length, // length
          value.width,  // width
          value.height, // height
          value.stackable ? 'true' : '', // stack
          value.stackable ? 'true' : '', // same skid
          value.location ? value.location : ''
        ));
    });
    this.us.isQuickRates = false;
  }

  searchNMFC() {
    window.open('https://smc3apps.smc3.com/Applications/FastClass/FC.asp', '_blank');
  }

  setProductValues(index: number) {
    let foundProduct = false;
    for (const product of this.productList()) {
      if (product.productID == this.freights.at(index).get('productID')?.value) {
        this.freights.at(index).get('productID')?.setValue(product.productID);
        this.freights.at(index).get('item')?.setValue(product.code);
        this.freights.at(index).get('classNumber')?.setValue(product.productClass);
        this.freights.at(index).get('description')?.setValue(product.description);
        this.freights.at(index).get('nmfcNumber')?.setValue(product.nmfc);
        foundProduct = true;
        break;
      }
    }

    if (!foundProduct) {
      this.resetProductInformation(index);
    }
  }

  clickEventHandler($event: any) {
    this.productsToAdd.push($event);
    $('.toast').toast('show');
  }

  confirmFromProductList() {
    for (const product of this.productsToAdd) {
      this.addFreightForProductList(product);
    }
    this.productsToAdd.length = 0;
  }

  setControlValue(value: any, controlName = '', index: any) {
    const control = this.freightForm.controls["freights"] as FormArray;
    let handlingUnits = control.at(index).get('unitNumber');
    let lbsUnits = control.at(index).get('piecesInputOne');
    let totalLbsUnits = control.at(index).get('piecesInputTwo');

    if (controlName === 'item') {
      this.freights.at(index).get('productID')?.setValue(value.value, {onlySelf: false, emmitEvent: true});
      this.freights.at(index).get('item')?.setValue(value.item, {onlySelf: false, emmitEvent: true});
    }

    if (controlName === 'classNumber') {
      this.freights.at(index).get('classNumber')?.setValue(value);
    }

    if (controlName === 'unitType') {
      this.freights.at(index).get('unitType')?.setValue(value);
    }

    if (controlName === 'hu') {
      // DEFAULT CALC
      if (this.shipmentType() === 'Truckload') {
        $('#' + this.stopId() + 'classNumber' + index).removeClass('is-invalid');
        this.freights.at(index).get('piecesNumber')?.setValue(handlingUnits?.value);
      } else {
        this.freights.at(index).get('piecesNumber')?.setValue('');
      }
      if (lbsUnits?.value != 0 || lbsUnits?.value != '' || lbsUnits?.value != null) {
        const total = (lbsUnits?.value * handlingUnits?.value);
        totalLbsUnits?.setValue(total);
      } else {
        const lbs = handlingUnits?.value === 0 ? 0 : (totalLbsUnits?.value / handlingUnits?.value);
        lbsUnits?.setValue(Math.round(lbs));
      }
    }

    if (controlName === 'piecesInputOne') {
      if (lbsUnits?.value === 0 || lbsUnits?.value === null || lbsUnits?.value === '') {
        totalLbsUnits?.setValue(0);
      } else {
        const total = (lbsUnits?.value * handlingUnits?.value);
        totalLbsUnits?.setValue(total);
      }
    }

    if (controlName === 'piecesInputTwo') {
      if (totalLbsUnits?.value === 0 || totalLbsUnits?.value === '' || totalLbsUnits?.value === null) {
        lbsUnits?.setValue(0);
      } else {
        const lbs = handlingUnits?.value === 0 ? totalLbsUnits?.value : (totalLbsUnits?.value / handlingUnits?.value);
        if (handlingUnits?.value > 0) {
          lbsUnits?.setValue(Math.round(lbs));
        } else {
          lbsUnits?.setValue(totalLbsUnits?.value);
        }
      }
    }
  }

  calculateCBF(items: any) {
    let cubicFeet: number;
    cubicFeet = this.ds.getCubicFeetForItem(this.mapLineItems(items));
    return cubicFeet;
  }

  calculatePCF(items: any) {
    let density: number;
    density = this.ds.getDensity(this.mapLineItems(items));
    return density;
  }

  calculateLinearFeet() {
    const currentLinearFeet = this.linearFeet;
    this.linearFeet = 0;
    let lineItems: LineItem2[] = [];

    if (this.freights.length !== 0) {
      this.freights.value.forEach((item: any) => {
        if (item.length != '' && parseInt(item.length) > 0 &&
          item.width != '' && parseInt(item.width) > 0 &&
          item.height != '' && parseInt(item.height) > 0) {
          lineItems.push(this.mapLineItem(item));
        }
      });

      if (lineItems.length > 0 && JSON.stringify(lineItems) !== JSON.stringify(this.prevLineItems)) {
        this.prevLineItems = lineItems;
        this.linearFeetLoaded = false;
        this.lfs.calculateLinearFoot(lineItems).subscribe({
          next: (response: any) => {
            this.linearFeet = response ? response : 0;
            this.linearFeetLoaded = true;
          }
        });
      } else {
        this.linearFeet = currentLinearFeet;
      }
    }
  }

  calculateTotalUnitWeight() {
    const lineItems: LineItem[] = [];
    if (this.freights.length !== 0) {
      this.freights.value.forEach((item: any) => {
        lineItems.push(this.mapLineItems(item));
      });
      this.totalUnitWeight = this.ds.getTotalUnitWeight(lineItems);
    }
  }

  calculateTotalCubicFeet() {
    const lineItems: LineItem[] = [];
    if (this.freights.length !== 0) {
      this.freights.value.forEach((item: any) => {
        lineItems.push(this.mapLineItems(item));
      });
      this.totalCubicFeet = this.ds.getTotalCubicFeet(lineItems);
    }
  }

  calculateTotalDensity() {
    const lineItems: LineItem[] = [];
    if (this.freights.length !== 0) {
      this.freights.value.forEach((item: any) => {
        lineItems.push(this.mapLineItems(item));
      });
      this.totalDensity = this.ds.getTotalDensity(lineItems);
    }
  }

  mapLineItems(value: any) {
    // match line item with interface values;
    return {
      productID: value.productID,
      productCode: '',
      productDescription: value.description,
      nmfc: value.nmfcNumber,
      freightClass: value.classNumber,
      hazmat: value.hm,
      handlingUnits: value.unitNumber != '' ? value.unitNumber : 0,
      unitType: value.unitType,
      pieces: value.piecesNumber,
      length: value.length != '' ? parseInt(value.length) : 0,
      width: value.width != '' ? parseInt(value.width) : 0,
      height: value.height != '' ? parseInt(value.height) : 0,
      unitWeight: value.piecesInputOne != '' ? value.piecesInputOne : 0,
      totalWeight: value.piecesInputTwo != '' ? value.piecesInputTwo : 0,
      stackable: value.stackChk != '' ? value.stackChk : false,
      sameSkid: value.sameSkid != '' ? value.sameSkid : false,
      location: value.location
    };
  }

  setMileage(shipperZip = '', consigneeZip = '', shipmentType = 'LTL') {
    this.ms.getMileage(shipperZip, consigneeZip, shipmentType).subscribe({
      next: response => {
        this.mileage = response.mileage;
      },
      error: () => {
        this.mileage = 0;
      }
    });
  }

  resetProductInformation(index: number) {
    this.freights.at(index).get('productID')?.setValue('');
    this.freights.at(index).get('item')?.setValue('');
    this.freights.at(index).get('classNumber')?.setValue('');
    this.freights.at(index).get('description')?.setValue('');
    this.freights.at(index).get('nmfcNumber')?.setValue('');
  }

  getSuggestedClasses() {
    const control = this.freightForm.controls["freights"] as FormArray;
    // Check if any line items have the necessary dimensions to calculate the suggested class
    for (let i = 0; i < this.freights.length; i++) {
      if (control.at(i).get('piecesInputTwo')?.value != '' && control.at(i).get('length')?.value != '' &&
        control.at(i).get('width')?.value != '' && control.at(i).get('height')?.value != '') {
        // All necessary values, create a line item
        const items: { width: any; length: any; height: any; handlingUnits: any; totalWeight: any; } = {
          width: control.at(i).get('width')?.value,
          height: control.at(i).get('height')?.value,
          length: control.at(i).get('length')?.value,
          handlingUnits: control.at(i).get('unitNumber')?.value,
          totalWeight: control.at(i).get('piecesInputTwo')?.value
        };
        const suggestedClass = this.ds.getSuggestedClass(items);
        $('#' + this.stopId() + 'freightSuggestedClass' + i).val(suggestedClass);
        $('#' + this.stopId() + 'calculatedClass' + i).html(suggestedClass.toString());
      }
    }
  }

  validateSelectedClass(index: number) {
    const suggestedClass = $('#' + this.stopId() + 'freightSuggestedClass' + index.toString()).val();
    $('#' + this.stopId() + 'calculatedClass' + index.toString()).html(suggestedClass?.toString() ?? '');
    const selectedClass = this.freights.at(index).get('classNumber')?.value;
    return !this.clientHideSuggestedClass() && selectedClass &&
      selectedClass?.toString() !== '' && suggestedClass?.toString() !== '' &&
      selectedClass.toString() !== suggestedClass?.toString();
  }

  setSuggestedClass(index: number) {
    const value = $('#' + this.stopId() + 'freightSuggestedClass' + index.toString()).val();
    this.freights.at(index).get('classNumber')?.setValue(value);
  }

  mapLineItem(value: any) {
    const items: LineItem2 = {
      freightClass: value.classNumber,
      weight: value.piecesInputTwo != '' ? value.piecesInputTwo : 0,
      handlingUnits: value.unitNumber != '' ? value.unitNumber : 0,
      unitType: value.unitType,
      length: value.length != '' ? parseInt(value.length) : 0,
      width: value.width != '' ? parseInt(value.width) : 0,
      height: value.height != '' ? parseInt(value.height) : 0,
      stackable: value.stackChk != '' ? value.stackChk : false,
      sameSkid: value.sameSkid != '' ? value.sameSkid : false
    };
    return items;
  }

  onControlClick(name: string, text: string, idx: number, forceRemove: boolean = false) {
    text = text + (idx + 1);
    const remove = $('#' + name).prop('checked');
    const val = {item: text, remove: forceRemove ? forceRemove : remove};
    if (name === 'sameSkid' + idx && remove == true) {
      this.isMinimum[idx] = false;
      this.freights.at(idx).get('unitNumber')?.setValidators([Validators.min(0)]);
      this.freights.at(idx).get('unitNumber')?.setValue(0);
    }
    if (name === 'sameSkid' + idx && remove == false) {
      this.isMinimum[idx] = true;
      this.freights.at(idx).get('unitNumber')?.setValidators([Validators.min(1)]);
    }
    this.onUncheckedLineItems.emit(val);
  }

  validateHUvsPieces(index: number) {
    const units = this.freights.at(index).get('unitNumber')?.value;
    const pieces = this.freights.at(index).get('piecesNumber')?.value;
    let control = this.freightForm.controls["freights"] as FormArray;
    $('#' + this.stopId() + 'piecesNumber' + index).removeClass('is-invalid');
    if (units !== '') {
      control.at(index).get('piecesNumber')?.setValidators([Validators.required, Validators.min(parseInt(units))]);
    } else {
      control.at(index).get('piecesNumber')?.setValidators([Validators.required, Validators.min(1)]);
    }
    control.at(index).get('piecesNumber')?.updateValueAndValidity();

    if (units !== '' && pieces !== '') {
      if (parseInt(pieces) < parseInt(units)) {
        $('#' + this.stopId() + 'piecesNumber' + index).addClass('is-invalid');
        return true;
      }
    }
    return false;
  }

  private getFreight(
    productID = '',
    item = '',
    description = '',
    nmfcNumber = '',
    classNumber = '',
    hm = 0,
    unitNumber = '',
    unitType = 'PALLETS',
    piecesNumber = '',
    piecesInputOne = '',
    piecesInputTwo = '',
    length = '',
    width = '',
    height = '',
    stackChk = '',
    sameSkid = '',
    location = 'Final Destination'
  ) {
    return this.fb.group({
      productID: [productID],
      item: [item],
      description: [description],
      nmfcNumber: [nmfcNumber],
      classNumber: (this.shipmentType() === 'LTL' ? [classNumber, Validators.required] : [classNumber]),
      hm: [hm],
      unitNumber: (this.stopId() !== null && this.stopId() !== '' ? [unitNumber] : [unitNumber, [Validators.min(1)]] ),
      unitType: (this.stopId() !== null && this.stopId() !== '' ? [unitType] : [unitType, Validators.required]),
      piecesNumber: (this.stopId() !== null && this.stopId() !== '' ? [piecesNumber] : [piecesNumber]),
      piecesInputOne: [piecesInputOne],
      piecesInputTwo: (this.stopId() !== null && this.stopId() !== '' ? [piecesInputTwo] : [piecesInputTwo]),
      length: [length],
      width: [width],
      height: [height],
      stackChk: [stackChk],
      sameSkid: [sameSkid],
      location: [location]
    });
  }

  private addFreightForProductList(product: Product) {
    const productControl = this.fb.group({
      productID: [product.productID],
      item: [product.code],
      description: [product.description],
      nmfcNumber: [product.nmfc],
      classNumber: (this.shipmentType() === 'LTL' ? [product.productClass, Validators.required] : [product.productClass]),
      hm: [this.freights.length === 1 ? this.freights.at(0).get('hm')?.value : 0],
      unitNumber: [this.freights.length === 1 ? this.freights.at(0).get('unitNumber')?.value : '', Validators.required],
      unitType: [this.freights.length === 1 ? this.freights.at(0).get('unitType')?.value : 'PALLETS', Validators.required],
      piecesNumber: [this.freights.length === 1 ? this.freights.at(0).get('piecesNumber')?.value : '', Validators.required],
      piecesInputOne: [this.freights.length === 1 ? this.freights.at(0).get('piecesInputOne')?.value : ''],
      piecesInputTwo: [this.freights.length === 1 ? this.freights.at(0).get('piecesInputTwo')?.value : '', Validators.required],
      length: [this.freights.length === 1 ? this.freights.at(0).get('length')?.value : ''],
      width: [this.freights.length === 1 ? this.freights.at(0).get('width')?.value : ''],
      height: [this.freights.length === 1 ? this.freights.at(0).get('height')?.value : ''],
      stackChk: [this.freights.length === 1 ? this.freights.at(0).get('stackChk')?.value : ''],
      sameSkid: [this.freights.length === 1 ? this.freights.at(0).get('sameSkid')?.value : ''],
    });

    // First freight item, set instead of push
    if (this.freights.length === 1 && !this.firstFreightChecked) {
      this.freights.setControl(0, productControl);
      // Identifies that first freight has been set since incrementing length will cause issues
      this.firstFreightChecked = true;
    } else {
      this.freights.push(productControl);
    }
  }
}

