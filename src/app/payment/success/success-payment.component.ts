import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from 'src/app/services/card-service';
import { ProductService } from 'src/app/services/product-service';

@Component({
  selector: 'success-payment',
  templateUrl: './success-payment.component.html',
  styleUrls: ['./success-payment.component.scss']
})
export class SuccessPayementComponent implements OnInit {
  transactionId: string | null = null;
  status: string | null = null;
  message : string |null = null;
  isSuccess : boolean = false;
  isRetry : boolean = true;
  buttonName="..."
  pollingInterval: any;
  private maxAttempts = 5; // 20 tentatives * 3 secondes = 60 secondes total
  private currentAttempt = 0;
 constructor(
    private router : Router,
    private route: ActivatedRoute,
    private paymentService : ProductService,
    private cartService: CartService // Injection du service
  ) {}

  // success-payment.component.ts
ngOnInit(): void {
  this.isSuccess = true;
  this.cartService.clearCart();
  // this.route.queryParamMap.subscribe(params => {
  //   const status = params.get('status');
  //   const txRef = params.get('tx_ref');
  //   this.checkStatus(txRef)
  //   // if (status === 'successful') {
  //   //   // ✅ = CAS SUCCÈS
  //   //   this.cartService.clearCart();
  //   //   this.message = "Merci ! Votre paiement a été validé.";
  //   //   this.isSuccess = true;
  //   // } else if (status === 'cancelled') {
  //   //   // ❌ CAS ANNULATION
  //   //   this.message = "Le paiement a été annulé.";
  //   //   this.isSuccess = false;
  //   // } else {
  //   //   // ⚠️ CAS ÉCHEC (failed)
  //   //   this.message = "Une erreur est survenue lors du paiement.";
  //   //   this.isSuccess = false;
  //   // }
  // });
}
checkStatus(tx_ref: string) {
    this.currentAttempt = 0; // Reset du compteur

    this.pollingInterval = setInterval(() => {
        this.currentAttempt++;

        // 1. Vérifier si on a dépassé le timeout
        if (this.currentAttempt >= this.maxAttempts) {
            this.stopPolling();
            // ❌ CAS ANNULATION
            this.message = "Le paiement a été annulé.";
            this.isSuccess = false;
            this.buttonName = "Reéssayer le paiement"
            this.isRetry = false;
            //this.status = 'TIMEOUT'; // Afficher un message : "Le paiement prend plus de temps que prévu..."
            return;
        }

        // 2. Appel au service
        this.paymentService.checkPaymentStatus(tx_ref).subscribe({
            next: (res) => {
                if (res.status === 'paid') {
                    this.stopPolling();
                    this.cartService.clearCart();
                    this.message = "Merci ! Votre paiement a été validé.";
                    this.isSuccess = true;
                    this.status = 'PAYMENT_CONFIRMED';
                }
            },
            error: (err) => {
                console.error("Erreur vérification", err);
                // Optionnel : on peut décider d'arrêter si l'API renvoie une erreur critique
            }
        });

    }, 3000);
}

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null; // On nettoie la variable
    }
  }

  // Sécurité : Si l'utilisateur quitte la page
  ngOnDestroy() {
    this.stopPolling();
  }
  returnToCart(){
    this.router.navigate(['product/inCart'])
  }
  returnToProduct(){
    this.cartService.clearCart();
    this.router.navigate(['product'])
  }
}


