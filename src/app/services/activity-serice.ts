import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root' // Le service est disponible dans toute l'application
})
export class ActivityService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des produits avec filtres
   */
  createActivity(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/activity/add`, payload);
  }
  
  getAllActivities(page: number = 1, limit: number = 10, search?: string, status?: string): Observable<any> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString());

  // On n'ajoute les filtres que s'ils sont définis
  if (search) {
    params = params.set('search', search);
  }
  if (status) {
    params = params.set('status', status);
  }

  return this.http.get<any>(`${this.apiUrl}/api/activity/all`, { params });
}
  updateActivity( id:number,productData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/activity/update/${id}`, productData);
  }


  
}