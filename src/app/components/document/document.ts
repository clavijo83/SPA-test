import {Component, EventEmitter, Injectable, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ReportsService} from "../../services/reports/reports.service";
import {ReportDocument} from '../../interfaces/document';
import {FormArray, FormBuilder, FormGroup} from "@angular/forms";
import {DownloadService} from "../../services/download/download.service";
import { saveAs } from 'file-saver';
import {UploadService} from "../../services/upload/upload.service";
import {environment} from "../../../environments/environment";
import {ImageBillsService} from "../../services/image-bills/image-bills.service";
import {Constants} from "../../constants/constants";
import {EmailModal} from '../email-modal/email-modal';

@Component({
  selector: 'app-document',
  standalone: false,
  templateUrl: './document.html',
  styleUrl: './document.css',
})
@Injectable()
export class Document implements OnInit, OnDestroy {
  @ViewChild(EmailModal) email!: EmailModal;
  @Input() BOLNumber: any;
  @Output() onEmailSent: EventEmitter<any> = new EventEmitter<any>();
  documents: ReportDocument[] = [] as ReportDocument[];
  documentForm!: FormGroup;
  fileName = '';
  fileLabel = 'Choose File';
  disablePrintSave = true;
  selectedFile: File | null = null;
  shipmentId: any;
  documentValueChanges$: any;
  lineItems: any;
  sumPieces: any;
  sumHUs: any;
  public clientCode: string = '';
  imageBills: any = [];
  public toEmailAddress: string = '';
  imageTypes = [] = Constants.IMAGE_DROPDOWN;
  noteString = '';
  public attachments: string = '';
  public message: string = '';
  public emailBodyDocuments = '';

  constructor(
    private fb: FormBuilder,
    private rs: ReportsService,
    private downloadService: DownloadService,
    private uploadService: UploadService,
    private is: ImageBillsService) {
    this.documentForm = this.fb.group({
      documentControls: this.fb.array([]),
      uploadFile: this.fb.control(''),
      documentType: this.fb.control('')
    });
  }

  get documentControls() {
    return this.documentForm.get('documentControls') as FormArray;
  }

  ngOnInit(): void {
    this.getShippingDetails();
    this.checkDocValues();
  }

  getDocumentControl(id: any = null, type: any = '', items: any = 0, isChecked: any = false, url: any = '', fileName: any = '') {
    return this.fb.group({
      id: id,
      type: type,
      items: items,
      docCheck: isChecked,
      url: url,
      fileName: fileName
    });
  }

  initializeDocControls() {
    this.documentControls.clear();
    for (let i in this.documents) {
      this.documentControls.push(this.getDocumentControl(this.documents[i].id, this.documents[i].type, this.documents[i].items, false, this.documents[i].url, this.documents[i].fileName));
    }
    this.disablePrintSaveBtn();
  }

  getShippingDetails() {
    //let shipmentID;
    this.rs.getShippingDetails(this.BOLNumber).subscribe({
      next: response => {
        this.shipmentId = response.id;
        this.lineItems = response.lineitems;
        this.clientCode = response.group ? response.group.split('-', 1).toString() : '';
        this.toEmailAddress = response.group.email ? response.group.email : '';
        this.documents = this.rs.getDocuments(this.shipmentId);
        this.initializeDocControls();
        this.getTotalPiecesHUs(this.lineItems);
        this.rs.getDocsFromTable(this.shipmentId).subscribe({
          next: response => {
            for (let doc of response as ReportDocument[]) {
              doc.items = 1;
              this.documents.push(doc);
              this.initializeDocControls();
            }
          },
          error: () => {
            this.rs.getP44POD(this.shipmentId).subscribe({
              next: response => {
                response.items = 1;
                this.documents.push(response as ReportDocument);
                this.rs.getP44BOL(this.shipmentId).subscribe({
                  next: response => {
                    response.items = 1;
                    this.documents.push(response as ReportDocument);
                    this.initializeDocControls();
                  },
                  error: () => {
                    this.initializeDocControls();
                  }
                })
              },
              error: () => {
                this.rs.getP44BOL(this.shipmentId).subscribe({
                  next: response => {
                    response.items = 1;
                    this.documents.push(response as ReportDocument);
                    this.initializeDocControls();
                  },
                  error: () => {
                    this.initializeDocControls();
                  }
                })
              }
            });
          }
        });
        this.is.getImageBills(this.shipmentId).subscribe({
          next: response => {
            for (let i in response) {
              this.documents.push({
                id: response[i].id,
                url: null,
                typeId: response[i].imageTypeId,
                type: response[i].typeDescription,
                format: 'PDF',
                items: 1,
                fileName: response[i].fileName
              });
            }
            this.initializeDocControls();
          },
          error: () => {
            this.initializeDocControls();
          }
        });
      },
      error: () => {
        this.initializeDocControls();
      }
    });
  }

  onPrintDocument() {
    let documentIds = []
    let docCont = this.documentControls.value
    this.disablePrintSaveBtn();
    for (let i in docCont) {
      // This is the original BOL, create in S3 bucket and retrieve from lambda
      if (docCont[i].docCheck === true && docCont[i].type == "Original BOL") {
        this.rs.getBOLFromLambda(this.shipmentId).subscribe({
          next: response => {
            // Fallback if lambda fails
            if (response.pdf.length < 2000) {
              window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentId);
            } else {
              let toPdf = this.base64ToBlob(response.pdf)
              let file = new Blob([toPdf], {type: 'application/pdf'});
              let fileURL = URL.createObjectURL(file);
              window.open(fileURL);
            }
          }
        });
        // This is an S3 bucket upload, get stream instead
      } else if (docCont[i].id != null && docCont[i].docCheck === true) {
        this.rs.getImageStream(this.shipmentId, docCont[i].id).subscribe({
          next: response => {
            let file = this.base64ToBlob(response);
            let fileURL = URL.createObjectURL(file);
            window.open(fileURL);
          }
        });
        // This is a legacy icarus document, open it via its url
      } else if (docCont[i].docCheck === true) {
        documentIds.push(i);
        window.open(docCont[i].url, '_blank');
        window.close();
      }
    }
  }

  base64ToBlob(base64String: string) {
    base64String = 'data:application/pdf;base64,' + base64String;
    let byteString = atob(base64String.split(',')[1]);
    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: 'application/pdf'});
  }

  showUploadBtn(showBtn: boolean): boolean {
    return showBtn;
  }

  /* Download Documents */
  returnBlob(res: any, format: string): Blob {
    return new Blob([res], {type: format});
  }

  //TODO: Revisit once we can get CORS filter added
  download() {
    let docCont = this.documentControls.value
    let format = '';

    for (let i in docCont) {
      if (docCont[i].docCheck === true) {

        if (docCont[i].format === 'PNG') {
          format = 'image/png'
        } else {
          format = 'application/pdf'
          // }

          this.downloadService.downloadFile(docCont[i].url).subscribe({
            next: res => {
              if (res) {
                saveAs(this.returnBlob(res, format), this.fileName);
              }
            }
          });
        }
      }
    }
  }

  /*Upload Documents*/
  uploadChange(item: any) {
    this.fileLabel = item.target.files[0].name;
    this.selectedFile = <File>item.target.files[0];
  }

  addFile() {
    const fd = new FormData();
    if (this.selectedFile) fd.append('document', this.selectedFile, this.selectedFile.name)
    let docType = this.documentForm.get('documentType')?.value ? this.documentForm.get('documentType')?.value : null
    let shipId = this.shipmentId ? this.shipmentId : null
    //Sends formData to server - process formData on server side

    this.uploadService.sendFile(fd, shipId, docType, this.fileLabel).subscribe({
      next: () => {
        this.getShippingDetails();
      },
      error: () => {
        this.getShippingDetails();
      }
    });
  }

  onDocTableClick(index: number) {
    this.documentControls.at(index).get('docCheck')?.setValue(!this.documentControls.at(index).get('docCheck')?.value, {
      onlySelf: false,
      emitEvent: true
    });
    if (this.documentControls.at(index).get('docCheck')?.value) {
      $('#myTable').on('click', 'tbody tr', function () {
        $(this).addClass('bg-secondary').siblings();
      });
    } else {
      $('#myTable').on('click', 'tbody tr', function () {
        $(this).removeClass('bg-secondary').siblings()
      });
    }
    this.getEmailAttachmentBody();
  }

  disablePrintSaveBtn() {
    let checkedValues = this.documentControls.value.filter((x: any) => x.docCheck === true);
    this.disablePrintSave = checkedValues.length <= 0;
  }

  checkDocValues() {
    this.documentValueChanges$ = this.documentControls.valueChanges.subscribe(() => {
      this.disablePrintSaveBtn();
    })
  }

  getEmailAttachmentBody() {
    this.imageBills = [];
    this.attachments = 'Documents:' + '\n';
    this.message = 'Attached are the documents for Shipment' + ' ' + this.clientCode + ' - ' + this.BOLNumber.toString() + '\n'
      + 'To track the status of this shipment click here:' + '\n' + '(' + environment.ENV_ICARUS_BASE_URL + '/reports/statusdetail?id=' + this.shipmentId.toString() + ')' + '\n' + '\n';
    let documents = this.documentControls.value;
    for (let i in documents) {
      if (documents[i].docCheck === true) {
        this.noteString = this.noteString + documents[i].type + ',';
        if (documents[i].fileName === '' && documents[i].type != 'Original BOL') {

          this.attachments = this.attachments + documents[i].url + '\n';

        } else {

          this.attachments = this.attachments + documents[i].type + '\n';

          //Generated File Name for Original BOL
          let originalBOLFileName = '123/' + this.shipmentId.toString() + 'B.pdf';

          this.imageBills.push({
            id: documents[i].type === 'Original BOL' ? null : documents[i].id,
            shipmentID: null,
            typeDescription: documents[i].type,
            fileName: documents[i].type === 'Original BOL' ? originalBOLFileName : documents[i].fileName,
            entryDate: null,
            typeLetter: null,
            isClientVisible: null
          });
        }
      }
    }
    this.emailBodyDocuments = this.message + this.attachments;
  }

  ngOnDestroy() {
    this.documentValueChanges$.unsubscribe;
  }

  getTotalPiecesHUs(data: any) {
    this.sumPieces = 0;
    this.sumHUs = 0;
    for (let i in data) {
      this.sumPieces += data[i].numberOfPieces ? data[i].numberOfPieces : 0;
      this.sumHUs += data[i].handlingUnitCount ? data[i].handlingUnitCount : 0;
    }
  }
}
