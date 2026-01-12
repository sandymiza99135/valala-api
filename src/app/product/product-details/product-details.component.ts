import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from 'src/app/services/card-service';
import { ProductService } from 'src/app/services/product-service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'll-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
 
  product: any;
  constructor(private router : Router , private productService:ProductService ,
    private activatedRoute: ActivatedRoute,private cartService:CartService) {
    const navigation = this.router.getCurrentNavigation();
    console.log(navigation);
    
    if (navigation?.extras.state) {
      this.product = navigation.extras.state['data'];

    }
    
   }
  ngOnInit(): void {
    console.log(this.product);
    if (this.product == null) {
      this.loadProductFromApi(parseInt(this.activatedRoute.snapshot.paramMap.get('id')));
    }
  }
  addToCart() {
  if (this.product) {
    this.cartService.addToCart(this.product);
    // Optionnel : Afficher une notification (Toast)
    alert('Produit ajouté au panier !');
  }
}
viewAnotherProduct(){
  this.router.navigate(["/products"])
}
goToCart() {
  this.router.navigate(["/products/incart"])
}
  loadProductFromApi(id : number){
    this.productService.getByProduct(id).subscribe({
    next: (res) => {
      console.log('Product', res);
        res.data.image_url = environment.apiUrl + res.data.image_url ;
      this.product = res.data
      // ulaire
      //this.loadProducts();   // Rafraîchir votre liste de produits
    },
    error: (err) => {
      console.error('Error getting product', err)
        //  this.isLoaded = false;
    }
  });
  }

}
