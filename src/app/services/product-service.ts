import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root' // Le service est disponible dans toute l'application
})
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des produits avec filtres
   */
  getProducts(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/product/all`, payload);
  }
  /**
   * Récupère la liste des produits avec filtres
   */
  getAllOrders(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/order/all`, payload);
  }

  /**
   * Récupère la liste des produits avec filtres
   */
  getAllCategories(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/product/category/all`);
  }

  /**
   * Création d'un produit (envoie l'objet JSON contenant le Base64)
   */
  createProduct(productData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/product/add`, productData);
  }

  /**
   * Création d'un produit (envoie l'objet JSON contenant le Base64)
   */
  updateProduct( id:number,productData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/product/update/${id}`, productData);
  }

  /**
   * Création d'un produit (envoie l'objet JSON contenant le Base64)
   */

  createpayment(productData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/order/pay`, productData);
  }
  createpaymentStripe(productData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/order/stripe/pay`, productData);
  }
  createpaymentGpay(productData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/order/gpay`, productData);
  }
  createpaymentPaypal(productData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/order/paypal/pay`, productData);
  }
  checkPaypalPaymentStatus(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/order/check/paypal/status/${id}`);
  }
  checkPaypalPaymentStripeStatus(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/order/check/stripe/status?paymentIntentId=${id}`);
  }
  checkPaymentStatus(trx_ref: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/order/check/status/${trx_ref}`);
  }

  initializePayment(email: string, amount: number) {
    return this.http.post('http://localhost:3000/api/paystack/initialize', { email, amount });
  }
  

  /**
   * Suppression d'un produit par ID
   */
  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  /**
   * recuperer un produit par ID
   */
  getByProduct(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/product/${id}`);
  }
}