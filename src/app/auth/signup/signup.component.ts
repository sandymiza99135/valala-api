import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification-service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'll-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  registerData = {
    name: '',
    email: '',
    password: '',
    passwordConfirmation: ''
  };
  
  termsAccepted = false;
  constructor(private http: HttpClient, private router: Router ,private notificationService : NotificationService)  { }

  ngOnInit(): void {
  }
  onRegister() {
    // 1. Validation des mots de passe
    if (this.registerData.password !== this.registerData.passwordConfirmation) {
      //this.toast('Les mots de passe ne sont pas identiques', 'error');
      return;
    }


    // 2. Appel Backend
    // Le backend attend { email, password, name }
    const body = {
      name: this.registerData.name,
      email: this.registerData.email,
      password: this.registerData.password
    };

    this.http.post<any>(`${environment.apiUrl}/api/auth/register`, body).subscribe({
      next: (res) => {
        console.log(res);
        
        if(res.status !="200" ){
          this.notificationService.error('Attention',res.message);
        }else {
           this.notificationService.success('Succès',res.message);
        }
       
      },
      error: (err) => {
        console.log(err);
        
        const errorMessage = err.error?.message || "Erreur lors de l'envoi du mail";
         this.notificationService.error('Attention',errorMessage )
        //this.toast(errorMessage, 'error');
      }
    });
  }

  // private toast(message: string, icon: 'success' | 'error') {
  //   Swal.fire({
  //     text: message,
  //     icon: icon,
  //     toast: true,
  //     position: 'top-end',
  //     showConfirmButton: false,
  //     timer: 3000
  //   });
  // }

}
