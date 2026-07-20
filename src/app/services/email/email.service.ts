import {Injectable} from '@angular/core';
import {Email} from '../../interfaces/email';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  constructor(private http: HttpClient) {
  }

  sendEmail(email: Email) {
    return this.http.post(environment.ENV_NSYNC_BASE_URL + '/orderDetails/emailDocuments', email);
  }

  sendEmailWithManualDoc(email: Email, type: string | null, key: string) {
    const params = new HttpParams({
      fromObject: {
        key,
      }
    });

    const options = {params};
    return this.http.post(environment.ENV_NSYNC_BASE_URL + '/orderDetails/emailDocuments/' + type, email, options);
  }

  sendTrackingMailTL(truckID: string | null, shipment: any, statusUpdate: any, trackingDate: any, email: string, carrierName: string,
                     trackingEmail: boolean) {
    const trackingState = statusUpdate.trackingState.toString().toUpperCase();
    const location = statusUpdate.currentCity?.toUpperCase() + ', ' + statusUpdate.currentState;
    const trackDate = trackingDate.toString().replace('T', ' ');
    const trackingMessage = (statusUpdate.trackingMessage && statusUpdate.trackingMessage.toString() !== '' ?
      'Message: ' + statusUpdate.trackingMessage : '');

    const emailBody =  this.buildEmailBody(trackingState, shipment, location, trackDate, trackingMessage, trackingEmail,
      truckID, carrierName);
    const emailSubject = (trackingState === 'DELIVERED' ? 'Delivered - ' : '') +
      (trackingEmail ? 'Your ' + shipment.client.companyName.toUpperCase() : '') +
      ' Shipment ID: ' + shipment.shipmentDetail.shipmentID + (truckID ? ' - Truck ID: ' + truckID : '') +
      (trackingEmail ? '.' : ' - Status change notification.');
    this.buildEmailAndSendMail('truckload@il2000.com', email, emailSubject, emailBody);
  }

  sendTrackingMailLTL(shipment: any, statusUpdate: any, trackingDate: any, email: string, trackingEmail: boolean) {
    const location = statusUpdate.currentCity?.toUpperCase() + ', ' + statusUpdate.currentState;
    const trackDate = trackingDate.toString().replace('T', ' ');
    const trackingMessage = (statusUpdate.trackingMessage && statusUpdate.trackingMessage.toString() !== '' ?
      'Message: ' + statusUpdate.trackingMessage : '');
    const trackingState = statusUpdate.trackingState.toString().toUpperCase();

    const sender = shipment.client?.lpTeamEmail ? shipment.client.lpTeamEmail : 'it@il2000.com';
    const emailBody =  this.buildEmailBody(trackingState, shipment, location, trackDate, trackingMessage, trackingEmail);
    const emailSubject = (trackingState === 'DELIVERED' ? 'Delivered - ' : '') +
      (trackingEmail ? 'Your ' + shipment.client.companyName.toUpperCase() : '') +
      ' Shipment ID: ' + shipment.shipmentDetail.shipmentID + (trackingEmail ? '.' : ' - Status change notification.');
    this.buildEmailAndSendMail(sender, email, emailSubject, emailBody);
  }

  sendTrackingMail(shipment: any, historicalEvent: any, email: string, trackingEmail: boolean) {
    const trackingState = historicalEvent.trackingState.toString().toUpperCase();
    const location = historicalEvent.currentCity && historicalEvent.currentState ? historicalEvent.currentCity.toUpperCase() +
      ',' + historicalEvent.currentState.toUpperCase() : (historicalEvent.currentCity != '' && historicalEvent.currentState === '' ?
      historicalEvent.currentCity.toUpperCase() : (historicalEvent.currentCity === '' && historicalEvent.currentState != '' ?
        historicalEvent.currentState.toUpperCase() : ''));
    const trackDate = historicalEvent.eventDate.toString() + ' ' + historicalEvent.eventTime.toString();
    const trackingMessage = (historicalEvent.trackingMessage && historicalEvent.trackingMessage?.toString() !== '' ?
      'Message: ' + historicalEvent.trackingMessage : '');

    const emailBody =  this.buildEmailBody(trackingState, shipment, location, trackDate, trackingMessage, trackingEmail);
    const sender = shipment.client?.lpTeamEmail ? shipment.client.lpTeamEmail : 'it@il2000.com';
    const emailSubject = (trackingState === 'DELIVERED' ? 'Delivered - ' : '') +
      (trackingEmail ? 'Your ' + shipment.client.companyName.toUpperCase() : '') +
      ' Shipment ID: ' + shipment.shipmentDetail.shipmentID + (trackingEmail ? '.' : ' - Status change notification.');
    this.buildEmailAndSendMail(sender, email, emailSubject, emailBody);
  }

  buildEmailBody(status: string, shipment: any, trackingLocation: string, trackingDate: string, trackingMessage: string,
                 trackingEmail: boolean, truckID: string | null = null, carrierName = '') {
    const shipmentID = shipment.shipmentDetail.shipmentID;
    if (trackingEmail) {
      const logoUrl = 'https://s3.amazonaws.com/il2000.com/images/UI-logos/';
      const fullLogoUrl = !shipment.client.logo || shipment.client.logo === '' ? '' :
        '<img src="' + logoUrl + shipment.client.logo + '" alt="Company Logo" width="200" />';
      const carrier = (truckID ? carrierName.toUpperCase() : shipment.carrierDetail.carrierName.toUpperCase());
      if (status === 'DELIVERED') {
        return fullLogoUrl +
          '<h4>Greetings,</h4>' +
          '<p>' +
          'Your order from ' + shipment.client.companyName.toUpperCase() + ' has been delivered. Thank you. <br><br>' +
          'Shipped via ' + carrier + '. <br>' +
          (shipment.shipmentDetail.poNumber ? 'PO Number: ' + shipment.shipmentDetail.poNumber.toString() + '<br>' : '') +
          (shipment.shipmentDetail.bolNumber ? ' BOL Number ' +  shipment.shipmentDetail.bolNumber +  '<br>' :
            shipment.shipmentDetail.proNumber ? ' PRO Number ' +  shipment.shipmentDetail.proNumber +  '<br>' :
              'Shipment ID ' + shipmentID + '<br>') +
          '<br>' +
          '<h4>Click <a href="https://search.apps.il2000.com/?search_type=Shipment ID&Value=' + shipmentID + '" target="_blank"> Here</a>' +
          ' for a link to your tracking information. </h4>' +
          '<br> We\'re pleased to announce another successful delivery! To learn more about eShipping ' +
          ' and our services, please visit us at <a href="https://eshipping.biz/" target="_blank"> eshipping.biz</a> <br>' +
          '</p>';
      } else {
        return fullLogoUrl +
          '<h4>Greetings,</h4>' +
          '<p>' +
          'Thank you for your order from ' + shipment.client.companyName.toUpperCase() + '. Your shipment has been booked. <br><br>' +
          'Ship to: ' + shipment.consignee?.city + ', ' + shipment.consignee?.state + ', '  + shipment.consignee?.zip + '. <br><br>' +
          'You can track your shipment using the following information<br>' +
          'Shipped via ' + carrier + '. <br>' +
          (shipment.shipmentDetail.poNumber ? 'PO Number: ' + shipment.shipmentDetail.poNumber.toString() + '<br>' : '') +
          (shipment.shipmentDetail.bolNumber ? ' BOL Number ' +  shipment.shipmentDetail.bolNumber +  '<br>' :
            shipment.shipmentDetail.proNumber ? ' PRO Number ' +  shipment.shipmentDetail.proNumber +  '<br>' :
              'Shipment ID ' + shipmentID + '<br>') +
          '<br>' +
          '<h4>Click <a href="https://search.apps.il2000.com/?search_type=Shipment ID&Value=' + shipmentID + '" target="_blank"> Here</a>' +
          ' for a link to your tracking information. </h4>' +
          '</p>' +
          '<p style="font-size: x-small;">Your shipment is being proactively monitored by eShipping to ensure the highest level of ' +
          'on time delivery service. Visit <a href="https://eshipping.biz/" target="_blank">eshipping.biz</a></p>';
      }
    } else {
      let refFields = '';
      for (const openRef of shipment?.openReferenceFields) {
        if (openRef.rftID?.toString() === '1' && openRef.value) {
          refFields = refFields + 'PO NUmber: ' + openRef.value + '<br>';
        }
        if (openRef.rftID?.toString() === '2' && openRef.value) {
          refFields = refFields + 'SO Number: ' + openRef.value + '<br>';
        }
      }

      for (const openRef of shipment?.referenceFields) {
        if (openRef.tiberID?.toString() === '1' && openRef.value) {
          refFields = refFields + openRef.description + ': ' + openRef.value + '<br>';
        }
        if (openRef.tiberID?.toString() === '2' && openRef.value) {
          refFields = refFields + openRef.description + ': ' + openRef.value + '<br>';
        }
      }

      return '<p>' +
        (truckID ? 'Truck ID: ' + truckID + '<br>' : '') +
        'Shipment ID:' + shipmentID + '<br>' +
        'Status: ' + status + '<br>' +
        'Location: ' + trackingLocation + '<br>' +
        (shipment.shipmentDetail.poNumber ? 'PO Number: ' + shipment.shipmentDetail.poNumber?.toString() + '<br>' : '') +
        (refFields !== '' ? refFields : '') +
        'Date: ' + trackingDate + '<br>' +
        (trackingMessage !== '' ? trackingMessage + '.<br>' : '') +
        '</p>';
    }
  }

  buildEmailAndSendMail(sender: string, recipient: string, emailSubject: string, emailBody: string) {
    const emailData: Email = {
      from: sender,
      toAddress: recipient,
      ccSender: false,
      ccEmail: null,
      subject: emailSubject,
      message: emailBody,
      attachment: null,
      isHtml: true
    };

    this.sendEmail(emailData).subscribe();
  }
}
