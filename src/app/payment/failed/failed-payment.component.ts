import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from 'src/app/services/card-service';

@Component({
  selector: 'failed-payment',
  templateUrl: './failed-payment.component.html',
  styleUrls: ['./failed-payment.component.scss']
})
export class FailedPayementComponent implements OnInit {
  transactionId: string | null = null;
  status: string | null = null;
 constructor(
    private route: ActivatedRoute,
    private cartService: CartService // Injection du service
  ) {}

  ngOnInit(): void {
    // 1. Lire les paramètres renvoyés par Flutterwave dans l'URL
    // this.route.queryParamMap.subscribe(params => {
    //   this.status = params.get('status');
    //   this.transactionId = params.get('transaction_id');

    //   // 2. Si le statut est "successful", on vide le panier
    //   if (this.status === 'successful') {
    //     this.cartService.clearCart();
    //     console.log('Paiement validé : Le panier a été vidé.');
    //   }
    // });
  }

}
