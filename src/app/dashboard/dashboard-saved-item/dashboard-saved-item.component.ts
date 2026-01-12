import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth-service';
import { ProductService } from 'src/app/services/product-service';
import { productsDB } from 'src/app/shared/data/products';
import { ProductFormDialogComponent } from '../popup/add-update-product/product-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'll-dashboard-saved-item',
  templateUrl: './dashboard-saved-item.component.html',
  styleUrls: ['./dashboard-saved-item.component.scss']
})
export class DashboardSavedItemComponent implements OnInit {
  view = 'list';
  categories: any [] = []; 
  products;
  newProduct = {
  name: '',
  category_id: '',
  description: '',
  price: null,
  stock: null
};
  isEditMode: boolean;
  currentProductId: any;
  constructor(
    private dialog: MatDialog,
    private productService : ProductService
  ) {}
  showForm = false;
imageBase64: string | null = null;
selectedFileName: string = '';

onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedFileName = file.name;
    const fileType = file.type; // Récupère 'image/png', 'image/webp', etc.
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 500;
        canvas.height = 500;

        if (ctx) {
          // Utilisation du "Center Crop" pour éviter de déformer l'image
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 500, 500);

          // On remplace 'image/jpeg' par fileType pour garder l'extension
          this.imageBase64 = canvas.toDataURL(fileType, 0.8);
          console.log("Image traitée en :", fileType);
        }
      };
    };
    reader.readAsDataURL(file);
  }
}

// ... vos autres variables (showForm, imageBase64, etc.)

// Logique pour l'ajout
executeProductAddition(data: { product: any, imageBase64: string }) {
  const payload = {
    ...data.product,
    imageBase64: data.imageBase64
  };

  this.productService.createProduct(payload).subscribe({
    next: (res) => {
      console.log('Product added!', res);
      this.getAllProduct({}); // Rafraîchit la liste
    },
    error: (err) => console.error('Error adding product', err)
  });
}

// Logique pour l'update
executeProductUpdate(id: number, data: { product: any, imageBase64: string }) {
  const payload = {
    ...data.product,
    // On passe le nouveau base64 ou l'url existante
    imageBase64: data.imageBase64 
  };

  this.productService.updateProduct(id, payload).subscribe({
    next: (res) => {
      console.log('Product updated!', res);
      this.getAllProduct({}); // Rafraîchit la liste
    },
    error: (err) => console.error('Error updating product', err)
  });
}
onEditProduct(product: any) {
  this.isEditMode = true;
  this.showForm = true;
  this.currentProductId = product.id;
  
  // On pré-remplit le modèle avec les données existantes
  this.newProduct = { 
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category_id: product.category_id
  };
  
  // On ne remplit pas imageBase64 ici car l'image existe déjà sur le serveur
  this.imageBase64 = null; 
}

resetForm() {
  this.newProduct = { name: '', category_id: '', description: '', price: null, stock: null };
  this.imageBase64 = null;
  this.selectedFileName = '';
}
getAllProduct(payload:any){
    this.productService.getProducts(payload).subscribe({
    next: (res) => {
      console.log('Product all', res);
      this.products = res.data
     for (let index = 0; index < res.data.length; index++) {
       res.data[index].image_url = environment.apiUrl + res.data[index].image_url ;
      
     }
      this.showForm = false; // Fermer le form
      // ulaire
      //this.loadProducts();   // Rafraîchir votre liste de produits
    },
    error: (err) => console.error('Error adding product', err)
  });
}

getAllCategories() {
  // Remplacez par votre appel API vers Node.js
  this.productService.getAllCategories().subscribe({
    next: (res) => {
      console.log('categories all!', res);
      this.categories = res.data
      this.showForm = false; // Fermer le formulaire
      //this.loadProducts();   // Rafraîchir votre liste de produits
    },
    error: (err) => console.error('Error adding product', err)
  });
}
openProductDialog(productToEdit?: any) {
  const dialogRef = this.dialog.open(ProductFormDialogComponent, {
    width: '600px',
    data: {
      product: productToEdit, // Sera null en mode ajout
      categories: this.categories
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    // 'result' contient { product, imageBase64 } renvoyé par le bouton "Enregistrer" de la popup
    if (result) {
      if (productToEdit) {
        // Cas : MISE À JOUR
        this.executeProductUpdate(productToEdit.id, result);
      } else {
        // Cas : AJOUT
        this.executeProductAddition(result);
      }
    }
  });
}

  ngOnInit(): void {
    //this.products = productsDB.Product;
    this.getAllCategories();
    this.getAllProduct({});
    
  }
}
