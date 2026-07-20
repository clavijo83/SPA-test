import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {ReportDocument} from '../../interfaces/document';
import {Note} from '../../interfaces/note';
import {map} from 'rxjs/operators';
import {CostDetails} from '../../interfaces/cost-details';
import {ShippingDetailsUpdate} from '../../interfaces/shipping-details-update';
import {LambdaFile} from '../../interfaces/lambda-file';
import {ShippersConsignees} from '../../interfaces/shippers-consignees';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  options = {
    responseType: 'arraybuffer' as 'json'
  };

  constructor(private httpClient: HttpClient) {
  }

  getBookingDetails(BOLNumber: string): Observable<any> {
    return this.httpClient.get(environment.ENV_NSYNC_BASE_URL + '/orderDetails/booking/' + BOLNumber);
  }

  // get all available statuses to use in drop-down on tracking edit - LTL
  getAvailableStatuses(): Observable<any> {
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/available-statuses/ltl');
  }

  getAvailableExceptions(type: string): Observable<any> {
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/exceptions/' + type);
  }

  getAvailableStatusesTL(): Observable<any> {
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/available-statuses/tl');
  }

  // get the shipment history from lambda; includes historicalEvent[] and stop[], pickup and delivery
  getShipmentHistory(shipmentID: string): Observable<any> {
    return this.httpClient.get<any>(environment.SHIPMENT_HISTORY_URL + '/shipment-history?shipmentID=' + shipmentID);
  }

  // post historical event to database from lambda
  addShipmentHistory(shipmentID: string, historicalEvent: any): Observable<any> {
    return this.httpClient.post<any>(environment.SHIPMENT_HISTORY_URL + '/shipment-history?shipmentID=' + shipmentID, historicalEvent);
  }

  // update tracking shipment details to database from lambda - currently only updates proNumber, actualShipDate, carrierEstimatedDeliveryDate, actualDeliveryDate
  updateTrackingShipmentDetails(shipmentID: string, shipmentDetails: any) {
    return this.httpClient.put<any>(environment.SHIPMENT_HISTORY_URL + '/shipment-detail?shipmentID=' + shipmentID, shipmentDetails);
  }

  getShippingDetails(shipmentID: string): Observable<any> {
    return this.httpClient.get(environment.ENV_NSYNC_BASE_URL + '/shipments/' + shipmentID);
  }

  getCostDetails(shipmentID: number): Observable<any> {
    return this.httpClient.get(environment.ENV_NSYNC_BASE_URL + '/orderDetails/charges/' + shipmentID);
  }

  getDocuments(shipmentID: number): ReportDocument[] {
    let documents: ReportDocument[] = [] as ReportDocument[];
    const origBOL = {
      url: '',
      type: 'Original BOL',
      format: 'PDF',
      items: 1
    } as ReportDocument;
    const huLabels = {
      url: environment.ENV_ICARUS_BASE_URL + '/ship/labelbatchscreen?numrows=1&check0=on&id0=' + shipmentID + '&type=hu',
      type: 'HU Labels',
      format: 'PDF',
      items: 1
    } as ReportDocument;
    const tpLabels = {
      url: environment.ENV_ICARUS_BASE_URL + '/ship/labelbatchscreen?numrows=1&check0=on&id0=' + shipmentID + '&type=piece',
      type: '3 Piece Labels',
      format: 'PDF',
      items: 1
    } as ReportDocument;
    const refSupplement = {
      url: environment.ENV_ICARUS_BASE_URL + '/ship/printreference.jsp?id=' + shipmentID,
      type: 'Reference Supplement',
      format: 'PDF',
      items: 1
    } as ReportDocument;
    const purchaseOrder = {
      url: environment.ENV_ICARUS_BASE_URL + '/ship/printpo.jsp?id=' + shipmentID,
      type: 'Purchase Order',
      format: 'PDF',
      items: 1
    } as ReportDocument;

    documents.push(origBOL);
    documents.push(huLabels);
    documents.push(tpLabels);
    documents.push(refSupplement);
    documents.push(purchaseOrder);
    return documents;
  }

  getDocsFromTable(shipmentID: number): Observable<any> {
    return this.httpClient.get(environment.ENV_NSYNC_BASE_URL + '/orderDetails/documents/' + shipmentID);
  }

  getP44BOL(shipmentID: number): Observable<any> {
    return this.httpClient.get(environment.ENV_NSYNC_BASE_URL + '/tracking/docs/' + shipmentID + '/BOL');
  }

  getP44POD(shipmentID: number): Observable<any> {
    return this.httpClient.get(environment.ENV_NSYNC_BASE_URL + '/tracking/docs/' + shipmentID + '/POD');
  }

  getNotes(shipmentID: number): Observable<Note[]> | Observable<any> {
    return this.httpClient.get<Note[]>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/notes/' + shipmentID);
  }

  addNote(shipmentID: number, isClientNote: boolean, note: Note) {
    return this.httpClient.post(environment.ENV_NSYNC_BASE_URL + '/orderDetails/notes/' + shipmentID + '/' + isClientNote, note);
  }

  updateCharges(BOLNumber: string, costDetails: CostDetails) {
    return this.httpClient.post(environment.ENV_NSYNC_BASE_URL + '/orderDetails/charges/' + BOLNumber, costDetails);
  }


  updateShippingDetails(BOLNumber: string, shippingDetailsUpdate: ShippingDetailsUpdate) {
    return this.httpClient.post(environment.ENV_NSYNC_BASE_URL + '/orderDetails/shipping/' + BOLNumber, shippingDetailsUpdate);
  }

  getImageStream(ShipmentID: string, ImageID: string): Observable<any> {
    return this.httpClient.get<any>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/imageStream/' + ShipmentID + '/' + ImageID, this.options);
  }

  getBOLFromLambda(ShipmentID: number, typeDoc: string = 'bol'): Observable<LambdaFile> | Observable<any> {
    return this.httpClient.get<LambdaFile>(environment.ENV_LAMBDA_API_BASE_URL + '/docgen?shipmentId=' + ShipmentID + '&type=' + typeDoc + '&view=pdf');
  }

  getPRONumber(ShipmentID: number): Observable<string> | Observable<any> {
    return this.httpClient.get<string>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/proNumber/' + ShipmentID);
  }

  getShippersAndConsignees(GroupID: number): Observable<ShippersConsignees> | Observable<any> {
    return this.httpClient.get<ShippersConsignees>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/grouplocations/' + GroupID);
  }

  getReportsPendingPickup() {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_RECORDS_API_BASE_URL + '/records?filter=PENDING_PICKUP').pipe(
      map((response) => {
          return response.body;
        })
    );
  }

  getReportsQuote() {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_RECORDS_API_BASE_URL + '/records?filter=QUOTE_SENT_TO_CLIENT').pipe(
      map(
        (response) => {
          return response.body;
        })
    );
  }

  getReportsShipmentSearch(Input: string) {
    return this.httpClient.get<any>(environment.ENV_NSYNC_BASE_URL + '/orderDetails/search/' + Input);
  }

  getReportsIncomplete() {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_RECORDS_API_BASE_URL + '/records?filter=INCOMPLETE').pipe(
      map(
        (response) => {
          return response.body;
        })
    );
  }

  getReportsDelivered() {
    return this.httpClient.get<any>(environment.ENV_LAMBDA_RECORDS_API_BASE_URL + '/records?filter=DELIVERED').pipe(
      map(
        (response) => {
          return response.body;
        })
    );
  }

  getTruckBOLFromLambda(TruckID: any, typeDoc: string = 'bol'): Observable<LambdaFile> | Observable<any> {
    return this.httpClient.get<LambdaFile>(environment.ENV_LAMBDA_API_BASE_URL + '/docgen?truckId=' + TruckID + '&type=' + typeDoc + '&view=pdf');
  }

  getCCFromLambda(ShipmentID: number, typeDoc: string = 'carrierconfirmation'): Observable<LambdaFile> | Observable<any> {
    return this.httpClient.get<LambdaFile>(environment.ENV_LAMBDA_API_BASE_URL + '/docgen?shipmentId=' + ShipmentID + '&type=' + typeDoc + '&view=pdf');
  }

  getCQFromLambda(ShipmentID: number, typeDoc: string = 'clientquote'): Observable<LambdaFile> | Observable<any> {
    return this.httpClient.get<LambdaFile>(environment.ENV_LAMBDA_API_BASE_URL + '/docgen?shipmentId=' + ShipmentID + '&type=' + typeDoc + '&view=pdf');
  }

  getTruckCCFromLambda(quoteID: number, typeDoc: string = 'carrierconfirmation'): Observable<LambdaFile> | Observable<any> {
    return this.httpClient.get<LambdaFile>(environment.ENV_LAMBDA_API_BASE_URL + '/docgen?quoteNumber=' + quoteID + '&type=' + typeDoc + '&view=pdf');
  }

  getTruckClientQuoteFromLambda(quoteID: number, typeDoc: string = 'clientquote'): Observable<LambdaFile> | Observable<any> {
    return this.httpClient.get<LambdaFile>(environment.ENV_LAMBDA_API_BASE_URL + '/docgen?quoteNumber=' + quoteID + '&type=' + typeDoc + '&view=pdf');
  }

  getRecordsShipmentSearch(fields: any): Observable<any> {
    return this.httpClient.post<any>(environment.SHIPMENT_HISTORY_URL + '/search-records', fields);
  }

  getDocumentFromLambda(quoteID: string, typeDoc: 'carrierconfirmation' | 'clientquote' | 'tnuconfirmation'): Observable<LambdaFile> | Observable<any> {
    return this.httpClient.get<LambdaFile>(environment.ENV_LAMBDA_API_BASE_URL + '/docgen?view=pdf&type=' + typeDoc + '&quoteNumber=' + quoteID);
  }

  getCanadianTimezone(): Observable<any> {
    return this.httpClient.get(environment.SHIPMENT_HISTORY_URL + '/get-canadian-timezones');
  }
}
