import {Injectable, signal} from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {ShipmentTracking} from '../../interfaces/shipment-tracking';

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  constructor() {}
  public isrequired = [false];
  public pickupDateRequired = [true];
  public deliveryDateRequired = [true];
  public check = false;
  public btnRate = false;
  public resetFilter = new Subject<boolean>();
  public quotescheck = false;
  public accessorialType: any = [];
  public isQuickRates = false;

  private truckloadTrackingStatus = new BehaviorSubject<string>('truckloadTracking');
  private trackingStatus = new BehaviorSubject<string>('All');
  private trackingTruckloadRequestForQuote = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckloadSubmittedQuotes = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckloadInTransit = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckloadProblem = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckloadFailure = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckloadDispatched = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckloadAll = new BehaviorSubject<ShipmentTracking[] | null>(null);
  private trackingLateQuoteResponses = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingPrebookedNoteLate = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingPrebookedAndLate = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingPickupDateAndTimePassed = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingAppointmentRequired = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckloadAppointmentRequired = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingMissingTransitUpdateRecord = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingLateDelivery = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckloadPending = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingDeliveredNeedsPOD = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckPrebookRolled = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckAtPickupStop = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckAtDelivery = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingTruckDelivered = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingDelivered = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingAll = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingPending = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingElevated = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingExpedited = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingPickupElevated = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingPickupExpedited = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingDeliveryDateException = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingUnableToDeliver = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingPickupMissed = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingDelayed = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingMABD = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingSubmittedQuotes = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingRequestForQuote = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingUnabletoTrack = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingBookedNotLate = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingLatePickups = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingDeliveryToday = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingDeliveryOSD = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingReturns = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingProblem = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingOcean = new BehaviorSubject<ShipmentTracking[] | null>([]);
  private trackingWhiteboard = new BehaviorSubject<ShipmentTracking[] | null>([]);

  truckloadTrackingStatus$ = this.truckloadTrackingStatus.asObservable();
  updateTruckloadTrackingStatus(value: string) { this.truckloadTrackingStatus.next(value); }
  trackingStatus$ = this.trackingStatus.asObservable();
  updateTrackingStatus(value: string) { this.trackingStatus.next(value); }
  trackingTruckloadRequestForQuote$ = this.trackingTruckloadRequestForQuote.asObservable();
  updateTrackingTruckloadRequestForQuote(value: any) { this.trackingTruckloadRequestForQuote.next(value); }
  trackingTruckloadSubmittedQuotes$ = this.trackingTruckloadSubmittedQuotes.asObservable();
  updateTrackingTruckloadSubmittedQuotes(value: any) { this.trackingTruckloadSubmittedQuotes.next(value); }
  trackingTruckloadInTransit$ =  this.trackingTruckloadInTransit.asObservable();
  updateTrackingTruckloadInTransit(value: any) { this.trackingTruckloadInTransit.next(value); }
  trackingTruckloadProblem$ =  this.trackingTruckloadProblem.asObservable();
  updateTrackingTruckloadProblem(value: any) { this.trackingTruckloadProblem.next(value); }
  trackingTruckloadFailure$ =  this.trackingTruckloadFailure.asObservable();
  updateTrackingTruckloadFailure(value: any) { this.trackingTruckloadFailure.next(value); }
  trackingTruckloadDispatched$ =  this.trackingTruckloadDispatched.asObservable();
  updateTrackingTruckloadDispatched(value: any) { this.trackingTruckloadDispatched.next(value); }
  trackingTruckloadAll$ =  this.trackingTruckloadAll.asObservable();
  updateTrackingTruckloadAll(value: any) { this.trackingTruckloadAll.next(value); }
  trackingLateQuoteResponses$ =  this.trackingLateQuoteResponses.asObservable();
  updateTrackingLateQuoteResponses(value: any) { this.trackingLateQuoteResponses.next(value); }
  trackingPrebookedNoteLate$ =  this.trackingPrebookedNoteLate.asObservable();
  updateTrackingPrebookedNoteLate(value: any) { this.trackingPrebookedNoteLate.next(value); }
  trackingPrebookedAndLate$ =  this.trackingPrebookedAndLate.asObservable();
  updateTrackingPrebookedAndLate(value: any) { this.trackingPrebookedAndLate.next(value); }
  trackingPickupDateAndTimePassed$ =  this.trackingPickupDateAndTimePassed.asObservable();
  updateTrackingPickupDateAndTimePassed(value: any) { this.trackingPickupDateAndTimePassed.next(value); }
  trackingAppointmentRequired$ =  this.trackingAppointmentRequired.asObservable();
  updateTrackingAppointmentRequired(value: any) { this.trackingAppointmentRequired.next(value); }
  trackingTruckloadAppointmentRequired$ =  this.trackingTruckloadAppointmentRequired.asObservable();
  updateTrackingTruckloadAppointmentRequired(value: any) { this.trackingTruckloadAppointmentRequired.next(value); }
  trackingMissingTransitUpdateRecord$ =  this.trackingMissingTransitUpdateRecord.asObservable();
  updateTrackingMissingTransitUpdateRecord(value: any) { this.trackingMissingTransitUpdateRecord.next(value); }
  trackingLateDelivery$ =  this.trackingLateDelivery.asObservable();
  updateTrackingLateDelivery(value: any) { this.trackingLateDelivery.next(value); }
  trackingTruckloadPending$ =  this.trackingTruckloadPending.asObservable();
  updateTrackingTruckloadPending(value: any) { this.trackingTruckloadPending.next(value); }
  trackingDeliveredNeedsPOD$ =  this.trackingDeliveredNeedsPOD.asObservable();
  updateTrackingDeliveredNeedsPOD(value: any) { this.trackingDeliveredNeedsPOD.next(value); }
  trackingTruckPrebookRolled$ =  this.trackingTruckPrebookRolled.asObservable();
  updateTrackingTruckPrebookRolled(value: any) { this.trackingTruckPrebookRolled.next(value); }
  trackingTruckAtPickupStop$ =  this.trackingTruckAtPickupStop.asObservable();
  updateTrackingTruckAtPickupStop(value: any) { this.trackingTruckAtPickupStop.next(value); }
  trackingTruckAtDelivery$ =  this.trackingTruckAtDelivery.asObservable();
  updateTrackingTruckAtDelivery(value: any) { this.trackingTruckAtDelivery.next(value); }
  trackingTruckDelivered$ =  this.trackingTruckDelivered.asObservable();
  updateTrackingTruckDelivered(value: any) { this.trackingTruckDelivered.next(value); }
  trackingDelivered$ =  this.trackingDelivered.asObservable();
  updateTrackingDelivered(value: any) { this.trackingDelivered.next(value); }
  trackingAll$ =  this.trackingAll.asObservable();
  updateTrackingAll(value: any) { this.trackingAll.next(value); }
  trackingPending$ =  this.trackingPending.asObservable();
  updateTrackingPending(value: any) { this.trackingPending.next(value); }
  trackingElevated$ =  this.trackingElevated.asObservable();
  updateTrackingElevated(value: any) { this.trackingElevated.next(value); }
  trackingExpedited$ =  this.trackingExpedited.asObservable();
  updateTrackingExpedited(value: any) { this.trackingExpedited.next(value); }
  trackingPickupElevated$ =  this.trackingPickupElevated.asObservable();
  updateTrackingPickupElevated(value: any) { this.trackingPickupElevated.next(value); }
  trackingPickupExpedited$ =  this.trackingPickupExpedited.asObservable();
  updateTrackingPickupExpedited(value: any) { this.trackingPickupExpedited.next(value); }
  trackingDeliveryDateException$ =  this.trackingDeliveryDateException.asObservable();
  updateTrackingDeliveryDateException(value: any) { this.trackingDeliveryDateException.next(value); }
  trackingUnableToDeliver$ =  this.trackingUnableToDeliver.asObservable();
  updateTrackingUnableToDeliver(value: any) { this.trackingUnableToDeliver.next(value); }
  trackingPickupMissed$ =  this.trackingPickupMissed.asObservable();
  updateTrackingPickupMissed(value: any) { this.trackingPickupMissed.next(value); }
  trackingDelayed$ =  this.trackingDelayed.asObservable();
  updateTrackingDelayed(value: any) { this.trackingDelayed.next(value); }
  trackingMABD$ =  this.trackingMABD.asObservable();
  updateTrackingMABD(value: any) { this.trackingMABD.next(value); }
  trackingSubmittedQuotes$ =  this.trackingSubmittedQuotes.asObservable();
  updateTrackingSubmittedQuotes(value: any) { this.trackingSubmittedQuotes.next(value); }
  trackingRequestForQuote$ =  this.trackingRequestForQuote.asObservable();
  updateTrackingRequestForQuote(value: any) { this.trackingRequestForQuote.next(value); }
  trackingUnabletoTrack$ =  this.trackingUnabletoTrack.asObservable();
  updateTrackingUnabletoTrack(value: any) { this.trackingUnabletoTrack.next(value); }
  trackingBookedNotLate$ =  this.trackingBookedNotLate.asObservable();
  updateTrackingBookedNotLate(value: any) { this.trackingBookedNotLate.next(value); }
  trackingLatePickups$ =  this.trackingLatePickups.asObservable();
  updateTrackingLatePickups(value: any) { this.trackingLatePickups.next(value); }
  trackingDeliveryToday$ =  this.trackingDeliveryToday.asObservable();
  updateTrackingDeliveryToday(value: any) { this.trackingDeliveryToday.next(value); }
  trackingDeliveryOSD$ =  this.trackingDeliveryOSD.asObservable();
  updateTrackingDeliveryOSD(value: any) { this.trackingDeliveryOSD.next(value); }
  trackingReturns$ =  this.trackingReturns.asObservable();
  updateTrackingReturns(value: any) { this.trackingReturns.next(value); }
  trackingProblem$ =  this.trackingProblem.asObservable();
  updateTrackingProblem(value: any) { this.trackingProblem.next(value); }
  trackingOcean$ =  this.trackingOcean.asObservable();
  updateTrackingOcean(value: any) { this.trackingOcean.next(value); }
  trackingWhiteboard$ =  this.trackingWhiteboard.asObservable();
  updateTrackingWhiteboard(value: any) { this.trackingWhiteboard.next(value); }
}
