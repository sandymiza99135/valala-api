import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/services/product-service';

@Component({
  selector: 'll-dashboard-index',
  templateUrl: './dashboard-index.component.html',
  styleUrls: ['./dashboard-index.component.scss']
})
export class DashboardIndexComponent implements OnInit {
  orders = [];
  ordersAccounts = 0;
  productAccounts = 0;

  constructor(private productService : ProductService) {}
  
  getAllProduct(payload:any){
    this.productService.getProducts(payload).subscribe({
    next: (res) => {
      console.log('Product all', res);
      this.productAccounts = res.total
      //this.loadProducts();   // Rafraîchir votre liste de produits
    },
    error: (err) => console.error('Error adding product', err)
  });
}
  ngOnInit(): void {
     this.getAllProduct({});
  }
}
