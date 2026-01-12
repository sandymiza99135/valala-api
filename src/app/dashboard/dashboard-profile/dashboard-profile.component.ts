import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'll-dashboard-profile',
  templateUrl: './dashboard-profile.component.html',
  styleUrls: ['./dashboard-profile.component.scss']
})
export class DashboardProfileComponent implements OnInit {
  user: any;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // Récupération des infos réelles depuis le service d'authentification
    this.user = this.authService.currentUserValue;
  }
}