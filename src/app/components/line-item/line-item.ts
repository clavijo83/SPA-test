import {Component, EventEmitter, Injectable, OnDestroy, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators, } from '@angular/forms';
import {Dropdown} from '../../interfaces/dropdown';
import {Constants} from '../../constants/constants';
import {LineItem2, LineItem} from '../../interfaces/line-item';
import {DensityService} from '../../services/density/density.service';
import {MileageService} from '../../services/mileage/mileage.service';
import {LinearFootService} from '../../services/linear-foot/linear-foot.service';
import {Global} from '../../common/global';

@Injectable()
@Component({
  selector: 'app-line-item',
  standalone: false,
  templateUrl: './line-item.html',
  styleUrl: './line-item.css',
})
export class LineItemComponent implements OnInit, OnDestroy {
  lineItemForm!: FormGroup;
  totalHUSum = 0;
  totalLbsSum = 0;
  firstFreightChecked = false;
  lineItemFormValueChanges$: any;
  classDropdown: Dropdown[] = [];
  @Output() getLineItems = new EventEmitter<any>(true);
  mileage = 0;
  linearFeet = 0;
  totalUnitWeight = 0;
  totalCubicFeet = 0;
  totalDensity = 0;
  global = Global;
  isTruckload = false;

  constructor(private fb: FormBuilder, private ds: DensityService, private ms: MileageService, private lfs: LinearFootService) {
  }

  get lineItems() {
    return this.lineItemForm.get('lineItems') as FormArray;
  }

  get classDropdownValues() {
    const classDropdown: string[] = [];
    Constants.CLASS_DROPDOWN.forEach(value => {
      classDropdown.push(value.item);
    });
    return classDropdown;
  }

  ngOnInit(): void {
    this.classDropdown = Constants.CLASS_DROPDOWN;
    this.totalLbsSum = 0;
    this.totalHUSum = 0;
    this.lineItemForm = this.fb.group({
      lineItems: this.fb.array([
        this.getLineItem()
      ])
    });

    // initialize the stream on freight
    // subscribe to the stream so listen to changes on units
    this.lineItemFormValueChanges$ = this.lineItems.valueChanges.subscribe(val => {
      this.updateTotals(val);
      this.getSuggestedClasses();
      this.getLineItems.emit(this.lineItems.value);
    });
  }

  getLineItem() {
    if (!this.isTruckload) {
      return this.fb.group({
        classNumber: ['', Validators.required],
        unitNumber: ['', Validators.required],
        unitWeight: ['', Validators.required],
        unitWeightTotal: ['', Validators.required],
        length: [''],
        width: [''],
        height: [''],
        stackChk: [false],
        sameSkidChk: [false],
      });
    } else {
      return this.fb.group({
        classNumber: ['', Validators.required],
        unitNumber: ['', Validators.required],
        unitWeight: ['', Validators.required],
        unitWeightTotal: ['', Validators.required],
        length: [''],
        width: [''],
        height: [''],
        stackChk: [''],
        sameSkidChk: ['']
      });
    }
  }

  getSuggestedClasses() {
    const control = this.lineItemForm.controls["lineItems"] as FormArray;
    // Check if any line items have the necessary dimensions to calculate the suggested class
    for (let i = 0; i < this.lineItems.length; i++) {
      if (control.at(i).get('unitWeightTotal')?.value != '' && control.at(i).get('length')?.value != '' &&
        control.at(i).get('width')?.value != '' && control.at(i).get('height')?.value != '') {
        // All necessary values, create a line item
        const items: { width: any; length: any; height: any; handlingUnits: any; totalWeight: any; } = {
          width: control.at(i).get('width')?.value,
          height: control.at(i).get('height')?.value,
          length: control.at(i).get('length')?.value,
          handlingUnits: control.at(i).get('unitNumber')?.value,
          totalWeight: control.at(i).get('unitWeightTotal')?.value
        };
        $('#suggestedClass' + i).val(this.ds.getSuggestedClass(items));
      }
    }
  }

  setClasses(classes: number[]) {
    for (const classNumber of classes) {
      const item = this.fb.group({
        classNumber: [classNumber],
        unitNumber: [''],
        unitWeight: [''],
        unitWeightTotal: [''],
        length: [''],
        width: [''],
        height: [''],
        stackChk: [''],
        sameSkidChk: ['']
      });

      if (this.lineItems.length === 1 && !this.firstFreightChecked) {
        this.lineItems.setControl(0, item);
        // Identifies that first freight has been set since incrementing length will cause issues
        this.firstFreightChecked = true;
      } else {
        this.lineItems.push(item);
      }
    }
  }

  removeLineItems(index: number) {
    this.lineItemForm.controls["lineItems"].markAsDirty();

    if (this.lineItems.length > 1) {
      this.lineItems.removeAt(index);
    } else {
      this.lineItems.setControl(0, this.getLineItem());
      this.firstFreightChecked = false;
    }
  }

  ngOnDestroy() {
    this.lineItemFormValueChanges$.unsubscribe();
  }

  setControlValue(event: any, controlName: string = '', index: number) {
    const control = this.lineItemForm.controls["lineItems"] as FormArray;
    let handlingUnits = control.at(index).get('unitNumber');
    let lbsUnits = control.at(index).get('unitWeight');
    let totalLbsUnits = control.at(index).get('unitWeightTotal');

    if (controlName === 'classNumber') {
      if (event != undefined) {
        control.at(index).get('classNumber')?.patchValue(event, {onlySelf: false, emitEvent: true});
      }
    }

    if (controlName === 'unitNumber') {
      // DEFAULT CALC
      if (lbsUnits?.value != 0 || lbsUnits?.value != '' || lbsUnits?.value != null) {
        const total = (lbsUnits?.value * handlingUnits?.value);
        totalLbsUnits?.setValue(total);
      } else {
        const lbs = handlingUnits?.value === 0 ? 0 : (totalLbsUnits?.value / handlingUnits?.value);
        lbsUnits.setValue(Math.round(lbs));
      }
    }

    if (controlName === 'unitWeight') {
      if (handlingUnits?.value === '' || handlingUnits?.value === null) {
        handlingUnits?.setValue(0);
      }

      if (lbsUnits?.value === 0 || lbsUnits?.value === '' || lbsUnits?.value === null) {
        totalLbsUnits?.setValue(0);
      } else {
        const total = (lbsUnits?.value * handlingUnits?.value);
        totalLbsUnits?.setValue(total);
      }
    }

    if (controlName === 'unitWeightTotal') {
      if (handlingUnits?.value === '' || handlingUnits?.value === null) {
        handlingUnits?.setValue(0);
      }

      if (totalLbsUnits?.value === 0 || totalLbsUnits?.value === '' || totalLbsUnits?.value === null) {
        lbsUnits?.setValue(0);
      } else {
        const lbs = handlingUnits?.value === 0 ? 0 : (totalLbsUnits?.value / handlingUnits?.value);
        lbsUnits?.setValue(Math.round(lbs));
      }
    }
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

  calculateTotalUnitWeight() {
    let lineItems: LineItem[] = [];
    if (this.lineItems.length !== 0) {
      this.lineItems.value.forEach((item: any) => {
        lineItems.push(this.mapLineItems(item));
      });
      this.totalUnitWeight = this.ds.getTotalUnitWeight(lineItems);
    }
  }

  calculateTotalCubicFeet() {
    let lineItems: LineItem[] = [];
    if (this.lineItems.length !== 0) {
      this.lineItems.value.forEach((item: any) => {
        lineItems.push(this.mapLineItems(item));
      });
      this.totalCubicFeet = this.ds.getTotalCubicFeet(lineItems);
    }
  }

  calculateTotalDensity() {
    let lineItems: LineItem[] = [];
    if (this.lineItems.length !== 0) {
      this.lineItems.value.forEach((item: any) => {
        lineItems.push(this.mapLineItems(item));
      });
      this.totalDensity = this.ds.getTotalDensity(lineItems);
    }
  }

  calculateLinearFeet() {
    this.linearFeet = 0;
    let lineItems: LineItem2[] = [];
    if (this.lineItems.length !== 0) {
      this.lineItems.value.forEach((item: any) => {
        if (item.unitNumber != '' && parseInt(item.unitNumber) > 0 &&
          item.length != '' && parseInt(item.length) > 0 &&
          item.width != '' && parseInt(item.width) > 0 &&
          item.height != '' && parseInt(item.height) > 0) {
          lineItems.push(this.mapLineItem(item));
        }
      });

      if (lineItems.length > 0) {
        this.lfs.calculateLinearFoot(lineItems).subscribe({
          next: (response: any) => {
            this.linearFeet = response ? response : 0;
          }
        });
      }
    }
  }

  mapLineItems(value: any): any {
    return {
      productID: '',
      productCode: '',
      productDescription: '',
      nmfc: '',
      freightClass: value.classNumber,
      hazmat: null,
      handlingUnits: value.unitNumber != '' ? value.unitNumber : 0,
      unitType: '',
      pieces: null,
      length: value.length != '' ? parseInt(value.length) : 0,
      width: value.width != '' ? parseInt(value.width) : 0,
      height: value.height != '' ? parseInt(value.height) : 0,
      unitWeight: value.unitWeight != '' ? value.unitWeight : 0,
      totalWeight: value.unitWeightTotal != '' ? value.unitWeightTotal : 0,
      stackable: value.stackChk != '' ? value.stackChk : false,
      sameSkid: value.sameSkidChk != '' ? !value.sameSkidChk : true,
      location: ''
    };
  }

  mapLineItem(value: any) {
    const items: LineItem2 = {
      freightClass: value.classNumber,
      weight: value.unitWeightTotal != '' ? value.unitWeightTotal : 0,
      handlingUnits: value.unitNumber != '' ? value.unitNumber : 0,
      length: value.length != '' ? parseInt(value.length) : 0,
      width: value.width != '' ? parseInt(value.width) : 0,
      height: value.height != '' ? parseInt(value.height) : 0,
      stackable: value.stackChk != '' ? value.stackChk : false,
      sameSkid: value.sameSkidChk != '' ? !value.sameSkidChk : true
    };
    return items;
  }

  /**
   * Update totals as soon as something changed on the lineItem group
   */
  private updateTotals(lineItems: any) {
    this.totalHUSum = 0;
    this.totalLbsSum = 0;

    for (const i in lineItems) {
      const totalHU = lineItems[i].unitNumber;
      const totalLbs = lineItems[i].unitWeightTotal;

      // update total price for all units
      this.totalHUSum += totalHU;
      this.totalLbsSum += totalLbs;
    }

    // Calculate Totals
    this.calculateLinearFeet();
    this.calculateTotalUnitWeight();
    this.calculateTotalCubicFeet();
    this.calculateTotalDensity();
  }
}

