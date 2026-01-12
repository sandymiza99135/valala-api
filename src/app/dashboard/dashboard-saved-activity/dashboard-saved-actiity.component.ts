import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth-service';
import { ProductService } from 'src/app/services/product-service';
import { productsDB } from 'src/app/shared/data/products';
import { ProductFormDialogComponent } from '../popup/add-update-product/product-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { ActivityService } from 'src/app/services/activity-serice';
import { ActivityFormDialogComponent } from '../popup/add-update-activity/activity-form-dialog.component';

@Component({
  selector: 'dashboard-saved-activity',
  templateUrl: './dashboard-saved-activity.component.html',
  styleUrls: ['./dashboard-saved-activity.component.scss']
})
export class DashboardSavedActivityComponent implements OnInit {
  view = 'list';
  activities: any [] = []; 
  products;
  newActivity: any = {
    titre: "",
    description: "",
    date_activite: "", // Format YYYY-MM-DD
    lieu: "",
  };

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
    private productService : ProductService,
    private activityService : ActivityService
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
executeProductAddition(data: any) {
  const payload = {
    ...data.product,
    images: data.images
  };

  this.activityService.createActivity(payload).subscribe({
    next: (res) => {
      console.log('Product added!', res);
      this.getAllActivities(); // Rafraîchit la liste
    },
    error: (err) => console.error('Error adding product', err)
  });
}

// Logique pour l'update
executeProductUpdate(id: number, data:any) {
  const payload = {
    ...data.product,
    // On passe le nouveau base64 ou l'url existante
    images: data.images 
  };

  this.activityService.updateActivity(id, payload).subscribe({
    next: (res) => {
      console.log('Product updated!', res);
      this.getAllActivities(); // Rafraîchit la liste
    },
    error: (err) => console.error('Error updating product', err)
  });
}
onEditActivity(activity: any) {
  this.isEditMode = true;
  this.showForm = true;
  this.currentProductId = activity.id;
  
  // On pré-remplit le modèle avec les données existantes
  this.newActivity = {
    titre: activity.titre,
    description: activity.description,
    date_activite: activity.date_activite, // Format YYYY-MM-DD
    lieu: activity.lieu,
  };;
  
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

getAllActivities() {
  // Remplacez par votre appel API vers Node.js
  this.activityService.getAllActivities().subscribe({
    next: (res) => {
      console.log('categories all!', res);
      for (let index = 0; index < res.data.length; index++) {
        
       res.data[index].images= res.data[index].images.map((im:string) => environment.apiUrl+'/' + im)  ;
      
     }
      this.activities = res.data
      //sthis.showForm = false; // Fermer le formulaire
      //this.loadProducts();   // Rafraîchir votre liste de produits
    },
    error: (err) => console.error('Error adding product', err)
  });
}
openActivityDialog(productToEdit?: any) {
  const dialogRef = this.dialog.open(ActivityFormDialogComponent, {
    width: '600px',
    data: {
      product: productToEdit, // Sera null en mode ajout
      //categories: this.categories
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
        console.log(result);
        
        this.executeProductAddition(result);
      }
    }
  });
}

  ngOnInit(): void {
    //this.products = productsDB.Product;
    this.getAllActivities();
    //this.getAllProduct({});
    
  }
}
