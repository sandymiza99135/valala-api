import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/services/product-service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'll-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  isLoaded: boolean;
  advanceSearchExpanded: boolean = false;
  products = [];
  constructor(private productService : ProductService,private router : Router) {}

  ngOnInit(): void {
      this.getAllProduct({})
      
  }
  goToDetails(product: any) {
  this.router.navigate(['/products', product.id], { 
    state: { data: product } 
  });
}
  getAllProduct(payload:any){
    //this.isLoaded = true
    this.productService.getProducts(payload).subscribe({
    next: (res) => {
      console.log('Product all', res);
       for (let index = 0; index < res.data.length; index++) {
       res.data[index].image_url = environment.apiUrl + res.data[index].image_url ;
      
     }
      this.products = res.data
      this.isLoaded = false;
      // ulaire
      //this.loadProducts();   // Rafraîchir votre liste de produits
    },
    error: (err) => {
      console.error('Error adding product', err)
         this.isLoaded = false;
    }
  });
}
}
