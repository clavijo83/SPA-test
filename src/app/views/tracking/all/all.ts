import {Component, OnInit} from '@angular/core';
import {GroupsService} from '../../../services/groups/groups.service';

@Component({
  selector: 'app-all',
  standalone: false,
  templateUrl: './all.html',
  styleUrl: './all.css',
})
export class All implements OnInit {
  isLTLAdmin: any;

  constructor(private gs: GroupsService) {
  }

  ngOnInit(): void {
    this.gs.isValidPermission().then(data => {
      this.isLTLAdmin = data;
    });
  }
}
