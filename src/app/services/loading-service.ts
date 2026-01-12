import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Un BehaviorSubject permet de stocker la valeur actuelle et de l'émettre aux abonnés
  private _isLoading = new BehaviorSubject<boolean>(false);
  
  // Observable que les composants vont écouter
  public readonly isLoading$ = this._isLoading.asObservable();

  constructor() {}

  show() {
    this._isLoading.next(true);
  }

  hide() {
    this._isLoading.next(false);
  }
}