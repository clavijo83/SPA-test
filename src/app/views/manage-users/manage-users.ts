import {Component, OnInit, signal, ViewChild} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {Global} from '../../common/global';
import {ManageUserService} from '../../services/manage-user/manage-user.service';
import {GroupInfo} from '../../interfaces/group-info';
import Swal from 'sweetalert2';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxSpinnerService} from 'ngx-spinner';
import {ClientDropdown} from '../../components/client-dropdown/client-dropdown';
import {GroupsService} from '../../services/groups/groups.service';
import {AuthenticatorService} from "@aws-amplify/ui-angular";

@Component({
  selector: 'app-manage-users',
  standalone: false,
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
})
export class ManageUsers implements OnInit {
  @ViewChild(ClientDropdown) clientDropdown!: ClientDropdown;
  clients: any;
  sortOrder: any = [3, 'asc'];
  currentUserType: any;
  currentUserName: any;
  public productColumns = [
    {
      title: 'UserID',
      data: 'UserID',
      orderable: true,
      visible: false,
      className: 'text-center',
      render(data: any) {
        return data;
      }
    },
    {
      title: 'UserName',
      data: 'UserName',
      orderable: true,
      className: 'text-center',
      render(data: any) {
        return data;
      }
    },
    {
      title: 'Email',
      data: 'Email',
      orderable: true,
      className: 'text-center',
      render(data: any) {
        return data;
      }
    },
    {
      title: 'First Name',
      data: 'FirstName',
      orderable: true,
      className: 'text-center',
      render(data: any) {
        return data;
      }
    },
    {
      title: 'Last Name',
      data: 'LastName',
      orderable: true,
      className: 'text-center',
      render(data: any) {
        return data;
      }
    },
    {
      title: 'Manager',
      data: 'UserManager',
      orderable: true,
      className: 'text-center',
      render(data: any) {
        return data;
      }
    },
    {
      title: 'Role',
      data: 'UserType',
      orderable: true,
      className: 'text-center',
      render(data: any) {
        if (data == 1) {
          data = 'client-user';
        } else if (data === 2) {
          data = 'client-supervisor';
        } else if (data === 3) {
          data = 'client-executive';
        } else if (data === 4) {
          data = 'client-limited';
        } else if (data === 11) {
          data = 'carrier';
        } else if (data === 12) {
          data = 'vendor';
        } else if (data === 23) {
          data = 'data-entry';
        } else if (data === 24) {
          data = 'lp';
        } else if (data === 25) {
          data = 'customer-service';
        } else if (data === 26) {
          data = 'auditor';
        } else if (data === 27) {
          data = 'sales-rep';
        } else if (data === 28) {
          data = 'supervisor';
        } else if (data === 29) {
          data = 'Il2000-executive';
        } else if (data === 32) {
          data = 'webadmin';
        } else if (data === 99) {
          data = 'other';
        }
        return data;
      }
    },
    {
      title: 'Edit',
      data: 'UserName',
      orderable: true,
      className: 'text-center',
      render() {
        return '<button class="btn btn-primary btn-sm w-100" (click)="myEvent($event)">Edit</button>';
      }
    },
  ];
  global = Global;
  users = signal([]);
  selectedRole: any = '';
  currentGroupID: number | null = null;
  currentGroupName = '';
  currentClient = '';
  clientPlantSelected = false;
  roleList: any = [
    'client-supervisor',
    'client-executive',
    'client-limited',
    'carrier',
    'vendor',
    'data-entry',
    'lp',
    'customer-service',
    'auditor',
    'sales-rep',
    'supervisor',
    'il2000-executive',
    'webadmin',
    'other'
  ];
  roleListForClient: any = [
    'client-user',
    'client-supervisor',
    'client-executive',
    'client-limited'
  ];
  roleListForEditUser: any = [
    'client-user',
    'client-supervisor',
    'client-executive',
    'client-limited',
    'client-supervisor',
    'client-executive',
    'client-limited',
    'carrier',
    'vendor',
    'data-entry',
    'lp',
    'customer-service',
    'auditor',
    'sales-rep',
    'supervisor',
    'il2000-executive',
    'webadmin',
    'other'
  ];
  formType: any = 'edit';
  userEnableOrDisable: number | undefined;
  private fb: FormBuilder = new FormBuilder();
  userForm: any = this.fb.group({
    companyName: [''],
    plant: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', Validators.required],
    userManager: [''],
    aliases: ['', Validators.required],
    groupID: [''],
    userType: ['']
  });
  userFormEdit: any = this.fb.group({
    companyName: [''],
    plant: [''],
    firstName: [''],
    lastName: [''],
    username: ['', Validators.required],
    email: [''],
    userManager: [''],
    aliases: [''],
    groupID: [''],
    userType: [''],
    userID: ['']
  });

  constructor(private gs: GroupsService, private mus: ManageUserService, public authService: AuthenticatorService,
              private router: Router, private spinner: NgxSpinnerService, private route: ActivatedRoute) {
    this.getUserType();
  }

  isClientPlantSelected() {
    this.clientPlantSelected = true;
  }

  loadCreateUserForm() {
    this.formType = 'create';
    this.cleanForm();
  }

  validUser(formType: string) {
    if (formType === 'onSubmitSignUpUser') {
      return !this.userForm.valid;
    } else {
      return !this.userFormEdit.valid;
    }
  }

  addRole(formName: string, Role: any) {
    let role = Role;
    if (role.length > 0) {
    } else {
      role = $('#signUpUserRole').val();
    }
    if (formName === 'onSubmitSignUpUser') {
      if (role != null) {
        if (role === 'client-supervisor') {
          this.userForm.patchValue({
            userType: '2',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'client-executive') {
          this.userForm.patchValue({
            userType: '3',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'client-limited') {
          this.userForm.patchValue({
            userType: '4',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'carrier') {
          this.userForm.patchValue({
            userType: '11',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'vendor') {
          this.userForm.patchValue({
            userType: '12',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'data-entry') {
          this.userForm.patchValue({
            userType: '23',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'lp') {
          this.userForm.patchValue({
            userType: '24',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'customer-service') {
          this.userForm.patchValue({
            userType: '25',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'auditor') {
          this.userForm.patchValue({
            userType: '26',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'sales-rep') {
          this.userForm.patchValue({
            userType: '27',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'supervisor') {
          this.userForm.patchValue({
            userType: '28',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'il2000-executive') {
          this.userForm.patchValue({
            userType: '29',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'webadmin') {
          this.userForm.patchValue({
            userType: '32',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'other') {
          this.userForm.patchValue({
            userType: '99',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'client-user') {
          this.userForm.patchValue({
            userType: '1',
            userManager: 'it@il2000.com',
            aliases: role
          });
        }

        $('select').val([]);
      }
    } else if (formName === 'editUserRole') {
      if (role != null) {
        if (role === 'client-supervisor') {
          this.userFormEdit.patchValue({
            userType: '2',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'client-executive') {
          this.userFormEdit.patchValue({
            userType: '3',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'client-limited') {
          this.userFormEdit.patchValue({
            userType: '4',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'carrier') {
          this.userFormEdit.patchValue({
            userType: '11',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'vendor') {
          this.userFormEdit.patchValue({
            userType: '12',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'data-entry') {
          this.userFormEdit.patchValue({
            userType: '23',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'lp') {
          this.userFormEdit.patchValue({
            userType: '24',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'customer-service') {
          this.userFormEdit.patchValue({
            userType: '25',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'auditor') {
          this.userFormEdit.patchValue({
            userType: '26',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'sales-rep') {
          this.userFormEdit.patchValue({
            userType: '27',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'supervisor') {
          this.userFormEdit.patchValue({
            userType: '28',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'il2000-executive') {
          this.userFormEdit.patchValue({
            userType: '29',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'webadmin') {
          this.userFormEdit.patchValue({
            userType: '32',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'other') {
          this.userFormEdit.patchValue({
            userType: '99',
            userManager: 'it@il2000.com',
            aliases: role
          });
        } else if (role === 'client-User') {
          this.userFormEdit.patchValue({
            userType: '1',
            userManager: 'it@il2000.com',
            aliases: role
          });
        }
        $('select').val([]);
      }
    }
  }

  userFirstName() {
    if (this.userForm.get('firstName')?.value && this.userForm.get('firstName')?.value?.length > 0) {
      return !/^[a-zA-Z]+$/.test(this.userForm.get('firstName')?.value);
    } else {
      return false;
    }
  }

  userLastName() {
    if (this.userForm.get('lastName')?.value && this.userForm.get('lastName')?.value.length > 0) {
      return !/^[a-zA-Z]+$/.test(this.userForm.get('lastName')?.value);
    } else {
      return false;
    }
  }

  editUserFirstName() {
    if (this.userFormEdit.get('firstName')?.value && this.userFormEdit.get('firstName')?.value.length > 0) {
      return !/^[a-zA-Z]+$/.test(this.userFormEdit.get('firstName')?.value);
    } else {
      return false;
    }
  }

  editUserLastName() {
    if (this.userFormEdit.get('lastName')?.value && this.userFormEdit.get('lastName')?.value.length > 0) {
      return !/^[a-zA-Z]+$/.test(this.userFormEdit.get('lastName')?.value);
    } else {
      return false;
    }
  }

  roleSelected(userType: any): any {
    if (userType == this.userFormEdit.get('userType')?.value) {
      return true;
    }
  }

  isEnable(): any {
    if (this.userEnableOrDisable === 1) {
      return true;
    }
  }

  isDisable(): any {
    if (this.userEnableOrDisable === 0) {
      return true;
    }
  }

  // loads user to edit in modal
  editUser(user: any) {
    this.formType = 'edit';
    if (user.Email === null) {
      user.Email = '';
    }
    this.currentClient = '';
    this.currentGroupName = '';
    this.clientDropdown.currentClient = '';
    this.clientDropdown.currentGroupName = '';
    this.clientDropdown.currentGroup = null;
    this.currentGroupID = null;
    this.clientDropdown.setClient();

    const client = this.clients.find((x: any) => x.groupID == user.GroupID);
    if (client) {
      this.currentClient = client.clientCode + '-' + client.companyName;
      this.currentGroupName = client.groupName + '-' + client.address;
      this.currentGroupID = user.GroupID;
      this.clientDropdown.currentGroup = user.GroupID;
      this.clientDropdown.currentClient = client.clientCode + '-' + client.companyName;
      this.clientDropdown.currentGroupName = client.groupName + '-' + client.address;
      this.clientDropdown.setClient(true);
      $('#plant').val(client.groupName);
    }

    const userName = user.UserName;
    this.userFormEdit.setValue({
      companyName: this.currentClient,
      plant: this.currentGroupName,
      firstName: user.FirstName,
      lastName: user.LastName,
      username: userName,
      email: user.Email,
      userManager: user.UserManager,
      groupID: user.GroupID,
      userType: user.UserType,
      aliases: user.Aliases,
      userID: user.UserID
    });
    // set if the user is disabled or enabled
    this.userEnableOrDisable = user.Active ? user.Active : 0;
    let data: any = this.userFormEdit.get('userType')?.value;

    // load user role if they have one
    if (data) {
      if (data == 1) {
        data = 'client-user';
      } else if (data == 2) {
        data = 'client-supervisor';
      } else if (data == 3) {
        data = 'client-executive';
      } else if (data == 4) {
        data = 'client-limited';
      } else if (data == 11) {
        data = 'carrier';
      } else if (data == 12) {
        data = 'vendor';
      } else if (data == 23) {
        data = 'data-entry';
      } else if (data == 24) {
        data = 'lp';
      } else if (data == 25) {
        data = 'customer-service';
      } else if (data == 26) {
        data = 'auditor';
      } else if (data == 27) {
        data = 'sales-rep';
      } else if (data == 28) {
        data = 'supervisor';
      } else if (data == 29) {
        data = 'Il2000-executive';
      } else if (data == 32) {
        data = 'webadmin';
      } else if (data == 99) {
        data = 'other';
      }

      // add a user role for old accounts without a role filled out
      this.userFormEdit.patchValue({
        aliases: data
      });
      this.addRole('editUserRole', data);
    }

    $('#editUser').modal('show');
  }

  removeRole(formName: string) {
    if (formName === 'onSubmitSignUpUser') {
      this.userForm.patchValue({
        userManager: '',
        userType: '',
        aliases: ''
      });
    } else {
      this.userFormEdit.patchValue({
        userManager: '',
        userType: '',
        aliases: '',
      });
    }
  }

  // allow adding a role if option selected
  selectRole(formName: string) {
    let role = null;
    if (formName === 'editUserRole') {
      role = $('#editUserRole').val();
      this.selectedRole = role;
    } else if (formName === 'onSubmitSignUpUser') {
      role = $('#signUpUserRole').val();
      this.selectedRole = role;
    }
    this.addRole(formName, role);
  }

  ngOnInit(): void {

  }

  getUserType() {
    this.authService.subscribe(() => {
      this.currentUserName = this.authService?.user?.username ?? null;
      if (this.currentUserName) {
        this.gs.userType(this.currentUserName).subscribe({
          next: (response) => {
            Global.currentUserType.set(response.UserType);
            this.currentUserType = response.UserType
            if (this.currentUserType == 32 || this.currentUserType == 29) {
              this.clients = this.route.snapshot.data["clients"];
              // on email change update username
              this.userForm.get("email")?.valueChanges.subscribe((x: any) => {
                let returnUsername: string;
                const user = x;
                if (user) {
                  returnUsername = user.substring(0, user.indexOf("@")).toLowerCase();
                } else {
                  returnUsername = "";
                }
                if (returnUsername == null || returnUsername?.length == 0) {
                  this.userForm.patchValue({
                    username: ""
                  });
                } else {
                  this.userForm.patchValue({
                    username: returnUsername
                  });
                }
              });

              this.getUsers();

              let component = this;

              $("#editUser").on("hidden.bs.modal", function () {
                setTimeout(() => {
                  component.cleanForm();
                }, 100);
              });

              $("#signUpUser").on("hidden.bs.modal", function () {
                setTimeout(() => {
                  component.cleanForm();
                }, 100);
              });
            } else {
              this.router.navigateByUrl("SPAs/shipment-access-denied").then();
            }
          }
        });
      }
    });
  }

  userPermission(selection: any) {
    this.userEnableOrDisable = selection;
  }

  updateUserPermission() {
    this.spinner.show('editUserForm').then();
    if (this.userEnableOrDisable === 1) {
      this.mus.enableUser(this.userFormEdit.get('username')?.value).subscribe({
        next: () => {
          this.spinner.hide('editUserForm').then();
          Swal.fire({
            icon: 'success', title: '', html: 'User Enabled', timer: 2000,
            timerProgressBar: true
          }).then(() => {
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
              this.router.navigate(['SPAs/manage-users']);
            });
          });
        },
        error: (error: any) => {
          this.spinner.hide('editUserForm').then();
          if (error) {
            Swal.fire({
              icon: 'error', title: '', html: 'Error failed',
              timerProgressBar: true
            }).then(() => {
              this.spinner.hide('editUserForm').then();
            });
          }
        }
      });
    } else {
      this.mus.disableUser(this.userFormEdit.get('username')?.value).subscribe({
        next: () => {
          this.spinner.hide('editUserForm').then();
          Swal.fire({
            icon: 'success', title: '', html: 'User Disabled', timer: 2000,
            timerProgressBar: true
          }).then(() => {
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
              this.router.navigate(['SPAs/manage-users']);
            });
          });
        },
        error: (error: any) => {
          this.spinner.hide('editUserForm').then();
          if (error) {
            Swal.fire({
              icon: 'error', title: '', html: error,
              timerProgressBar: true
            }).then(() => {
              this.spinner.hide('editUserForm').then();
            });
          }
        }
      });
    }
  }

  clickEventHandler($event: any) {
    this.editUser($event);
  }

  info() {
    this.userFormEdit.patchValue({
      companyName: $('#client').val(),
      plant: $('#plant').val()
    });
    this.userForm.patchValue({
      companyName: $('#client').val(),
      plant: $('#plant').val()
    });
  }

  groupEventHandler($event: GroupInfo) {
    this.currentGroupID = $event.groupID;

    this.userForm.patchValue({
      groupID: this.currentGroupID,
      companyName: $event.companyName,
      plant: $event.groupName
    });

    this.userFormEdit.patchValue({
      groupID: this.currentGroupID,
      companyName: $event.companyName,
      plant: $event.groupName
    });

  }

  onEmailChange(data: string) {
    if (data === 'create') {
      const emailDomain = this.userForm.get('email')?.value.split('@')[1].toLowerCase() || '';
      if (emailDomain !== 'il2000.com' && emailDomain !== 'eshipping.biz') {
        this.userForm.patchValue({
          userManager: '',
          aliases: ''
        });
      }
    } else {
      const emailDomain = this.userFormEdit.get('email')?.value.split('@')[1].toLowerCase() || '';
      if (emailDomain !== 'il2000.com' && emailDomain !== 'eshipping.biz') {
        this.userFormEdit.patchValue({
          userManager: '',
          aliases: ''
        });
      }
    }
  }

  onSubmitSignUpUser(formType: string): any {
    const client = (document.getElementById('client') as HTMLInputElement).value;
    const plant = (document.getElementById('plant') as HTMLInputElement).value;
    if (formType === 'edit') {
      if (!this.userFormEdit.valid) {
        document.getElementById('edit-validation')?.classList.add('was-validated');
        return false;
      }

      if (this.userFormEdit.get('email')?.value == '') {
      } else {
        const mailDomain = this.userFormEdit.get('email')?.value.split('@')[1].toLowerCase() || '';
        if (mailDomain !== 'il2000.com' && mailDomain !== 'eshipping.biz') {
          Swal.fire({
            icon: 'error',
            title: '',
            html: 'Only il2000.com and eshipping.biz email\'s allowed',
            timer: 3000,
            timerProgressBar: true
          });
          return false;
        }
      }
      this.spinner.show('editUserForm').then();

      this.mus.editUser(JSON.stringify(this.userFormEdit.getRawValue())).subscribe({
        next: () => {
          this.spinner.hide('editUserForm').then();
          Swal.fire({
            icon: 'success', title: '', html: 'User Updated', timer: 2000,
            timerProgressBar: true
          }).then(() => {
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
              this.router.navigate(['SPAs/manage-users']);
            });
          });
        },
        error: (error: any) => {
          this.spinner.hide('editUserForm').then();
          if (error) {
            if (error.toString().includes('User account already exists')) {
              Swal.fire({
                icon: 'error', title: '', html: 'Error account already exists with that email',
                timerProgressBar: true
              }).then(() => {
                this.spinner.hide('editUserForm').then();
              });
            } else {
              Swal.fire({
                icon: 'error', title: '', html: error,
                timerProgressBar: true
              }).then(() => {
                this.spinner.hide('editUserForm').then();
              });
            }
          } else {
            Swal.fire({
              icon: 'error', title: '', html: 'Error failed',
              timerProgressBar: true
            }).then(() => {
              this.spinner.hide('editUserForm').then();
            });
          }
        }
      });

    } else if (formType === 'create') {

      if (!this.userForm.valid) {
        document.getElementById('sign-up-validation')?.classList.add('was-validated');
        return false;
      }

      if (this.clientPlantSelected && client.length > 1 && plant.length > 1) {
      } else {
        document.getElementById('sign-up-validation')?.classList.add('was-validated');
        return false;
      }

      const mailDomain = this.userForm.get('email')?.value.split('@')[1].toLowerCase() || '';
      if (mailDomain !== 'il2000.com' && mailDomain !== 'eshipping.biz') {
        Swal.fire({
          icon: 'error',
          title: '',
          html: 'Only il2000.com and eshipping.biz email\'s allowed',
          timer: 3000,
          timerProgressBar: true
        });
        return false;
      } else {
        this.spinner.show('signUpUserForm').then();
        this.mus.signUpUser(JSON.stringify(this.userForm.getRawValue())).subscribe({
          next: () => {
            this.spinner.hide('signUpUserForm').then();

            Swal.fire({
              icon: 'success', title: '', html: 'User Signed Up', timer: 2000,
              timerProgressBar: true
            }).then(() => {
              $('body').removeClass('modal-open');
              $('.modal-backdrop').remove();
              this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
                this.router.navigate(['SPAs/manage-users']);
              });
            });

          },
          error: (error) => {
            this.spinner.hide('signUpUserForm').then();
            if (error) {
              if (error.toString().includes('User account already exists')) {
                Swal.fire({
                  icon: 'error', title: '', html: 'Error account already exists with that email',
                  timerProgressBar: true
                });
              } else {
                Swal.fire({
                  icon: 'error', title: '', html: error,
                  timerProgressBar: true
                });
              }
            }
          }
        });
      }
    }
  }

  getUsers() {
    this.spinner.show('users').then();
    this.mus.getUsers().subscribe({
      next: (response) => {
        this.users.set(response);
        this.spinner.hide('users');
      },
      error: (error: any) => {
        this.spinner.hide('users');
        Swal.fire({
          icon: 'error', title: '', html: error,
          timerProgressBar: true
        });
      }
    });
  }

  cleanForm() {
    this.userForm.reset(this.fb.group({
      companyName: [''],
      plant: [''],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', Validators.required],
      userManager: [''],
      aliases: ['', Validators.required],
      groupID: [''],
      userType: ['']
    }));

    this.userFormEdit.reset(this.fb.group({
      companyName: [''],
      plant: [''],
      firstName: [''],
      lastName: [''],
      username: ['', Validators.required],
      email: [''],
      userManager: [''],
      aliases: [''],
      groupID: [''],
      userType: [''],
      userID: ['']
    }));

    this.currentClient = '';
    this.currentGroupName = '';
    this.currentGroupID = null;
    this.clientDropdown.currentClient = '';
    this.clientDropdown.currentGroupName = '';
    this.clientDropdown.currentGroup = null;
    this.clientDropdown.setClient();
  }
}
