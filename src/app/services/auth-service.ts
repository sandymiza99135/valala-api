import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$: Observable<any> = this.currentUserSubject.asObservable();
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    // 1. Initialisation au démarrage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch (e) {
        this.logout(); // En cas de JSON corrompu
      }
    }
  }

  /**
   * Retourne la valeur actuelle de l'utilisateur (Synchrone)
   * Pratique pour les "guards" ou les vérifications rapides
   */
  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  loginUser(loginData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/login`, loginData);
  }


  /**
   * Vérifie si un utilisateur est connecté
   */
  public isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Récupère le jeton JWT stocké
   */
  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Enregistre la session après login
   */
  setSession(userData: any, token: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    this.currentUserSubject.next(userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart')
    this.currentUserSubject.next(null);
  }
}