import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'product-form-dialog',
  templateUrl: './product-form-dialog.component.html',
  styleUrls: ['./product-form-dialog.component.scss']
})
export class ProductFormDialogComponent implements OnInit {
  newProduct = {
    name: '',
    category_id: '',
    description: '',
    price: null,
    stock: null
  };
  isEditMode = false;
  categories: any[] = [];
  showForm = false;
  imageBase64: string | null = null;
  selectedFileName: string = '';
  constructor(
    public dialogRef: MatDialogRef<ProductFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // Reçoit les données de la liste
  ) {}

  ngOnInit() {
    this.categories = this.data.categories;
    // Si on a reçu un produit, on passe en mode modification
    if (this.data.product) {
      this.isEditMode = true;
      this.newProduct = { ...this.data.product };
      this.imageBase64 = this.data.product.image_url;
    }
  }

  onFileSelected(event: any) {
    // Ton code FileReader / Canvas que tu as déjà écrit va ici
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

  onSave() {
    // On renvoie l'objet final au composant parent (la liste)
    this.dialogRef.close({
      product: this.newProduct,
      imageBase64: this.imageBase64
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}