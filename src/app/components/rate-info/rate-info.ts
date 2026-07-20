import {Component, input, Input, OnInit} from '@angular/core';
import {OriginalRate, SelectedRate} from '../../interfaces/selectedRate';

@Component({
  selector: 'app-rate-info',
  standalone: false,
  templateUrl: './rate-info.html',
  styleUrl: './rate-info.css',
})
export class RateInfo implements OnInit {
  selectedRate = input <SelectedRate | null>(null);
  //@Input() selectedRate: SelectedRate | null = null;
  expandDetails = false;
  expandCharges = false;
  originalRate: OriginalRate | null = null;
  datRate: any = null;
  foundProvider = false;
  constructor() { }

  ngOnInit(): void {
    if (this.selectedRate()) {
      this.setValueFromRate();
    }
  }

  setValueFromRate() {
    const provider = this.selectedRate()?.carrierType;
    this.foundProvider = false;
    const rate: any = JSON.parse(this.selectedRate()?.rates ?? '');

    if (provider === 'P44') {
      this.foundProvider = true;
      this.originalRate = {
        quoteNumber: rate?.capacityProviderQuoteNumber ?? '-',
        carrierCode: rate?.carrierCode ?? '-',
        currencyCode: rate?.currencyCode ?? '-',
        transitTime: rate?.transitDays ?? '-',
        serviceLevel: rate?.serviceLevel?.description ?? '-',
        serviceLevelCode: rate?.serviceLevel?.code ?? '-',
        amount: rate?.rateQuoteDetail?.total ?? '-',
        charges: [],
        rateExpireDate: rate?.rateExpireDate ?? '-',
        fuelDate: rate?.rateFuelDate ?? '-',
        notes: rate?.infoMessages ? (rate?.infoMessages[0]?.message ?? '-') : '-',
        deliveryDate: rate?.deliveryDateTime ?? '-'
      };
      if (rate?.rateQuoteDetail?.charges) {
        const charges = rate?.rateQuoteDetail?.charges ?? [];
        for (const charge of charges) {
          this.originalRate.charges.push({
            code: charge?.code ?? '-',
            description: charge?.description ?? '-',
            amount: charge?.amount ?? '-',
          });
        }
      }
    }

    if (provider === 'EFW') {
      this.foundProvider = true;
      this.originalRate = {
        quoteNumber: rate?.serviceLevelQuoteId ?? '-',
        carrierCode: '-',
        currencyCode: '-',
        transitTime: '-',
        serviceLevel: '-',
        serviceLevelCode: rate?.serviceLevelID ?? '-',
        amount: rate?.standardTotalRate ?? '-',
        charges: [],
        rateExpireDate: '-',
        fuelDate: '-',
        notes: '-',
        deliveryDate: '-'
      };
      if (rate?.accessorialCharges) {
        const charges = rate?.accessorialCharges ?? [];
        for (const charge of charges) {
          this.originalRate.charges.push({
            code: charge?.chargeCode ?? '-',
            description: charge?.chargeDesc ?? '-',
            amount: charge?.chargeAmount ?? '-',
          });
        }
      }
    }

    if (provider === 'METROPOLITAN') {
      this.foundProvider = true;
      this.originalRate = {
        quoteNumber: rate?.quote_id ?? '-',
        carrierCode: '-',
        currencyCode: '-',
        transitTime: rate?.transit_info?.business_days ?? '-',
        serviceLevel: rate?.rate_service_level_name ?? '-',
        serviceLevelCode: rate?.rate_service_level ?? '-',
        amount: rate?.quote_response?.total_price ?? '-',
        charges: [],
        rateExpireDate: rate?.quote_expire_date ?? '-',
        fuelDate: rate?.fuel_applicable_date ?? '-',
        notes: rate?.quote_response?.disclaimer ?? '-',
        deliveryDate: '-'
      };
      if (rate?.quote_response?.items) {
        const charges = rate?.quote_response?.items ?? [];
        for (const charge of charges) {
          this.originalRate.charges.push({
            code: charge?.rate_code ?? '-',
            description: charge?.rate_name ?? '-',
            amount: charge?.rate_value ?? '-',
          });
        }
      }
    }

    if (provider === 'FEDEX') {
      this.foundProvider = true;
      this.originalRate = {
        quoteNumber: rate?.id ?? '-',
        carrierCode: '-',
        currencyCode: rate?.ratedShipmentDetails ? (rate?.ratedShipmentDetails[0]?.currency ?? '-') : '-',
        transitTime: '-',
        serviceLevel: rate?.serviceName ?? '-',
        serviceLevelCode: rate?.serviceType ?? '-',
        amount: rate?.ratedShipmentDetails ? (rate?.ratedShipmentDetails[0]?.totalBaseCharge ?? '-') : '-',
        charges: [],
        rateExpireDate: '-',
        fuelDate: '-',
        notes: rate?.customerMessages ? (rate?.customerMessages[0].message ?? '-') : '-',
        deliveryDate: rate?.operationalDetail ? (rate?.operationalDetail?.deliveryDate ?? '-') : '-'
      };
      if (rate?.ratedShipmentDetails && rate?.ratedShipmentDetails[0]?.shipmentRateDetail?.surCharges) {
        const charges = rate?.ratedShipmentDetails[0]?.shipmentRateDetail?.surCharges ?? [];
        for (const charge of charges) {
          this.originalRate.charges.push({
            code: charge?.type ?? '-',
            description: charge?.description ?? '-',
            amount: charge?.amount ?? '-',
          });
        }
      }
    }

    if (provider === 'VOLUME') {
      this.foundProvider = true;
      this.originalRate = {
        quoteNumber: rate?.quoteNumber ?? '-',
        carrierCode: rate?.carrierScac ?? '-',
        currencyCode: rate?.clientQuote?.currencyType ?? '-',
        transitTime: rate?.transitTime ?? '-',
        serviceLevel: rate?.carrierName ?? '-'  ,
        serviceLevelCode: rate?.serviceLevel ?? '-',
        amount: rate?.clientQuote?.quote ?? '-',
        charges: [],
        rateExpireDate: rate?.expirationDate ?? '-',
        fuelDate: '-',
        notes: '-',
        deliveryDate: '-'
      };
    }

    if (provider === 'SMC3') {
      this.foundProvider = true;
      this.originalRate = {
        quoteNumber: rate?.quoteId ?? '-',
        carrierCode: rate?.scac ?? '-',
        currencyCode: '-',
        transitTime: rate?.transit?.carrierConnectInfo?.estimatedTransitDays ?? '-',
        serviceLevel: rate?.service?.description ?? '-',
        serviceLevelCode: rate?.service?.level ?? '-',
        amount: rate?.shipmentInfo?.totalCharge ?? '-',
        charges: [],
        rateExpireDate: '-',
        fuelDate: '-',
        notes: rate?.messageStatus?.message ?? '-',
        deliveryDate: rate?.transit?.carrierConnectInfo?.estimatedDeliveryDate ?? '-',
      };
      if (rate?.accessorials) {
        const charges = rate?.accessorials ?? [];
        for (const charge of charges) {
          this.originalRate.charges.push({
            code: charge?.code ?? '-',
            description: charge?.description ?? '-',
            amount: charge?.chargeAmount ?? '-',
          });
        }
      }
    }

    if (provider === 'WCE') {
      this.foundProvider = true;
      this.originalRate = {
        quoteNumber: rate['quote-number'] ?? '-',
        carrierCode: '-',
        currencyCode: '-',
        transitTime: '-',
        serviceLevel: '-',
        serviceLevelCode: rate['tariff-code'] ?? '-',
        amount: rate['total-charge'] ?? '-',
        charges: [],
        rateExpireDate: '-',
        fuelDate: '-',
        deliveryDate: '-',
        notes: rate?.genericProperties['tariff-warning'] ?? '-'
      };
      this.originalRate.charges.push({
        code: 'fuel-surcharge',
        description: '-',
        amount: rate['fuel-surcharge'] ?? '-'
      });
      this.originalRate.charges.push({
        code: 'gst-pst',
        description: '-',
        amount: rate['gst-pst'] ?? '-'
      });
    }

    if (provider === 'DAT') {
      this.foundProvider = true;
      this.datRate = rate;
    }

    if (provider === 'GLS') {
      this.foundProvider = true;
      const tariff = rate?.rates ? rate?.rates[0] : [];
      this.originalRate = {
        quoteNumber: rate?.rateRequestNumber ?? '-',
        carrierCode: '-',
        currencyCode: '-',
        transitTime: tariff?.transitDays ?? '-',
        serviceLevel: '-',
        serviceLevelCode: '-',
        amount: tariff?.total ?? '-',
        charges: [],
        rateExpireDate: '-',
        fuelDate: '-',
        notes: '-',
        deliveryDate: '-'
      };
      if (tariff?.surcharges) {
        const charges = tariff?.surcharges ?? [];
        for (const charge of charges) {
          this.originalRate.charges.push({
            code: charge?.type ?? '-',
            description: charge?.name ?? '-',
            amount: charge?.amount ?? '-',
          });
        }
      }
      if (tariff?.taxesDetails) {
        const charges = tariff?.taxesDetails ?? [];
        for (const charge of charges) {
          this.originalRate.charges.push({
            code: charge?.type ?? '-',
            description: charge?.type ?? '-',
            amount: charge?.amount ?? '-',
          });
        }
      }
      if (tariff?.fuelCharge) {
        this.originalRate.charges.push({
          code: '-',
          description: 'Fuel surcharge',
          amount: tariff?.fuelCharge,
        });
      }
      if (tariff?.otherCharge) {
        this.originalRate.charges.push({
          code: '-',
          description: 'Other Charges',
          amount: tariff?.otherCharge,
        });
      }
    }

    if (!this.foundProvider) {
      this.convertJsonToForm(rate);
    }
  }

  convertJsonToForm(jsonRate: any) {

    const createFormGroup = (key: any, obj: any) => {
      let formData = '';

      for (const [key, value] of Object.entries(obj)) {

        if (typeof value === 'object') {
          // this is the recursive call
          formData = formData + '</div>' +
            ' <div class="row py-2">' +
            '    <div class="col-12" style="background-color: #007bff;">' +
            '      <label style="color: white; margin: 5px;">' + this.splitAndCapitalize(key) + '</label>' +
            '    </div>' +
            '  </div>';
          formData = formData + createFormGroup(key, value);
        } else {
          formData = formData === '' ? '<div class="row">' : formData;
          formData = formData + '<div class="col pb-2 mx-2" style="font-weight: 500 !important;">' +
            this.splitAndCapitalize(key) +
            '  <span style="font-weight: 400 !important;font-size: .7rem !important;">' + value + '</span>' +
            ' </div>';
        }
      }
      return formData;
    };

    setTimeout(() => {
      $('#formControl').append(createFormGroup('Rate', jsonRate));
    }, 1000);
  }

  splitAndCapitalize(str: string) {
    // Split by uppercase letters, preserving them with a lookahead
    const words = str.split(/(?=[A-Z])/);
    // Capitalize each word and join with a space
    return words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  getRateDate(){
    return this.selectedRate()?.rateDate?.substring(0,10) ?? ''
  }
}

