import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: any[] = [];
  private cartSubject = new BehaviorSubject<any[]>([]);

  // Flux de données que les composants vont écouter
  cart$ = this.cartSubject.asObservable();

  addToCart(product: any) {
    // Vérifier si le produit est déjà dans le panier
    const existingProduct = this.cartItems.find(item => item.id === product.id);

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      this.cartItems.push({ ...product, quantity: 1 });
    }
    
    // Mettre à jour tous les composants abonnés
    this.cartSubject.next([...this.cartItems]);
    this.saveToLocalStorage();
  }

  private saveToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
  }

  // Optionnel : charger le panier au démarrage
  loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
      this.cartSubject.next(this.cartItems);
    }
  }
  
  // Dans votre CartService
removeFromCart(productId: number) {
  this.cartItems = this.cartItems.filter(item => item.id !== productId);
  this.cartSubject.next([...this.cartItems]);
  this.saveToLocalStorage();
}

updateQuantity(productId: number, change: number) {
  const product = this.cartItems.find(item => item.id === productId);
  if (product) {
    product.quantity += change;
    if (product.quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.cartSubject.next([...this.cartItems]);
      this.saveToLocalStorage();
    }
  }
}
getTotalPrice(): number {
  return this.cartItems.reduce((acc, item) => {
    // acc = l'accumulateur (le total partiel)
    // item = le produit actuel dans la boucle
    return acc + (item.price * item.quantity);
  }, 0); // 0 est la valeur de départ
}

// Dans votre CartService
clearCart() {
  // 1. On vide le tableau local
  this.cartItems = [];
  
  // 2. On notifie tous les composants (le panier affichera 0)
  this.cartSubject.next([...this.cartItems]);
  
  // 3. On nettoie le localStorage pour que le panier reste vide au rafraîchissement
  localStorage.removeItem('cart');
}
}