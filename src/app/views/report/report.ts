import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {NgxSpinnerService} from 'ngx-spinner';
import {forkJoin} from 'rxjs';
import {DataTable} from '../../components/data-table/data-table';
import {ReportSummary} from '../../interfaces/report-summary';
import {ReportService} from '../../services/report/report.service';
import {GroupsService} from '../../services/groups/groups.service';
import {Global} from '../../common/global';

@Component({
  selector: 'app-report',
  standalone: false,
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report implements OnInit {
  @ViewChildren(DataTable) dt!: QueryList<DataTable>;
  reportGridName = 'Billing Terms Goals';
  carrierOverviewGridName = 'Carrier Overview';
  consigneeOverviewGridName = 'Consignee Overview';
  originBreakdownGridName = 'Origin Breakdown';
  destinationBreakdownGridName = 'Destination Breakdown';
  clientOverviewGridName = 'Client Overview';
  tableColumns = [
    {
      title: 'Name',
      data: 'name',
      orderable: false,
      targets: 0,
      width: '3%',
      render(data: any) {
        if (data === null) {
          data = '';
        }
        return '<span tabindex="0">' + data.toUpperCase() + '</span>';
      }
    },
    {
      title: 'Last Month',
      data: 'month',
      orderable: true,
      targets: 1,
      width: '3%',
      render(data: any) {
        if (data === null) {
          data = '';
        }
        return '<span tabindex="0">' + data + '</span>';
      }
    },
    {
      title: 'YTD',
      data: 'ytd',
      orderable: true,
      targets: 1,
      width: '3%',
      render(data: any) {
        if (data === null) {
          data = '';
        }
        return '<span tabindex="0">' + data + '</span>';
      }
    }];
  billingTermTotals: Array<ReportSummary> = [];
  carrierOverview: Array<ReportSummary> = [];
  consigneeOverview: Array<ReportSummary> = [];
  originBreakdown: Array<ReportSummary> = [];
  destinationBreakdown: Array<ReportSummary> = [];
  clientOverview: Array<ReportSummary> = [];
  global = Global;

  constructor(private reportService: ReportService, private spinner: NgxSpinnerService, private groupsService: GroupsService) {
  }

  ngOnInit(): void {
    this.spinner.show('reportSummaryGridSpinner');
    const timeStamp = new Date().getTime();

    Promise.all([this.groupsService.isValidPermission(), this.groupsService.userGroupID()]).then((values) => {
      const LTLUser = values[0];
      const groupID = LTLUser ? +values[1] : 0;

      forkJoin({
        billingTermTotals: this.reportService.getBillingTermTotals(timeStamp, groupID),
        carrierOverview: this.reportService.getCarrierOverview(timeStamp, groupID),
        consigneeOverview: this.reportService.getConsigneeOverview(timeStamp, groupID),
        originBreakdown: this.reportService.getOriginBreakdown(timeStamp, groupID),
        destinationBreakdown: this.reportService.getDestinationBreakdown(timeStamp, groupID),
        clientOverview: this.reportService.getClientOverview(timeStamp, groupID)
      }).subscribe({
        next: (response: any) => {
          const reportSummaryBillingTermTotals: ReportSummary[] = response.billingTermTotals as ReportSummary[];
          for (let billingTermTotals of reportSummaryBillingTermTotals) {
            billingTermTotals.notText = 'none';
            if (billingTermTotals.name != undefined && billingTermTotals.name != '') {
              this.billingTermTotals.push(billingTermTotals);
            }
          }

          const reportSummaryCarrierOverview: ReportSummary[] = response.carrierOverview as ReportSummary[];
          for (let carrierOverview of reportSummaryCarrierOverview) {
            carrierOverview.notText = 'none';
            if (carrierOverview.name != undefined && carrierOverview.name != '') {
              this.carrierOverview.push(carrierOverview);
            }
          }

          const reportSummaryConsigneeOverview: ReportSummary[] = response.consigneeOverview as ReportSummary[];
          for (let consigneeOverview of reportSummaryConsigneeOverview) {
            consigneeOverview.notText = 'none';
            if (consigneeOverview.name != undefined && consigneeOverview.name != '') {
              this.consigneeOverview.push(consigneeOverview);
            }
          }

          const reportSummaryOriginBreakdown: ReportSummary[] = response.originBreakdown as ReportSummary[];
          for (let originBreakdown of reportSummaryOriginBreakdown) {
            originBreakdown.notText = 'none';
            if (originBreakdown.name != undefined && originBreakdown.name != '') {
              this.originBreakdown.push(originBreakdown);
            }
          }

          const reportSummaryDestinationBreakdown: ReportSummary[] = response.destinationBreakdown as ReportSummary[];
          for (let destinationBreakdown of reportSummaryDestinationBreakdown) {
            destinationBreakdown.notText = 'none';
            if (destinationBreakdown.name != undefined && destinationBreakdown.name != '') {
              this.destinationBreakdown.push(destinationBreakdown);
            }
          }

          const reportSummaryClientOverview: ReportSummary[] = response.clientOverview as ReportSummary[];
          for (let clientOverview of reportSummaryClientOverview) {
            clientOverview.notText = 'none';
            if (clientOverview.name != undefined && clientOverview.name != '') {
              this.clientOverview.push(clientOverview);
            }
          }

          this.dt.forEach(dt => dt.rerender());
          this.spinner.hide('reportSummaryGridSpinner');
        }
      });
    });
  }
}
