import { Component, Input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ProductService } from "src/app/services/product-service";
@Component({
  selector: 'stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent implements OnInit {
 @Input() icon: string = '';
  
  // Titre de la carte
  @Input() title: string = '';
  
  // La valeur numérique (le compteur)
  @Input() count: number = 0;
  
  // Le statut pour la logique interne ('paid' ou 'pending')
  @Input() status: 'paid' | 'pending' = 'pending';

  constructor( private router: Router,private productService : ProductService) {}

  ngOnInit(): void {
    this.getAllOrders({status:this.status})
  }

    getAllOrders(payload:any){
      this.productService.getAllOrders(payload).subscribe({
        next: (res) => {
          console.log('Product all', res);
          this.count = res.total
          // ulaire
          //this.loadProducts();   // Rafraîchir votre liste de produits
        },
        error: (err) => {
          console.error('Error adding product', err)
        }
      });
    }
  
}
