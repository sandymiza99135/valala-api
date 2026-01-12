import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { NotificationService } from '../services/notification-service';
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router ,private notify :NotificationService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.currentUserValue;
    if (this.authService.isLoggedIn()&& user?.role === 'admin') {
      return true;
    } else {
    this.notify.error('Accès refusé', 'Vous n\'avez pas les permissions pour accéder à cette zone.');
    this.router.navigate(['/']); // Redirection vers l'accueil
    return false;
  }
  }
}