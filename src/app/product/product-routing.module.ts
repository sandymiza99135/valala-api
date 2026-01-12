import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { ProductListComponent } from './product-list/product-list.component';
import { CartComponent } from './card/cart.component';
import { AuthGuard } from '../guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: ProductListComponent,
    data: { 
      hero: { 
        badge : "Nos Produits",
        title: 'Découvrez nos <span>Nos Produits</span>', 
        subtitle: 'Découvrez votre impact <strong> à chaque vente</strong>.' 
      } 
    }
  }, 
  {
    path: 'incart',
    canActivate: [AuthGuard],
    component: CartComponent
  },
  {
    path: ':id',
    component: ProductDetailsComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductRoutingModule { }
