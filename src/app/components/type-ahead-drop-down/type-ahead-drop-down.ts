import {Component, EventEmitter, forwardRef, Input, OnInit, Output, ViewChild} from '@angular/core';
import {merge, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {NgbTypeahead} from '@ng-bootstrap/ng-bootstrap';
import {NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Dropdown} from '../../interfaces/dropdown';

@Component({
  selector: 'app-type-ahead-drop-down',
  standalone: false,
  templateUrl: './type-ahead-drop-down.html',
  styleUrl: './type-ahead-drop-down.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TypeAheadDropDown),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TypeAheadDropDown),
      multi: true
    }
  ]
})
export class TypeAheadDropDown implements OnInit {
  model: any;
  @ViewChild('instance', {static: true}) instance!: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  @Input() data: any = [];
  @Input() placeHolder = '';
  @Output() modelValueOnChange = new EventEmitter<any>();
  @Output() modelValueItemSelect = new EventEmitter<any>();
  @Input() tagLine = '';
  @Input() width = '';
  @Input() selectedValue?: any;
  @Input() name = 'TypeaheadControl';
  @Input() editable = false;
  @Input() isRequired = true;
  @Input() floatingLabel = true;
  @Input() disabled = false;
  @Input() dataType = 'String'; // String or Object - if Object must be of type Dropdown
  search: any;
  formatter: any;
  @Input() focusFirst = true;

  constructor() {
  }

  ngOnInit(): void {
    this.searchValues();
    this.setSelectedValue();
    this.formatItem();
  }

  searchValues() {
    this.search = (text$: Observable<string>) => {
      const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
      const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
      const inputFocus$ = this.focus$;
      return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
        map(term => (term === '' ? this.data
          : this.filteredData(term)))
      );
    };
  }

  getValueOnChange(event: any) {
    // Handle null or empty input
    if (event === undefined || event === null || event === '') {
      event = '';
    } else {
      event = event ? event : '';
    }

    this.model = event;

    let filtered = this.dataType === 'String'
      ? this.data.filter((v: string) => v && v != '' && v.toLowerCase().indexOf(this.model.toLowerCase()) > -1)
      : this.data.filter((v: { item: string; }) => v && v.item.toLowerCase().indexOf(this.model.toString().toLowerCase()) > -1);

    setTimeout(() => {
      this.focusFirst = filtered.length !== 0;
    }, 1);

    this.modelValueOnChange.emit(event);
  }

  setSelectedValue() {
    if (this.selectedValue != '' || this.selectedValue != undefined) {
      this.model = this.selectedValue;
    } else {
      this.model = '';
    }
  }

  clickItemEvent(event: any) {
    if (event != undefined) {
      event = event ? event : '';
      this.model = this.dataType === 'String' ? event : event.item;
      this.modelValueItemSelect.emit(this.model);
    }
  }

  filteredData(term: string) {
    // ADD FILTERED VALUES TO BEGINNING OF DATA LIST SO WE SHOW FILTERED LIST BUT ALSO FULL DATA LIST
    let origData = this.dataType === 'String' ? this.data.filter((v: any) => (v !== null && v !== undefined)) :
      this.data.filter((v: any) => (v.item !== null && v.item !== undefined)); // FILTER OUT NULLS && UNDEFINED
    if (origData.length !== 0) {
      let filtered = this.dataType === 'String' ? origData.filter((v: any) => v.toLowerCase().indexOf(term.toLowerCase()) > -1) :
        origData.filter((v: any) => v.item.toLowerCase().indexOf(term.toLowerCase()) > -1);
      const focus = filtered.length !== 0;
      origData.forEach((value: any) => {
        filtered.push(value);
      });
      setTimeout(() => {
        this.focusFirst = focus;
      }, 1);
      this.model = term;

      if (this.name === 'modes') {
        return origData;
      }
      return filtered;
    }
  }

  focusOut(term: string) {
    // WORKS THE SAME AS IF USER PRESSES THE ENTER KEY WHEN TYPING A VALUE THAT IS NOT CONTAINED IN THE DROPDOWN LIST
    if (!this.editable && term !== '') {
      // CHECK IF THE VALUE TYPED IS INCLUDED IN THE FILTERED LIST - IF NOT SET THE FIRST VALUE OF THE FILTERED LIST
      // THIS FORCES A SELECTION THAT IS IN THE DROPDOWN LIST WHEN THE CONTROL IS NOT EDITABLE
      if (this.dataType === 'String') {
        if (!this.filteredData(term).includes(term)) {
          this.getValueOnChange(this.filteredData(term)[0]);
          this.clickItemEvent(this.filteredData(term)[0]);
        }
      } else {
        // uses object of Type Dropdown
        if (!this.filteredData(term).some((v: any) => v.item === term)) {
          this.getValueOnChange(this.filteredData(term)[0]);
          // formatter data structure
          const defaultTerm = {item: this.filteredData(term)[0]};
          this.clickItemEvent(defaultTerm);
        }
      }
    }
  }

  formatItem() {
    if (this.dataType !== 'String') {
      this.formatter = (item: Dropdown) => item.item;
    }
  }

  focusIn(id: string) {
    const format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    let arr = id.split(',');
    arr.forEach(() => {
      if (!format.test(id)) {
        $('#' + id).trigger('focus').trigger('select');
      }
    });
  }
}
