import {ImageType} from '../interfaces/image-type';
import {Dropdown} from '../interfaces/dropdown';

export class Constants {
  public static QUICK_RATE_PICKUP_ACCESSORIALS = [
    {
      chtID: 23,
      chtDescription: 'Construction Site'
    },
    {
      chtID: 22,
      chtDescription: 'Hazmat'
    },
    {
      chtID: 169,
      chtDescription: 'Keep From Freezing'
    },
    {
      chtID: 21,
      chtDescription: 'Set Appointment'
    },
    {
      chtID: 7,
      chtDescription: 'Lift Gate Req'
    }
  ];

  public static QUICK_RATE_PICKUP_ACCESSORIALS_LTL = [
    {
      chtID: 21,
      chtDescription: 'Set Appointment'
    },
    {
      chtID: 23,
      chtDescription: 'Construction Site'
    },
    {
      chtID: 912,
      chtDescription: 'Grocery Warehouse'
    },
    {
      chtID: 22,
      chtDescription: 'Hazmat'
    },
    {
      chtID: 26,
      chtDescription: 'Inside Delivery'
    },
    {
      chtID: 7,
      chtDescription: 'Lift Gate Req'
    },
    {
      chtID: 180,
      chtDescription: 'Limited Access Del.'
    },
    {
      chtID: 24,
      chtDescription: 'Military Delivery'
    },
    {
      chtID: 4,
      chtDescription: 'Notify Before Del.'
    },
    {
      chtID: 169,
      chtDescription: 'Keep From Freezing'
    },
    {
      chtID: 25,
      chtDescription: 'Residential Delivery'
    },
    {
      chtID: 916,
      chtDescription: 'Additional Insurance'
    }
  ];

  public static QUICK_RATE_DELIVERY_ACCESSORIALS = [
    {
      chtID: 26,
      chtDescription: 'Inside Delivery'
    },
    {
      chtID: 180,
      chtDescription: 'Limited Access Del.'
    },
    {
      chtID: 24,
      chtDescription: 'Military Delivery'
    },
    {
      chtID: 4,
      chtDescription: 'Notify Before Del.'
    },
    {
      chtID: 25,
      chtDescription: 'Residential Delivery'
    },
    {
      chtID: 7,
      chtDescription: 'Lift Gate Req'
    }
  ];

  public static QUICK_RATE_DELIVERY_ACCESSORIALS_LTL = [
    {
      chtID: 21,
      chtDescription: 'Set Appointment'
    },
    {
      chtID: 23,
      chtDescription: 'Construction Site'
    },
    {
      chtID: 912,
      chtDescription: 'Grocery Warehouse'
    },
    {
      chtID: 22,
      chtDescription: 'Hazmat'
    },
    {
      chtID: 26,
      chtDescription: 'Inside Delivery'
    },
    {
      chtID: 7,
      chtDescription: 'Lift Gate Req'
    },
    {
      chtID: 180,
      chtDescription: 'Limited Access Del.'
    },
    {
      chtID: 24,
      chtDescription: 'Military Delivery'
    },
    {
      chtID: 4,
      chtDescription: 'Notify Before Del.'
    },
    {
      chtID: 25,
      chtDescription: 'Residential Delivery'
    }
  ];

  public static STATE_DROPDOWN = ['AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA',
    'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE',
    'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX',
    'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY',
    // Mexican states
    'AG', // AGUASCALIENTES
    'BN', // BAJA CALIFORNIA NORTE
    'BS', // BAJA CALIFORNIA SUR
    'CH', // COAHUILA
    'CI', // CHIHUAHUA
    'CL', // COLIMA
    'CP', // CAMPECHE
    'CS', // CHIAPAS
    'DF', // DISTRICTO FEDERAL
    'DG', // DURANGO
    'GE', // GUERRERO
    'GJ', // GUANAJUATO
    'HD', // HIDALGO
    'JA', // JALISCO
    'MC', // MICHOACAN
    'MR', // MORELOS
    'MX', // MEXICO
    'NA', // NAYARIT
    'NL', // NUEVO LEON
    'OA', // OAXACA
    'PU', // PUEBLA
    'QE', // QUERETARO
    'QI', // QUINTANA ROO
    'SI', // SINALOA
    'SL', // SAN LUIS POTOSI
    'SO', // SONORA
    'TA', // TAMAULIPAS
    'TB', // TABASCO
    'TL', // TLAXCALA
    'VC', // VERACRUZ
    'YU', // YUCATAN
    'ZA', // ZACATECAS
    // Canadian states
    'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

  public static TIMEZONE_MAP = {
    '-720': 'IDLW',
    '-660': 'NT',
    '-600': 'HST',
    '-540': 'AKST',
    '-480': 'PST',
    '-420': 'PDT',
    '-360': 'CST',
    '-300': 'EST',
    '-240': 'EDT',
    '-180': 'ADT',
    '-120': 'GST',
    '-60': 'NFT',
    0: 'GMT',
    60: 'CET',
    120: 'EET',
    180: 'MSK',
    240: 'SAMT',
    300: 'PKT',
    360: 'ALMT',
    420: 'ICT',
    480: 'CST',
    540: 'JST',
    600: 'AEST',
    660: 'AEDT',
    720: 'NZST'
  };

  public static IMAGE_DROPDOWN = [
    {
      imtID: 1,
      imtDescription: 'LTL Invoice'
    },
    {
      imtID: 2,
      imtDescription: 'Bill of Lading'
    },
    {
      imtID: 3,
      imtDescription: 'Proof of Delivery'
    },
    {
      imtID: 4,
      imtDescription: 'Weight and Inspection'
    },
    {
      imtID: 5,
      imtDescription: 'Letter of Authorization'
    },
    {
      imtID: 6,
      imtDescription: 'Other Document'
    },
    {
      imtID: 7,
      imtDescription: 'Confidential'
    },
    {
      imtID: 8,
      imtDescription: 'Alternative Invoice'
    },
    {
      imtID: 9,
      imtDescription: 'Multiticket Invoice'
    },
    {
      imtID: 10,
      imtDescription: 'Full Docs'
    },
    {
      imtID: 11,
      imtDescription: 'Double BOL POD'
    },
    {
      imtID: 12,
      imtDescription: 'Packing List'
    },
    {
      imtID: 13,
      imtDescription: 'Quote'
    },
    {
      imtID: 14,
      imtDescription: 'Fumigation Certificate'
    },
    {
      imtID: 15,
      imtDescription: 'Country of Origin'
    },
    {
      imtID: 16,
      imtDescription: 'Ocean BOL'
    },
    {
      imtID: 17,
      imtDescription: 'Commercial Invoice'
    },
    {
      imtID: 18,
      imtDescription: 'SED'
    },
    {
      imtID: 19,
      imtDescription: '7501'
    },
    {
      imtID: 20,
      imtDescription: '3461'
    },
    {
      imtID: 21,
      imtDescription: 'Arrival Notice'
    },
    {
      imtID: 22,
      imtDescription: 'Client Specific Doc'
    },
    {
      imtID: 23,
      imtDescription: 'Carrier Confirmation'
    },
    {
      imtID: 24,
      imtDescription: 'Client Invoice'
    },
    {
      imtID: 25,
      imtDescription: 'Client Confirmation'
    },
    {
      imtID: 26,
      imtDescription: 'Scale Ticket'
    },
    {
      imtID: 27,
      imtDescription: 'Alternative BOL'
    },
    {
      imtID: 28,
      imtDescription: 'Fee Receipt'
    },
    {
      imtID: 29,
      imtDescription: '3128'
    },
    {
      imtID: 30,
      imtDescription: 'Canadian Custom Invoice'
    },
    {
      imtID: 31,
      imtDescription: 'RGA(Return Goods Authorization)'
    },
    {
      imtID: 32,
      imtDescription: '7512'
    },
    {
      imtID: 33,
      imtDescription: 'Purchase Order'
    },
    {
      imtID: 34,
      imtDescription: 'Proforma Invoice'
    },
    {
      imtID: 35,
      imtDescription: 'Insurance Certificate'
    },
  ] as ImageType[];

  public static BILL_TO_DROPDOWN = [
    {
      item: '3rd Party',
      value: '3rd Party'
    },
    {
      item: 'Prepaid',
      value: 'Prepaid'
    },
    {
      item: 'Collect',
      value: 'Collect'
    }] as Dropdown[];

  public static FULL_STATE_DROPDOWN = [
    {
      item: 'AL',
      value: 'Alabama'
    },
    {
      item: 'AK',
      value: 'Alaska'
    },
    {
      item: 'AS',
      value: 'American Samoa'
    },
    {
      item: 'AZ',
      value: 'Arizona'
    },
    {
      item: 'AR',
      value: 'Arkansas'
    },
    {
      item: 'CA',
      value: 'California'
    },
    {
      item: 'CO',
      value: 'Colorado'
    },
    {
      item: 'CT',
      value: 'Connecticut'
    },
    {
      item: 'DE',
      value: 'Delaware'
    },
    {
      item: 'DC',
      value: 'District of Columbia'
    },
    {
      item: 'FM',
      value: 'Federated States of Micronesia'
    },
    {
      item: 'FL',
      value: 'Florida'
    },
    {
      item: 'GA',
      value: 'Georgia'
    },
    {
      item: 'GU',
      value: 'Guam'
    },
    {
      item: 'HI',
      value: 'Hawaii'
    },
    {
      item: 'ID',
      value: 'Idaho'
    },
    {
      item: 'IL',
      value: 'Illinois'
    },
    {
      item: 'IN',
      value: 'Indiana'
    },
    {
      item: 'IA',
      value: 'Iowa'
    },
    {
      item: 'KS',
      value: 'Kansas'
    },
    {
      item: 'KY',
      value: 'Kentucky'
    },
    {
      item: 'LA',
      value: 'Louisiana'
    },
    {
      item: 'ME',
      value: 'Maine'
    },
    {
      item: 'MH',
      value: 'Marshall Islands'
    },
    {
      item: 'MD',
      value: 'Maryland'
    },
    {
      item: 'MA',
      value: 'Massachusetts'
    },
    {
      item: 'MI',
      value: 'Michigan'
    },
    {
      item: 'MN',
      value: 'Minnesota'
    },
    {
      item: 'MS',
      value: 'Mississippi'
    },
    {
      item: 'MO',
      value: 'Missouri'
    },
    {
      item: 'MT',
      value: 'Montana'
    },
    {
      item: 'NE',
      value: 'Nebraska'
    },
    {
      item: 'NV',
      value: 'Nevada'
    },
    {
      item: 'NH',
      value: 'New Hampshire'
    },
    {
      item: 'NJ',
      value: 'New Jersey'
    },
    {
      item: 'NM',
      value: 'New Mexico'
    },
    {
      item: 'NY',
      value: 'New York'
    },
    {
      item: 'NC',
      value: 'North Carolina'
    },
    {
      item: 'ND',
      value: 'North Dakota'
    },
    {
      item: 'MP',
      value: 'Northern Marianas'
    },
    {
      item: 'OH',
      value: 'Ohio'
    },
    {
      item: 'OK',
      value: 'Oklahoma'
    },
    {
      item: 'OR',
      value: 'Oregon'
    },
    {
      item: 'PW',
      value: 'Palau'
    },
    {
      item: 'PA',
      value: 'Pennsylvania'
    },
    {
      item: 'PR',
      value: 'Puerto Rico'
    },
    {
      item: 'RI',
      value: 'Rhode Island'
    },
    {
      item: 'SC',
      value: 'South Carolina'
    },
    {
      item: 'SD',
      value: 'South Dakota'
    },
    {
      item: 'TN',
      value: 'Tennessee'
    },
    {
      item: 'TX',
      value: 'Texas'
    },
    {
      item: 'UT',
      value: 'Utah'
    },
    {
      item: 'VI',
      value: 'Virgin Islands'
    },
    {
      item: 'VT',
      value: 'Vermont'
    },
    {
      item: 'VA',
      value: 'Virginia'
    },
    {
      item: 'WA',
      value: 'Washington'
    },
    {
      item: 'WV',
      value: 'West Virginia'
    },
    {
      item: 'WI',
      value: 'Wisconsin'
    },
    {
      item: 'WY',
      value: 'Wyoming'
    },
    // Mexican states
    {
      item: 'AG', value: 'AGUASCALIENTES'
    },
    {
      item: 'BN', value: 'BAJA CALIFORNIA NORTE'
    },
    {
      item: 'BS', value: 'BAJA CALIFORNIA SUR'
    },
    {
      item: 'CH', value: 'COAHUILA'
    },
    {
      item: 'CI', value: 'CHIHUAHUA'
    },
    {
      item: 'CL', value: 'COLIMA'
    },
    {
      item: 'CP', value: 'CAMPECHE'
    },
    {
      item: 'CS', value: 'CHIAPAS'
    },
    {
      item: 'DF', value: 'DISTRICTO FEDERAL'
    },
    {
      item: 'DG', value: 'DURANGO'
    },
    {
      item: 'GE', value: 'GUERRERO'
    },
    {
      item: 'GJ', value: 'GUANAJUATO'
    },
    {
      item: 'HD', value: 'HIDALGO'
    },
    {
      item: 'JA', value: 'JALISCO'
    },
    {
      item: 'MC', value: 'MICHOACAN'
    },
    {
      item: 'MR', value: 'MORELOS'
    },
    {
      item: 'MX', value: 'MEXICO'
    },
    {
      item: 'NA', value: 'NAYARIT'
    },
    {
      item: 'NL', value: 'NUEVO LEON'
    },
    {
      item: 'OA', value: 'AXACA'
    },
    {
      item: 'PU', value: 'PUEBLA'
    },
    {
      item: 'QE', value: 'QUERETARO'
    },
    {
      item: 'QI', value: 'QUINTANA ROO'
    },
    {
      item: 'SI', value: 'SINALOA'
    },
    {
      item: 'SL', value: 'SAN LUIS POTOSI'
    },
    {
      item: 'SO', value: 'SONORA'
    },
    {
      item: 'TA', value: 'TAMAULIPAS'
    },
    {
      item: 'TB', value: 'TABASCO'
    },
    {
      item: 'TL', value: 'TLAXCALA'
    },
    {
      item: 'VC', value: 'VERACRUZ'
    },
    {
      item: 'YU', value: 'YUCATAN'
    },
    {
      item: 'ZA', value: 'ZACATECAS'
    },
    // Canadian States
    {
      item: 'AB',
      value: 'Alberta'
    },
    {
      item: 'BC',
      value: 'British Columbia'
    },
    {
      item: 'MB',
      value: 'Manitoba'
    },
    {
      item: 'NB',
      value: 'New Brunswick'
    },
    {
      item: 'NL',
      value: 'Newfoundland and Labrador'
    },
    {
      item: 'NT',
      value: 'Northwest Territories'
    },
    {
      item: 'NS',
      value: 'Nova Scotia'
    },
    {
      item: 'NU',
      value: 'Nunavut'
    },
    {
      item: 'ON',
      value: 'Ontario'
    },
    {
      item: 'PE',
      value: 'Prince Edward Island'
    },
    {
      item: 'QC',
      value: 'Quebec'
    },
    {
      item: 'SK',
      value: 'Saskatchewan'
    },
    {
      item: 'YT',
      value: 'Yukon'
    }
  ] as Dropdown[];

  public static UNIT_TYPE_DROPDOWN = [
    {
      item: 'BAGS',
      value: 'BAGS'
    },
    {
      item: 'BARRELS',
      value: 'BARRELS'
    },
    {
      item: 'BOXES',
      value: 'BOXES'
    },
    {
      item: 'BUNDLES',
      value: 'BUNDLES'
    },
    {
      item: 'CAN',
      value: 'CAN'
    },
    {
      item: 'CARTON',
      value: 'CARTON'
    },
    {
      item: 'CASES',
      value: 'CASES'
    },
    {
      item: 'CRATES',
      value: 'CRATES'
    },
    {
      item: 'DRUMS',
      value: 'DRUMS'
    },
    {
      item: 'EACH',
      value: 'EACH'
    },
    {
      item: 'GAYLORDS',
      value: 'GAYLORDS'
    },
    {
      item: 'KITS',
      value: 'KITS'
    },
    {
      item: 'LETTERS',
      value: 'LETTERS'
    },

    {
      item: 'OTHER',
      value: 'OTHER'
    },
    {
      item: 'PAILS',
      value: 'PAILS'
    },
    {
      item: 'PALLETS',
      value: 'PALLETS'
    },
    {
      item: 'PAKS',
      value: 'PAKS'
    },
    {
      item: 'PIECES',
      value: 'PIECES'
    },
    {
      item: 'RACKS',
      value: 'RACKS'
    },
    {
      item: 'ROLLS',
      value: 'ROLLS'
    },
    {
      item: 'SKIDS',
      value: 'SKIDS'
    },
    {
      item: 'TOTES',
      value: 'TOTES'
    },
    {
      item: 'TUBES',
      value: 'TUBES'
    },
    {
      item: 'UNITS',
      value: 'UNITS'
    },
    {
      item: 'TRUCK',
      value: 'TRUCK'
    }
  ] as Dropdown[];

  public static CLASS_DROPDOWN = [
    {
      item: '50',
      value: '50'
    },
    {
      item: '55',
      value: '55'
    },
    {
      item: '60',
      value: '60'
    },
    {
      item: '65',
      value: '65'
    },
    {
      item: '70',
      value: '70'
    },
    {
      item: '77',
      value: '77'
    },
    {
      item: '85',
      value: '85'
    },
    {
      item: '92',
      value: '92'
    },
    {
      item: '100',
      value: '100'
    },
    {
      item: '110',
      value: '110'
    },
    {
      item: '125',
      value: '125'
    },
    // {
    //   item: '150',
    //   value: '150'
    // },
    {
      item: '175',
      value: '175'
    },
    // {
    //   item: '200',
    //   value: '200'
    // },
    {
      item: '250',
      value: '250'
    },
    {
      item: '300',
      value: '300'
    },
    {
      item: '400',
      value: '400'
    }
    // {
    //   item: '500',
    //   value: '500'
    // }
  ] as Dropdown[];

  public static INTERNAL_LTL_TYPE_DROPDOWN = [
    {
      item: 'Multileg',
      value: 'Multileg'
    },
    {
      item: 'Direct',
      value: 'Direct'
    },
    {
      item: 'Volume',
      value: 'Volume'
    }
  ] as Dropdown[];

  public static EXTERNAL_LTL_TYPE_DROPDOWN = [
    {
      item: 'Multileg',
      value: 'Multileg'
    },
    {
      item: 'Direct',
      value: 'Direct'
    },
    {
      item: 'Volume',
      value: 'Volume'
    },
    {
      item: 'Customer Pickup',
      value: 'Customer Pickup'
    },
    {
      item: 'Fleet',
      value: 'Fleet'
    },
    {
      item: 'PPD/Add',
      value: 'PPD/Add'
    }
  ] as Dropdown[];

  public static TYPE_DROPDOWN = [
    {
      item: 'Dedicated Truck',
      value: 'Dedicated Truck'
    },
    {
      item: 'Multileg',
      value: 'Multileg'
    },
    {
      item: 'Direct',
      value: 'Direct'
    }
  ] as Dropdown[];

  public static PRIORITY_DROPDOWN = [
    {
      item: 'Elevated',
      value: 'Elevated'
    },
    {
      item: 'Guaranteed',
      value: 'Guaranteed'
    },
    {
      item: 'Expedited',
      value: 'Expedited'
    },
    {
      item: 'Standard',
      value: 'Standard'
    }
  ] as Dropdown[];

  public static LP_TEAM_EMAIL = [
    {
      item: 'Blue Team',
      value: 'blueteam@il2000.com'
    },
    {
      item: 'Gold Team',
      value: 'goldteam@il2000.com'
    },
    {
      item: 'Red Team',
      value: 'redteam@il2000.com'
    },
    {
      item: 'Green Team',
      value: 'greenteam@il2000.com'
    },
  ] as Dropdown[];

  public static EQUIPMENT_DROPDOWN = [
    {
      item: 'VAN',
      value: 'V'// value: 'VAN'
    },
    {
      item: 'VAN W/ TEAM',
      value: 'VM'
    },
    {
      item: 'REEFER',
      value: 'R'// value: 'REEFER'
    },
    {
      item: 'REEFER W/ TEAM',
      value: 'RM'
    },
    {
      item: 'FLATBED',
      value: 'F'// value: 'FLATBED'
    },
    {
      item: 'VAN OR REEFER',
      value: 'VR'
    },
    {
      item: 'VAN HOTSHOT * 26 BOX',
      value: 'VH'
    },
    {
      item: 'STEP DECK',
      value: 'SD'
    },
    {
      item: 'POWER ONLY',
      value: 'PO'
    },
    {
      item: 'STRAIGHT TRUCK',
      value: 'SB'
    },
    {
      item: 'VAN HAZMAT',
      value: 'VZ'
    }
  ] as Dropdown[];

  public static YES_NO_DROPDOWN = [
    {
      item: 'YES',
      value: 'YES'
    },
    {
      item: 'NO',
      value: 'NO'
    }
  ] as Dropdown[];

  public static DOCUMENTS_TO_PRINT = [
    {
      item: 'Bill of lading',
      value: 'bol'
    },
    {
      item: 'H/U labels',
      value: 'hu'
    }] as Dropdown[];

  public static RECIPIENTFLOOR = [
    {
      item: 'Upstairs',
      value: 'Upstairs'
    },
    {
      item: 'Downstairs',
      value: 'Downstairs'
    },
    {
      item: 'Ground floor',
      value: 'Ground floor'
    }
  ] as Dropdown[];

  public static TIER = [
    {
      item: 'Tier 1',
      value: 'Tier 1'
    },
    {
      item: 'Tier 2',
      value: 'Tier 2'
    },
    {
      item: 'Tier 3',
      value: 'Tier 2'
    },
    {
      item: 'Tier 4',
      value: 'Tier 4'
    }
  ] as Dropdown[];


  public static ELEVATOR = [
    {
      item: 'Yes',
      value: 'Yes'
    },
    {
      item: 'No',
      value: 'No'
    },
    {
      item: 'N/A',
      value: 'NA'
    }
  ] as Dropdown[];

  public static ACCESSORIAL_TYPES_DROPDOWN = [
    {
      item: 'Additional Stop',
      value: '1'
    },
    {
      item: 'Detention',
      value: '2'
    },
    {
      item: 'Driver Assist',
      value: '3'
    },
    {
      item: 'Fuel Surcharge',
      value: '4'
    },
    {
      item: 'Layover',
      value: '5'
    },
    {
      item: 'Out of Route Miles',
      value: '6'
    },
    {
      item: 'Reconsignment',
      value: '7'
    },
    {
      item: 'Unloading Fee',
      value: '8'
    },
    {
      item: 'Truck Not Used',
      value: '9'
    },
    {
      item: 'Team',
      value: '10'
    },
    {
      item: 'Lumper',
      value: '11'
    },
    {
      item: 'Tracking Failure',
      value: '12'
    },
    {
      value: '13',
      item: 'Additional Insurance'
    }
  ] as Dropdown[];

  public static SEARCH_REFERENCE_FIELD_DROPDOWN = [
    {
      rftID: 207,
      rftDescription: '1stRef',
      rftAbbreviation: '1stRef'
    },
    {
      rftID: 208,
      rftDescription: '2ndRef',
      rftAbbreviation: '2ndRef'
    },
    {
      rftID: 128,
      rftDescription: 'Airway Bill #',
      rftAbbreviation: 'Airway Bil'
    },
    {
      rftID: 21,
      rftDescription: 'BOL Number',
      rftAbbreviation: 'BOL #'
    },
    {
      rftID: 60,
      rftDescription: 'BOL Reference',
      rftAbbreviation: 'BOL Refere'
    },
    {
      rftID: 183,
      rftDescription: 'Booking Date',
      rftAbbreviation: 'Booking Da'
    },
    {
      rftID: 14,
      rftDescription: 'Booking ID',
      rftAbbreviation: 'BookingID'
    },
    {
      rftID: 71,
      rftDescription: 'Booking Number',
      rftAbbreviation: 'Booking Nu'
    },
    {
      rftID: 4,
      rftDescription: 'Cost Center',
      rftAbbreviation: 'CCenter'
    },
    {
      rftID: 119,
      rftDescription: 'Cost Type',
      rftAbbreviation: 'Cost Type'
    },
    {
      rftID: 196,
      rftDescription: 'Delivery #',
      rftAbbreviation: 'Delivery #'
    },
    {
      rftID: 137,
      rftDescription: 'Fabric #',
      rftAbbreviation: 'Fabric #'
    },
    {
      rftID: 89,
      rftDescription: 'Freight PO#',
      rftAbbreviation: 'Freight PO'
    },
    {
      rftID: 3,
      rftDescription: 'GL Number',
      rftAbbreviation: 'GL'
    },
    {
      rftID: 69,
      rftDescription: 'House Airway bill Number',
      rftAbbreviation: 'House Airw'
    },
    {
      rftID: 231,
      rftDescription: 'Invoice #',
      rftAbbreviation: 'Invoice #'
    },
    {
      rftID: 11,
      rftDescription: 'Job Number',
      rftAbbreviation: 'Job #'
    },
    {
      rftID: 64,
      rftDescription: 'Load Number',
      rftAbbreviation: 'Load Numbe'
    },
    {
      rftID: 220,
      rftDescription: 'MABD',
      rftAbbreviation: 'MABD'
    },
    {
      rftID: 16,
      rftDescription: 'Master Air Waybill Number',
      rftAbbreviation: 'MasterAWB#'
    },
    {
      rftID: 218,
      rftDescription: 'Name',
      rftAbbreviation: 'Name'
    },
    {
      rftID: 22,
      rftDescription: 'Order Number',
      rftAbbreviation: 'Order #'
    },
    {
      rftID: 46,
      rftDescription: 'PL #',
      rftAbbreviation: 'PL #'
    },
    {
      rftID: 173,
      rftDescription: 'PO',
      rftAbbreviation: 'PO'
    },
    {
      rftID: 1,
      rftDescription: 'PO Number',
      rftAbbreviation: 'PO'
    },
    {
      rftID: 28,
      rftDescription: 'Project Name',
      rftAbbreviation: 'ProjName'
    },
    {
      rftID: 10,
      rftDescription: 'Project Number',
      rftAbbreviation: 'Project'
    },
    {
      rftID: 17,
      rftDescription: 'Quote ID',
      rftAbbreviation: 'QuoteID'
    },
    {
      rftID: 187,
      rftDescription: 'Ready Date',
      rftAbbreviation: 'Ready Date'
    },
    {
      rftID: 209,
      rftDescription: 'Ref#1',
      rftAbbreviation: 'Ref#1'
    },
    {
      rftID: 210,
      rftDescription: 'Ref#2',
      rftAbbreviation: 'Ref#2'
    },
    {
      rftID: 52,
      rftDescription: 'Reference #',
      rftAbbreviation: 'Reference'
    },
    {
      rftID: 23,
      rftDescription: 'Return Authorization #',
      rftAbbreviation: 'Return A#'
    },
    {
      rftID: 134,
      rftDescription: 'RGA#',
      rftAbbreviation: 'RGA#'
    },
    {
      rftID: 2,
      rftDescription: 'SO Number',
      rftAbbreviation: 'SO'
    },
    {
      rftID: 26,
      rftDescription: 'Transfer Number',
      rftAbbreviation: 'Transfer#'
    }
  ];

  public static OVERRIDE_EXCEPTIONS_DROPDOWN = [
    {
      ExceptionID: 1,
      ExceptionName: 'Price'
    },
    {
      ExceptionID: 2,
      ExceptionName: 'Capacity'
    },
    {
      ExceptionID: -1,
      ExceptionName: 'Other'
    }
  ];

  public static EQUIPMENT_TL_DROPDOWN = [
    {
      item: '53\' DRY VAN',
      value: '53 DRY VAN'
    },
    {
      item: '26\' STRAIGHT TRUCK',
      value: '26 STRAIGHT TRUCK'
    },
    {
      item: 'BOX TRUCK',
      value: 'BOX TRUCK'
    },
    {
      item: 'SPRINTER VAN',
      value: 'SPRINTER VAN'
    },
    {
      item: '53\' REFRIGERATED VAN',
      value: '53 REFRIGERATED VAN'
    },
    {
      item: '53\' FLAT BED',
      value: '53 FLAT BED'
    },
    {
      item: '48\' FLAT BED',
      value: '48 FLAT BED'
    },
    {
      item: '48\' STEP DECK',
      value: '48 STEP DECK'
    },
    {
      item: '48\' CONESTOGA',
      value: '48 CONESTOGA'
    },
    {
      item: '40\' HOT SHOT',
      value: '40 HOT SHOT'
    },
    {
      item: '28\' HOT SHOT',
      value: '28 HOT SHOT'
    },
    {
      item: 'RGN',
      value: 'RGN'
    },
    {
      item: 'LOWBOY',
      value: 'LOWBOY'
    },
    {
      item: 'DOUBLE DROP',
      value: 'DOUBLE DROP'
    },
    {
      item: 'SPECIALTY DECK',
      value: 'SPECIALTY DECK'
    },
    {
      item: 'POWER ONLY',
      value: 'POWER ONLY'
    }
  ] as Dropdown[];

  public static REASON_CODE_TL_DROPDOWN = [
    {
      item: 'CARRIER FELL OFF, RECOVERY WAS MORE EXPENSIVE',
      value: 'CARRIER FELL OFF, RECOVERY WAS MORE EXPENSIVE'
    },
    {
      item: 'CUSTOMER RATE IS BELOW THE MARKET PRICE',
      value: 'CUSTOMER RATE IS BELOW THE MARKET PRICE'
    },
    {
      item: 'QUOTED INCORRECT EQUIPMENT',
      value: 'QUOTED INCORRECT EQUIPMENT'
    },
    {
      item: 'IL2000 ERROR',
      value: 'IL2000 ERROR'
    }
  ] as Dropdown[];

  public static FEE_INCURRED_AT_DROPDOWN = [
    {
      item: 'Origin',
      value: 'Origin'
    },
    {
      item: 'In-Transit',
      value: 'In-Transit'
    },
    {
      item: 'Destination',
      value: 'Destination'
    }
  ] as Dropdown[];

  public static COUNTRY_DROPDOWN = ['USA', 'CAN', 'MEX'];

  public static CURRENCY_DROPDOWN = [
    {
      item: 'USD',
      value: 1
    },
    {
      item: 'CAD',
      value: 2
    }
  ];

  public isCollapsed = false;
}
