import {booleanAttribute, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ClientDropdownOption} from '../../interfaces/client-dropdown-option';
import {InternalGroupService} from '../../services/internal-group/internal-group.service';
import {ClientDropdownResponse} from '../../interfaces/client-dropdown-response';
import {GroupInfo} from '../../interfaces/group-info';
import {Plant} from '../../interfaces/plant';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {GroupsService} from '../../services/groups/groups.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-client-dropdown',
  standalone: false,
  templateUrl: './client-dropdown.html',
  styleUrl: './client-dropdown.css',
})
export class ClientDropdown implements OnInit {
  @Output() groupEvent = new EventEmitter<GroupInfo>();
  @Output() clientPlantSelected = new EventEmitter<boolean>();
  @Output() clientChangeEvent = new EventEmitter<boolean>();
  groupInfo: GroupInfo = {} as GroupInfo;
  @Input() currentClient?: any = '';
  @Input() manageUsers?: any = '';
  @Input() currentGroup?: any = '';
  @Input() currentGroupName?: any = '';
  clients: any;
  isIL2000 = false;
  clientDropdownValues: ClientDropdownOption[] = [] as ClientDropdownOption[];
  selectablePlants: Plant[] = [];
  ClientDropdownNew: string[] = [];
  PlantDropdownNew: string[] = [];
  groupForm!: FormGroup;
  @Input() plantRequired = true;
  @Input() clientRequired = true;
  @Input() plantEditable = false;
  @Input() setPlantWhenSelectClient = true;
  @Input({transform: booleanAttribute}) disabled = false;
  @Input() isQuickRatePage = false;

  constructor(private gs: GroupsService, private igs: InternalGroupService, private fb: FormBuilder, private route: ActivatedRoute) {
    // SET CLIENTS ON ROUTE
    this.clients = this.route.snapshot.data["clients"];
    // SET THE DROP-DOWN VALUES
    if (this.clients.length > 0) {
      this.setDropdownOptions(this.clients);
    }

    // TODO: Is IL2000 user, might need to change group in future
    this.gs.isValidPermission().then(data => {
      this.isIL2000 = data;
    });
  }

  ngOnInit(): void {
    const initialClientValue = this.currentClient;
    const initialPlantValue = this.currentGroupName;
    this.groupForm = this.fb.group({
      client: this.fb.control('', Validators.required),
      plant: this.fb.control('', Validators.required)
    });
    this.setClient();
    // INITIALIZE VALUES
    this.setClientValue(initialClientValue);
    this.setPlantValue(initialPlantValue);
  }

  setClientValue(event: string) {
    if (event !== '') {
      this.currentClient = event;
      this.groupForm.get('client')?.setValue(this.currentClient);
    }
  }

  setPlantValue(event: any) {
    if (event != '') {
      let clientOnHold = false;
      this.currentGroupName = event;
      this.selectablePlants.forEach(value => {
        if (value.groupName == event) {
          this.currentGroup = value.groupID;
          clientOnHold = value.onHold;
        }
      });

      if (clientOnHold) {
        this.showClientOnHoldModal();
        return;
      } else {
        this.groupForm.get('plant')?.setValue(event);
        $('#plant').val(event);
      }
    }

    if (event == '' && this.plantEditable) {
      this.groupForm.get('plant')?.setValue('');
      $('#plant').val('');
    }

    this.setClientPlant();
    this.checkIfClientPlantSelected();
  }

  setClient(edit = false) {
    if (!edit) { this.currentGroup = null; }
    this.selectablePlants = [];
    this.PlantDropdownNew = [];
    this.groupForm.get('plant')?.setValue('');
    $('#plant').val('');

    if (this.clientDropdownValues.length === 1) {
      this.currentClient = this.clientDropdownValues[0].Client;
      this.selectablePlants.push(this.clientDropdownValues[0].Plants[0]);
    } else {
      for (let index in this.clientDropdownValues) {
        if (this.clientDropdownValues[index].Client == this.currentClient
          || this.clientDropdownValues[index].Client.split('-')[0] == this.currentClient.split('-')[0]) {
          for (let plant of this.clientDropdownValues[index].Plants) {
            this.selectablePlants.push(plant);
          }
        }
      }
    }

    // Setting Plant dropdown to first item in list - to fire group event
    if (this.setPlantWhenSelectClient ) {
      this.currentGroup = this.currentGroup ? this.currentGroup :
        this.selectablePlants[0]?.groupID && this.selectablePlants.length === 1 ? this.selectablePlants[0]?.groupID : null;
      this.currentGroupName = this.currentGroupName ? this.currentGroupName :
        this.selectablePlants[0]?.groupName && this.selectablePlants.length === 1 ? this.selectablePlants[0]?.groupName : null;
      this.groupForm.get('plant')?.setValue(this.selectablePlants[0]?.groupName && this.selectablePlants.length === 1 ?
        this.selectablePlants[0]?.groupName : null);
      if (this.selectablePlants[0]?.groupName && this.selectablePlants.length === 1) {
        if (this.selectablePlants[0]?.onHold) {
          this.showClientOnHoldModal();
          return;
        } else {
          $('#plant').val(this.selectablePlants[0]?.groupName);
        }
      }
    } else {
      this.currentGroup = '';
      this.currentGroupName = '';
      this.groupForm.get('plant')?.setValue('');
      $('#plant').val('');
    }

    let plantList: string[] = [];
    this.selectablePlants.sort().forEach(value => {
      plantList.push(value.groupName);
    });

    this.PlantDropdownNew = plantList.sort();
    this.setClientPlant();
  }

  setDropdownOptions(clients: any) {
    const parsedResponse: ClientDropdownResponse[] = clients as ClientDropdownResponse[];
    let previousClient = clients[0].clientCode;
    let previousCompany = clients[0].companyName;
    let plantsArray: Plant[] = [];

    if (clients.length === 1) {
      plantsArray = [];
      plantsArray.push(
        {groupID: clients[0].groupID, groupName: clients[0].groupName + '-' + clients[0].address, onHold: clients[0].onHold});
      this.clientDropdownValues.push({Client: previousClient + '-' + previousCompany, Plants: plantsArray});
      this.ClientDropdownNew.push(previousClient + '-' + previousCompany);
    } else {
      // REDUCE TO REMOVE DUPLICATE CLIENT CODES
      const client = this.clients.reduce((accumulator: any, current: any) => {
        if (!accumulator.some((item: any) => item.clientCode === current.clientCode)) {
          accumulator.push(current);
        }
        return accumulator;
      }, []);

      // GROUP CLIENTS WITH PLANTS
      client.forEach((c: any) => {
        plantsArray = [];
        this.ClientDropdownNew.push(c.clientCode + '-' + c.companyName);
        this.clientDropdownValues.push({Client: c.clientCode + '-' + c.companyName, Plants: plantsArray});
        parsedResponse.forEach(option => {
          if (option.clientCode == c.clientCode) {
            previousClient = option.clientCode;
            previousCompany = option.companyName;
            plantsArray.push({groupID: option.groupID, groupName: option.groupName + '-' + option.address, onHold: option.onHold});
          }
        });
      });
    }
  }

  setClientPlant() {
    if (this.currentGroup != null && this.currentGroup != '') {
      this.igs.getGroupInfo(this.currentGroup).subscribe({
        next: (response) => {
          this.groupInfo = response as GroupInfo;
          this.groupEvent.emit(this.groupInfo);
        },
        error: () => {
          if (this.plantEditable) {
            this.groupEvent.emit(this.groupInfo);
          }
        }
      });
    }
  }

  onClientChange() {
    this.clientChangeEvent.emit(true);
  }

  checkIfClientPlantSelected() {
    if (this.currentClient !== '' && this.currentGroupName !== '') {
      this.clientPlantSelected.emit(true);
    } else {
      this.clientPlantSelected.emit(false);
    }
  }

  setClientList() {
    this.selectablePlants = [];
    this.PlantDropdownNew = [];

    if (this.clientDropdownValues.length === 1) {
      this.currentClient = this.clientDropdownValues[0].Client;
      this.selectablePlants.push(this.clientDropdownValues[0].Plants[0]);
    } else {
      for (const index in this.clientDropdownValues) {
        if (this.clientDropdownValues[index].Client == this.currentClient) {
          for (const plant of this.clientDropdownValues[index].Plants) {
            this.selectablePlants.push(plant);
          }
        }
      }
    }

    let plantList: string[] = [];
    this.selectablePlants.sort().forEach(value => {
      plantList.push(value.groupName);
    });
    this.PlantDropdownNew = plantList.sort();
  }

  showClientOnHoldModal() {
    this.PlantDropdownNew = [];
    this.currentGroupName = '';
    this.currentClient = '';

    Swal.fire({
      icon: 'warning',
      title: '',
      html: '<b/>Client on hold, client is not enabled to create shipments.'}
    ).then(() => {});

    setTimeout(() => {
      $('[id^=\'ngb-typeahead-\'].dropdown-menu.show').removeClass('show');
      this.groupForm.get('client')?.setValue('');
      this.groupForm.get('plant')?.setValue('');
      $('#client').val('');
      $('#plant').val('');
    }, 500);
  }
}
