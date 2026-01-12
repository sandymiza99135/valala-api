import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'activity-form-dialog',
  templateUrl: './activity-form-dialog.component.html',
  styleUrls: ['./activity-form-dialog.component.scss']
})
export class ActivityFormDialogComponent implements OnInit {
  
  newActivity: any = {
    titre: "",
    description: "",
    date_activite: "", // Format YYYY-MM-DD
    lieu: "",
    statut:""
  };

  isEditMode = false;
  imagesBase64: string[] = []; // Tableau pour stocker plusieurs images
  user : any 
  constructor(
    public dialogRef: MatDialogRef<ActivityFormDialogComponent>,private authService : AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    // Si on est en mode édition, on pré-remplit les champs
    if (this.data && this.data.product) {
      this.isEditMode = true;
      // On clone l'objet pour ne pas modifier la liste originale avant validation
      this.newActivity = { ...this.data.product };
      
      // On s'assure que les images existantes sont chargées
      if (this.data.product.images) {
        this.imagesBase64 = [...this.data.product.images];
      }
    }
    this.user = this.authService.currentUserValue
    this.newActivity.user_id = this.user.id
  }

 onFileSelected(event: any) {
  const files: FileList = event.target.files;
  if (files && files.length > 0) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const fileType = file.type;

      reader.onload = (e: any) => {
        const img = new Image();
        img.src = e.target.result;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // 1. Définissez UNE SEULE taille cible (ex: 800)
          const targetSize = 800; 
          canvas.width = targetSize;
          canvas.height = targetSize;

          if (ctx) {
            // 2. Calcul du recadrage au centre (Crop)
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;
            
            // 3. On dessine sur TOUTE la surface du canvas (targetSize)
            // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

            const base64 = canvas.toDataURL(fileType, 0.8);
            this.imagesBase64.push(base64);
          }
        };
      };
      reader.readAsDataURL(file);
    });
  }
}

  // Permet de supprimer une image avant l'enregistrement
  removeImage(index: number) {
    this.imagesBase64.splice(index, 1);
  }

  onSave() {
    // On ferme le dialogue en renvoyant l'activité et le tableau d'images
    this.dialogRef.close({
      product: this.newActivity,
      images: this.imagesBase64
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}