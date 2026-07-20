import {
  Component,
  Injectable,
  input,
  Input, model,
  OnChanges,
  output, signal,
  SimpleChanges
} from '@angular/core';
import {ClientField} from "../../interfaces/client-field";
import {ClientFieldsService} from "../../services/client-fields/client-fields.service";
import {ReferenceField} from "../../interfaces/reference-field";
import {formatDate} from "@angular/common";
import {Global} from "../../common/global";
import {GroupsService} from "../../services/groups/groups.service";

@Component({
  selector: 'app-reference-field',
  standalone: false,
  templateUrl: './reference-field.html',
  styleUrl: './reference-field.css',
})
@Injectable({
  providedIn: 'root'
})
export class ReferenceFieldComponent implements OnChanges {
  existingClientFields = input<ReferenceField[]>([]);
  existingOpenReferenceFields = model<any[]>([]);
  groupID =  input<any>(null);
  shipmentID =  input('');
  disabled = input(false);
  showExceptionReasonEvent = input(false);
  checkForLeasCostCarrier = input(false);
  showExceptionRequired = output<string>();
  addReferenceEmit = output<boolean>();
  selectRefTypeEmit = output<boolean>();
  @Input() isShipmentsPage: boolean = true;
  hasExceptionCode:boolean = true;
  isRefSelected:boolean= false;
  clientFields = signal<ClientField[]>([]);
  newRefName: string = 'Reference #';
  newRefValue: any = '';
  clientFieldsLength: number = 0;
  referenceDropDown: any[] = [];
  references: ClientField[] = [] as ClientField[];
  isInternalManagement: boolean = false;
  global = Global;
  dropDownLcc:any[] = [];
  selectedOption:String= '';
  exceptionError: boolean = false;

  constructor(private client: ClientFieldsService, private gs: GroupsService) {
    this.gs.isValidPermission().then(data => {
      this.isInternalManagement = data;
    });
  }

  getExceptionData(groupID:any): void {
    this.client.getLccException(groupID).subscribe({
      next: (response) => {
        this.dropDownLcc = response;
      }
    });
  }

  dropDownListLCC() {
    const dropDownLCC: string[] = [];
    this.dropDownLcc?.forEach(element => {
      dropDownLCC.push(element.Value.toLowerCase());
    });
    return dropDownLCC;
  }

  handleDropdownChange(event: any) {
    const matchesInClientFields = this.clientFields()?.some(clientField => clientField?.description == 'Exception Code' && this.newRefName == 'Exception Code');
    if(matchesInClientFields)return;
    if (this.newRefName == 'Exception Code'){
      this.selectedOption = event;
      this.newRefValue = event;
      this.addReferences();
    }

    if(this.newRefName.length == 0) {
      this.clientFields().forEach((element, index) => {
        if (element.description == 'Exception Code') {
          // this.clientFields[index].value = event;
          this.clientFields.update((values: any) => ({
            ...values[index],
            value: event
          }));
        }
      });
    }
  }

  setReferenceDropdown(groupID: any){
    this.existingOpenReferenceFields.update(() => []);
    this.showExceptionRequired.emit('')
    this.referenceDropDown = [];
    this.isRefSelected = false;
    this.newRefName = ''
    this.client.getReferenceDropDown(groupID).subscribe({
      next: response => {
        let referenceDropDown = response;
        if (this.checkForLeasCostCarrier()) {
          this.referenceDropDown = referenceDropDown ?? [];
        } else {
          let uniqueDescriptions = new Set<string>();

          referenceDropDown.forEach((item: { rftDescription: string; }) => {
            uniqueDescriptions.add(item.rftDescription);
          });

          this.referenceDropDown = Array.from(uniqueDescriptions).map(description => {
            return referenceDropDown.find((item: { rftDescription: string; }) => item.rftDescription === description);
          });
        }

        this.referenceDropDown?.forEach(element => {
          if(element.rftDescription === 'Exception Code'){
            this.showExceptionRequired.emit(element?.rftDescription)
            this.getExceptionData(groupID)
          }
        });
      },
      error: () => {
        this.referenceDropDown = []
      }
    });
  }

  toDatePicker(description: any) {
    if (description == 'MABD') {
      return 'date';
    }else{
      return 'text';
    }
  }

  addReferences() {
    this.existingOpenReferenceFields.update(() => this.existingOpenReferenceFields() ?? []);
    if (this.newRefValue && this.newRefName) {
      let newRef = {
        orfID: null,
        rftID: this.getOpenRefByName(this.newRefName).rftID,
        value: this.newRefName === 'MABD' ? formatDate(this.newRefValue, 'MM/dd/yyyy', 'en') : this.newRefValue,
        rftDescription: this.newRefName,
        rftAbbreviation: this.getOpenRefByName(this.newRefName).rftAbbreviation,
      }
      this.existingOpenReferenceFields.update(items => [...items, newRef]);
      //CLEAR CONTROLS
      this.newRefName = '';
      this.newRefValue = '';
      this.isRefSelected = false;
      this.hasExceptionCode = true;
      this.addReferenceEmit.emit(true)
    }
  }

  removeReferences(i: number) {
    if(this.exceptionError){
      this.exceptionError=false
    }
    this.existingOpenReferenceFields.update(() => this.existingOpenReferenceFields().filter((value: any, index: any) => index != i));
  }

  setReferenceName(value: string) {
    this.selectedOption ='';
    this.isRefSelected = true;
    this.newRefName = value;
    this.addReferences();
    this.hasExceptionCode = this.newRefName === "Exception Code";
    const matchesInClientFields = this.clientFields()?.some(clientField => clientField?.description == 'Exception Code' && this.newRefName == 'Exception Code');
    if (matchesInClientFields || this.existingOpenReferenceFields()?.some((element: any) => element.rftDescription =='Exception Code' && this.newRefName == 'Exception Code')) {
      this.exceptionError = true;
    }else{
      this.exceptionError = false;
    }
    if (!this.isShipmentsPage && this.hasExceptionCode) this.selectRefTypeEmit.emit(true)
  }

  getClientReferences(groupID: any) {
    this.setReferenceDropdown(groupID)
    let clientFieldIDs: any[] = [];
    this.clientFields()?.forEach(field => {
      clientFieldIDs.push(field.fieldTypeID);
    });

    this.client.getClientReferences(groupID).subscribe({
      next: response => {
        this.clientFields.set(response?.filter((element: any) => element?.description !== 'Exception Code'));
      },
      complete: () => {
        if (this.existingClientFields()) {
          this.existingClientFields().forEach((preset: any) => {
            if (!clientFieldIDs.includes(preset.fieldTypeID)) {
              this.clientFields.update(items => [...items, {
                fieldID: preset.fieldID,
                fieldTypeID: preset.fieldTypeID,
                description: preset.description,
                tiberID: preset.tiberID,
                mandatory: 0,
                defaults: null,
                maxLength: null,
                characterType: 'Both',
                suppressPrint: null,
                value: preset.description === 'MABD' ? formatDate(preset.value, 'yyyy-MM-dd', 'en') : preset.value
              }])
            }
          });
          this.clientFieldsLength = this.clientFields.length;
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groupID']) {
      this.clientFields().length = 0
      if (this.groupID()) {
        this.getClientReferences(this.groupID());
      }
    }

    if(this.showExceptionReasonEvent()){
      this.referenceDropDown?.forEach(element => {
        if(element.rftDescription === 'Exception Code'){
          this.newRefName = element.rftDescription;
          this.selectedOption=''
          this.hasExceptionCode = true;
          this.isRefSelected = true;
        }
      });
    }
  }

  saveReferences() {
    let saveRef: any = [];
    this.clientFields().forEach((ref: any) => {
      if (ref.value != '') {
        saveRef.push({
          fieldID: ref.fieldID,
          value: ref.description === 'MABD' ? formatDate(ref.value, 'MM/dd/yyyy', 'en') : ref.value,
          fieldTypeID: ref.fieldTypeID,
          description: ref.description,
          tiberID: ref.tiberID
        })
      }
    })
    return saveRef;
  }

  saveOpenReferences() {
    let saveOpenRef: any = [];
    if (this.existingOpenReferenceFields() != null && typeof this.existingOpenReferenceFields() !== "undefined") {
      this.existingOpenReferenceFields().forEach((ref: any) => {
        saveOpenRef.push({
          orfID: ref.orfID,
          rftID: ref.rftID,
          rftDescription: ref.rftDescription,
          value: ref.value
        })
      });
    }
    return saveOpenRef;
  }

  referenceDropdownList() {
    const uniqueReferenceSet = new Set<string>();
    this.referenceDropDown?.forEach(ref => {
      uniqueReferenceSet.add(ref.rftDescription);
    });
    return Array.from(uniqueReferenceSet);
  }

  updateExistingOpenReference(newValue: any, type: string, refIndex: number) {
    if (this.existingOpenReferenceFields().length != 0) {
      this.existingOpenReferenceFields().forEach((val: any, index: any) => {
        if (refIndex === index) {
          if (type === 'description') {
            //SET UPDATED VALUES
            val.rftID = this.getOpenRefByName(newValue).rftID;
            val.rftDescription = this.getOpenRefByName(newValue).rftDescription;
            val.rftAbbreviation = this.getOpenRefByName(newValue).rftAbbreviation;
          } else {
            //SET NEW REFERENCE VALUE
            val.value = newValue.target.value;
          }
        }
      });
    }
  }

  getOpenRefByName(refName: string) {
    let openRef = {
      rftID: null,
      rftDescription: null,
      rftAbbreviation: null
    }
    this.referenceDropDown.forEach(ref => {
      if (ref.rftDescription == refName) {
        openRef.rftID = ref.rftID
        openRef.rftDescription = ref.rftDescription
        openRef.rftAbbreviation = ref.rftAbbreviation
      }
    });
    if (!openRef.rftID) openRef = this.getOpenRefByID(52) // if rftID null, then return by default Reference #
    return openRef;
  }

  getOpenRefByID(rftID: number) {
    let openRef = {
      rftID: null,
      rftDescription: null,
      rftAbbreviation: null
    }
    this.referenceDropDown.forEach(ref => {
      if (ref.rftID == rftID) {
        openRef.rftID = ref.rftID
        openRef.rftDescription = ref.rftDescription
        openRef.rftAbbreviation = ref.rftAbbreviation
      }
    });
    return openRef;
  }

  addReferenceByName(refName: string, refValue = '') {
    this.existingOpenReferenceFields.update(() => this.existingOpenReferenceFields() ?? []);
    let newRef = {
      orfID: null,
      rftID: this.getOpenRefByName(refName).rftID,
      value: refName === 'MABD' ? formatDate(refValue, 'MM/dd/yyyy', 'en') : refValue,
      rftDescription: refName,
      rftAbbreviation: this.getOpenRefByName(refName).rftAbbreviation,
    }
    this.existingOpenReferenceFields.update(items => [...items, newRef]);
  }

  focusOutReferenceName(event: any, index: any = null) {
    this.newRefName = event.target.value && event.target.value !== ""  ? event.target.value : 'Reference #';
    if (index){
      this.updateExistingOpenReference(this.newRefName,'description', index)
    }else {
      this.addReferences()
    }
  }
}

