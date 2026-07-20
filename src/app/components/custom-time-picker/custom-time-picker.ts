import {Component, EventEmitter, forwardRef, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
  selector: 'app-custom-time-picker',
  standalone: false,
  templateUrl: './custom-time-picker.html',
  styleUrl: './custom-time-picker.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomTimePicker),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CustomTimePicker),
      multi: true
    }
  ]
})
export class CustomTimePicker implements OnInit {
  public time!: FormGroup;
  public startHours: any = [];
  public endHours: any = [];
  public btnLabelStart: string = 'AM';
  public btnLabelEnd: string = 'AM';
  public minutes: any = [];
  public startTimeChange: boolean = false;
  public endTimeChange: boolean = false;
  public startTimeMinChange: boolean = false;
  public endTimeMinChange: boolean = false;
  @Input() minStep?: number = 1;  //Can be 1, 5, 10, 15
  @Input() timeFormat?: string = '12'; // 12 or 24 Hr format
  @Input() initStartHour: string = '08'; //String value [0-23] - #'s 1-9 should contain the leading 0
  @Input() initEndHour: string = '00'; //String value [0-23] - #'s 1-9 should contain the leading 0
  @Input() initStartMinute?: string = '00'; //String value [0-59] - #'s 1-9 should contain the leading 0 - Ensure Value exists in minutes. Depending on step value the minute might not be available.
  @Input() initEndMinute?: string = '00'; //String value [0-59] - #'s 1-9 should contain the leading 0 - Ensure Value exists in minutes. Depending on step value the minute might not be available.
  @Output() onBtnClick: EventEmitter<any> = new EventEmitter<any>();

  constructor(private fb: FormBuilder) {
  }

  get startTime() {
    return this.time.get('startTime')?.value ? this.time.get('startTime')?.value : {
      hour: '00',
      minute: '00',
      median: 'AM'
    }
  }

  get endTime() {
    return this.time.get('endTime')?.value ? this.time.get('endTime')?.value : {hour: '00', minute: '00', median: 'AM'}
  }

  ngOnInit(): void {
    //initTime hour check - to set median value
    this.btnLabelStart = (parseInt(this.initStartHour) >= 0 && parseInt(this.initStartHour) <= 11) ? 'AM' : 'PM';
    this.btnLabelEnd = (parseInt(this.initEndHour) >= 0 && parseInt(this.initEndHour) <= 11) ? 'AM' : 'PM';

    //initialize Hours & Minutes
    this.initStartHours();
    this.initEndHours();
    this.initMin();

    //initialize the form group
    this.time = this.fb.group({
      startTime: this.fb.group({
        hour: this.fb.control(this.initStartHour),
        minute: this.fb.control(this.initStartMinute),
        median: this.fb.control(this.btnLabelStart)
      }),
      endTime: this.fb.group({
        hour: this.fb.control(this.initEndHour),
        minute: this.fb.control(this.initEndMinute),
        median: this.fb.control(this.btnLabelEnd)
      }),
    });
  }

//Method to change hour values between AM & PM - on median btn click
  getMedian(type = 'start') {
    if (type === 'start') {
      let initStartHour = this.getHour(this.time.get('startTime')?.value.hour, this.startHours);
      let initStartMin = this.time.get('startTime')?.value.minute;

      this.btnLabelStart = this.btnLabelStart === 'AM' ? this.btnLabelStart = 'PM' : this.btnLabelStart = 'AM';

      this.initStartHours();
      this.time.get('startTime')?.setValue({
        hour: this.getHourValue(initStartHour, this.startHours),
        minute: initStartMin,
        median: this.btnLabelStart
      }, {onlySelf: false, emitEvent: true});
    }

    if (type === 'end') {
      let initEndHour = this.getHour(this.time.get('endTime')?.value.hour, this.endHours);
      let initEndMin = this.time.get('endTime')?.value.minute;

      this.btnLabelEnd = this.btnLabelEnd === 'AM' ? this.btnLabelEnd = 'PM' : this.btnLabelEnd = 'AM';

      this.initEndHours();
      this.time.get('endTime')?.setValue({
        hour: this.getHourValue(initEndHour, this.endHours),
        minute: initEndMin,
        median: this.btnLabelEnd
      }, {onlySelf: false, emitEvent: true});
    }
  }

  //Method to initiate start hour dropdown
  initStartHours() {
    this.startHours = [];
    if (this.timeFormat === '24') {
      // get Hours
      this.startHours.push({value: "00", hour: '00'})
      this.startHours.push({value: "01", hour: '01'})
      this.startHours.push({value: "02", hour: '02'})
      this.startHours.push({value: "03", hour: '03'})
      this.startHours.push({value: "04", hour: '04'})
      this.startHours.push({value: "05", hour: '05'})
      this.startHours.push({value: "06", hour: '06'})
      this.startHours.push({value: "07", hour: '07'})
      this.startHours.push({value: "08", hour: '08'})
      this.startHours.push({value: "09", hour: '09'})
      this.startHours.push({value: "10", hour: '10'})
      this.startHours.push({value: "11", hour: '11'})
      this.startHours.push({value: "13", hour: '13'})
      this.startHours.push({value: "14", hour: '14'})
      this.startHours.push({value: "15", hour: '15'})
      this.startHours.push({value: "16", hour: '16'})
      this.startHours.push({value: "17", hour: '17'})
      this.startHours.push({value: "18", hour: '18'})
      this.startHours.push({value: "19", hour: '19'})
      this.startHours.push({value: "20", hour: '20'})
      this.startHours.push({value: "21", hour: '21'})
      this.startHours.push({value: "22", hour: '22'})
      this.startHours.push({value: "23", hour: '23'})
    }

    if (this.timeFormat === '12') {
      if (this.btnLabelStart === 'AM') {
        this.startHours.push({value: "01", hour: '1'})
        this.startHours.push({value: "02", hour: '2'})
        this.startHours.push({value: "03", hour: '3'})
        this.startHours.push({value: "04", hour: '4'})
        this.startHours.push({value: "05", hour: '5'})
        this.startHours.push({value: "06", hour: '6'})
        this.startHours.push({value: "07", hour: '7'})
        this.startHours.push({value: "08", hour: '8'})
        this.startHours.push({value: "09", hour: '9'})
        this.startHours.push({value: "10", hour: '10'})
        this.startHours.push({value: "11", hour: '11'})
        this.startHours.push({value: "00", hour: '12'})
      }
      if (this.btnLabelStart === 'PM') {
        this.startHours.push({value: "13", hour: '1'})
        this.startHours.push({value: "14", hour: '2'})
        this.startHours.push({value: "15", hour: '3'})
        this.startHours.push({value: "16", hour: '4'})
        this.startHours.push({value: "17", hour: '5'})
        this.startHours.push({value: "18", hour: '6'})
        this.startHours.push({value: "19", hour: '7'})
        this.startHours.push({value: "20", hour: '8'})
        this.startHours.push({value: "21", hour: '9'})
        this.startHours.push({value: "22", hour: '10'})
        this.startHours.push({value: "23", hour: '11'})
        this.startHours.push({value: "12", hour: '12'})
      }
    }
  }

  //Method to initiate end hour dropdown
  initEndHours() {
    this.endHours = [];
    if (this.timeFormat === '24') {
      // get Hours
      this.endHours.push({value: "00", hour: '00'})
      this.endHours.push({value: "01", hour: '01'})
      this.endHours.push({value: "02", hour: '02'})
      this.endHours.push({value: "03", hour: '03'})
      this.endHours.push({value: "04", hour: '04'})
      this.endHours.push({value: "05", hour: '05'})
      this.endHours.push({value: "06", hour: '06'})
      this.endHours.push({value: "07", hour: '07'})
      this.endHours.push({value: "08", hour: '08'})
      this.endHours.push({value: "09", hour: '09'})
      this.endHours.push({value: "10", hour: '10'})
      this.endHours.push({value: "11", hour: '11'})
      this.endHours.push({value: "13", hour: '13'})
      this.endHours.push({value: "14", hour: '14'})
      this.endHours.push({value: "15", hour: '15'})
      this.endHours.push({value: "16", hour: '16'})
      this.endHours.push({value: "17", hour: '17'})
      this.endHours.push({value: "18", hour: '18'})
      this.endHours.push({value: "19", hour: '19'})
      this.endHours.push({value: "20", hour: '20'})
      this.endHours.push({value: "21", hour: '21'})
      this.endHours.push({value: "22", hour: '22'})
      this.endHours.push({value: "23", hour: '23'})
    }

    if (this.timeFormat === '12') {
      if (this.btnLabelEnd === 'AM') {
        this.endHours.push({value: "01", hour: '1'})
        this.endHours.push({value: "02", hour: '2'})
        this.endHours.push({value: "03", hour: '3'})
        this.endHours.push({value: "04", hour: '4'})
        this.endHours.push({value: "05", hour: '5'})
        this.endHours.push({value: "06", hour: '6'})
        this.endHours.push({value: "07", hour: '7'})
        this.endHours.push({value: "08", hour: '8'})
        this.endHours.push({value: "09", hour: '9'})
        this.endHours.push({value: "10", hour: '10'})
        this.endHours.push({value: "11", hour: '11'})
        this.endHours.push({value: "00", hour: '12'})
      }
      if (this.btnLabelEnd === 'PM') {
        this.endHours.push({value: "13", hour: '1'})
        this.endHours.push({value: "14", hour: '2'})
        this.endHours.push({value: "15", hour: '3'})
        this.endHours.push({value: "16", hour: '4'})
        this.endHours.push({value: "17", hour: '5'})
        this.endHours.push({value: "18", hour: '6'})
        this.endHours.push({value: "19", hour: '7'})
        this.endHours.push({value: "20", hour: '8'})
        this.endHours.push({value: "21", hour: '9'})
        this.endHours.push({value: "22", hour: '10'})
        this.endHours.push({value: "23", hour: '11'})
        this.endHours.push({value: "12", hour: '12'})
      }
    }
  }

//Method to initiate minute dropdown
  initMin() {
    // get Minutes default
    if (this.minStep === 1) {
      for (let i = 0; i < 60; ++i) {
        let min = '';
        if (i <= 9) {
          min = '0' + i;
        } else {
          min = i.toString();
        }
        this.minutes.push(min);
      }
    }

    if (this.minStep === 5) {
      this.minutes = [];
      this.minutes.push('00');
      this.minutes.push('05');
      this.minutes.push('10');
      this.minutes.push('15');
      this.minutes.push('20');
      this.minutes.push('25');
      this.minutes.push('30');
      this.minutes.push('35');
      this.minutes.push('40');
      this.minutes.push('45');
      this.minutes.push('50');
      this.minutes.push('55');
    }

    if (this.minStep === 10) {
      this.minutes = [];
      this.minutes.push('00');
      this.minutes.push('10');
      this.minutes.push('20');
      this.minutes.push('30');
      this.minutes.push('40');
      this.minutes.push('50');
    }

    if (this.minStep === 15) {
      this.minutes = [];
      this.minutes.push('00');
      this.minutes.push('15');
      this.minutes.push('30');
      this.minutes.push('45');
    }
  }

  getHour(value: string, hours: any): string {
    let hour = '';
    hours.forEach((v: { value: string; hour: string; }) => {
      if (value === v.value) {
        hour = v.hour;
      }
    });
    return hour
  }

  getHourValue(hour: string, hours: any): string {
    let value = '';
    hours.forEach((v: { hour: string; value: string; }) => {
      if (hour === v.hour) {
        value = v.value;
      }
    });
    return value;
  }

  onTimeChange(type: string) {
    this.startTimeChange = type === 'start';
    this.endTimeChange = type === 'end';
    this.startTimeMinChange = type === 'startMin';
    this.endTimeMinChange = type === 'endMin';
  }

  public handleBtnClick(event: any) {
    this.onBtnClick?.emit(event);
  }

  public setEndMinToStartMin() {
    let startMin = this.time.controls['startTime'].get('minute')?.value;
    this.time.controls['endTime'].get('minute')?.setValue(startMin, {onlySelf: false, emitEvent: false});
  }
}
