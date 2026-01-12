import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  // Configuration de base pour un look cohérent avec votre thème "Valala"
  private baseConfig = {
    confirmButtonColor: '#e67e22', // Votre couleur orange
    cancelButtonColor: '#7f8c8d',
    heightAuto: false,
    customClass: {
      popup: 'rounded-24', // Classe CSS personnalisée
      confirmButton: 'px-4 py-2 rounded-12 font-bold'
    }
  };

  success(title: string, message: string) {
    return Swal.fire({
      ...this.baseConfig,
      icon: 'success',
      title: title,
      text: message,
    });
  }

  error(title: string, message: string) {
    console.log( 'error messagge ' , message);
    
    return Swal.fire({
      ...this.baseConfig,
      icon: 'error',
      title: title,
      text: message,
    });
  }

  // Pour les messages rapides qui disparaissent seuls (Toast)
  toast(message: string, icon: 'success' | 'error' | 'info' = 'success') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    return Toast.fire({
      icon: icon,
      title: message
    });
  }
}