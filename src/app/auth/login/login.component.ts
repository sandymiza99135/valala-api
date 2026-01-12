
import { HttpClient } from '@angular/common/http';
import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth-service';
import { NotificationService } from 'src/app/services/notification-service';
import { environment } from 'src/environments/environment';
// On déclare 'google' pour éviter les erreurs TypeScript
declare var google: any;
@Component({
  selector: 'll-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(
    private ngZone: NgZone,
    private http: HttpClient,
    private authService : AuthService,
    private router: Router,
    private route : ActivatedRoute,
    private notificationService : NotificationService
  ) { }
  email : string = ""
  password : string = ""
  ngOnInit(): void {
   this.route.queryParams.subscribe(params => {
      if (params['verified'] === 'true') {
        this.notificationService.success(
          'Compte vérifié !', 
          'Votre adresse email a été confirmée avec succès. Vous pouvez maintenant vous connecter.'
        );
        
        // Optionnel : Nettoyer l'URL pour enlever le paramètre après affichage
        // window.history.replaceState({}, document.title, "/" + this.route.snapshot.url.join('/'));
      }
    });
   setTimeout(() => {
      google.accounts.id.initialize({
        client_id: '96931574842-lov870nsgigetaop3oco6k825v2i028s.apps.googleusercontent.com',
        callback: (response: any) =>{
          console.log(response);
          
          this.handleLogin(response)
        } 
      });

      // Rendu du bouton officiel dans l'élément HTML 'googleBtn'
      google.accounts.id.renderButton(
        document.getElementById('googleBtn'),
        { theme: 'filled_blue', size: 'large', width: 250 }
      );
    }, 100);
    
    
  }
  handleLogin(response: any) {
    // Le token sécurisé (JWT) renvoyé par Google
    const idToken = response.credential;

    // NgZone.run est nécessaire pour que Angular détecte les changements
    // après le retour de l'API externe de Google
    this.ngZone.run(() => {
      this.http.post(`${environment.apiUrl}/api/auth/google`, { token: idToken })
        .subscribe({
          next: (res: any) => {
            if(res.status !="200" ){
              this.notificationService.error('Attention',res.message);
            }else {
              this.notificationService.success('Succès',res.message);
              this.authService.setSession(res.user,res.token)
              localStorage.setItem('token', res.token); // Sauvegarde du token de VOTRE backend
              this.router.navigate(['/']); 
            }
                // Redirection
          },
          error: (err) =>{
            console.error('Erreur login backend:', err)
            const errorMessage = err.error?.message || "Erreur lors de l'envoi du mail";
            this.notificationService.error('Attention',errorMessage )
          } 
        });
    });
  }
  login() {
      console.log({email:this.email,password :this.password});
      
      this.authService.loginUser({email:this.email,password :this.password})
        .subscribe({
          next: (res: any) => {
            if(res.status !="200" ){
              this.notificationService.error('Attention',res.message);
            }else {
              this.notificationService.success('Succès',res.message);
              this.authService.setSession(res.user,res.token)
              localStorage.setItem('token', res.token); // Sauvegarde du token de VOTRE backend
              this.router.navigate(['/']); 
            }    // Redirection
          },
          error: (err) => {
            console.error('Erreur login backend:', err)
            console.log(err);
        
            const errorMessage = err.error?.message || "Erreur lors de l'envoi du mail";
            this.notificationService.error('Attention',errorMessage )
          }
        });
   
  }
}
