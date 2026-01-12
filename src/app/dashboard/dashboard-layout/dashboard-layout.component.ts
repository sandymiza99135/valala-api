import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';// Ajustez le chemin
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'll-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit {
  isLessThenLargeDevice: boolean = false;
  currentUser: any; // Stockera les vraies infos

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 1. Récupération des infos de l'utilisateur connecté
    this.currentUser = this.authService.currentUserValue; 
    
    // 2. Gestion du responsive
    this.breakpointObserver.observe(['(max-width: 1199px)']).subscribe(({ matches }) => {
      this.isLessThenLargeDevice = matches;
    });
  }

  onLogout(): void {
    this.authService.logout(); // Appelle votre méthode de déconnexion
    this.router.navigate(['auth/login']);
  }
}