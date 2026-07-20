import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'app-calendar',
  standalone: false,
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: Calendar
    }
  ]
})
export class Calendar implements ControlValueAccessor {
  value!: Date;
  @Input() minDate: Date | undefined;
  @Input() disabledDates!: Array<Date>;
  @Input() title!: string;
  @Output() onSelect: EventEmitter<any> = new EventEmitter<any>();
  isDisabled = false;

  constructor() {
  }

  onChange = () => {
  };

  onTouched = () => {
  };

  onSelected(): void {
    this.onChange();
    this.onSelect?.emit(this.value);
  }

  writeValue(value: any): void {
    this.value = value
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

}
