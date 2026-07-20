export interface ShippingDetails {
  id: number;
  group: string | null;
  pronumber: string | null;
  ponumber: string | null;
  bolnumber: string | null;
  quoteid: string | null;
  shipdate: Date | null;
  iscorrectedbol: boolean | false;
  dateCreated: Date | null;
  lastModified: Date | null;
  specialInstructions: string | null;
  quotedcost: number | null;
  isspotrate: boolean | false;
  customerCost: number | null;
  customerrate: number | null;
  mergedShipmentId: number | null;
  mode: string | null;
  terms: string | null;
  shipmentState: string | null;
  createdBy: {
    userName: string | null,
    groupName: string | null,
    email: string | null
  };
  lastModifiedBy: {
    userName: string | null,
    groupName: string | null,
    email: string | null
  };
  shipper: {
    companyName: string | null,
    id: number | null,
    address: {
      name: string | null,
      streetAddress: string | null,
      address2: string | null,
      address3: string | null,
      city: string | null,
      state: string | null,
      zip: string | null,
      country: string | null
    },
    moniker: string | null,
    contact: {
      name: string | null,
      phone: string | null,
      email: string | null
    }
  };
  consignee: {
    companyName: string | null,
    id: number | null
    address: {
      name: string | null,
      streetAddress: string | null,
      address2: string | null,
      address3: string | null,
      city: string | null,
      state: string | null,
      zip: string | null,
      country: string | null
    },
    moniker: string | null,
    contact: {
      name: string | null,
      phone: string | null
      email: string | null
    }
  };
  billto: {
    name: string | null,
    streetAddress: string | null,
    address2: string | null,
    address3: string | null,
    city: string | null,
    state: string | null,
    zip: string | null,
    country: string | null,
    id: number | null
  };
  cod: {
    address: {
      name: string | null,
      streetAddress: string | null,
      address2: string | null,
      address3: string | null,
      city: string | null,
      state: string | null,
      zip: string | null,
      country: string | null,
    },
    terms: string | null,
    currency: number | null,
    ammount: number | null,
  };
  carrier: {
    id: number | null,
    tiberID: number | null,
    name: string | null,
    microserviceEndpoint: string | null,
    trackingAPIEnabled: boolean | false,
    available: boolean | false,
    scac: string | null
  };
  accessorials: String[];
  references: [{ name: string | null, value: string | null }];
  lineitems: [
    {
      purchaseOrderRef: string | null,
      packaging: string | null,
      handlingUnitCount: number | null,
      handlingUnitType: string | null
      length: number | null,
      height: number | null,
      width: number | null,
      weight: number | null,
      description: number | null,
      freightClass: number | null,
      isHazmat: boolean | false,
      productCode: string | null,
      numberOfPieces: number | null,
      serial: string | null,
      nmfc: string | null,
      nmfcsub: string | null,
      stackable: boolean | false
    }
  ];
  totalWeight: number | null;
  totalHU: number | null;
  workflow: string | null;
}
