import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from 'src/app/services/product-service';

@Component({
  selector: 'app-dashboard-order',
  templateUrl: './dashboard-order.component.html',
  styleUrls: ['./dashboard-order.component.scss']
})
export class DashboardOrderComponent implements OnInit {
  orders = [];
  currentFilter: any;

  constructor(private productService : ProductService,private route: ActivatedRoute) {}
  getAllProduct(payload:any){
    this.productService.getAllOrders(payload).subscribe({
      next: (res) => {
        console.log('Product all', res);
        
        this.orders = res.data
        // ulaire
        //this.loadProducts();   // Rafraîchir votre liste de produits
      },
      error: (err) => {
        console.error('Error adding product', err)
      }
    });

  }
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentFilter = params['status']; // Récupère 'pending' ou 'paid'
      
      console.log('Filtre actif :', this.currentFilter);
      if(this.currentFilter){
        this.getAllProduct({status :this.currentFilter});
      }else{
         this.getAllProduct({});
      }
      // Ici, vous pouvez appeler votre service pour charger les données filtrées
      
    });
    
    
  }
}
