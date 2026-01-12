import { Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { StripeCardElementOptions, StripeElementsOptions } from "@stripe/stripe-js";
import { StripeCardComponent, StripePaymentElementComponent, StripeService } from "ngx-stripe";
import { Observable } from "rxjs";
import { AuthService } from "src/app/services/auth-service";
import { CartService } from "src/app/services/card-service";
import { ProductService } from "src/app/services/product-service";
@Component({
  selector: 'cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartItems$: Observable<any[]>;
  subtotal: number = 0;
  products : any []  = []
  totalAmount: number = 50.00; // Exemple de montant

@ViewChild(StripeCardComponent) paymentElement: StripeCardComponent;

  elementsOptions: StripeElementsOptions = {
    locale: 'fr'
  };
  cardOptions: StripeCardElementOptions = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSize: '16px',
    }
  }
};
  constructor(private stripeService: StripeService,private authService : AuthService,private cartService: CartService ,private produitService : ProductService ,private router : Router ) {
    this.cartService.loadCart();
    this.cartItems$ = this.cartService.cart$;
    console.log(this.cartItems$);
    
  }
  ngAfterViewInit() {
    //this.renderPaypalButton();
  }
  pay() {
    const name = this.authService.currentUserValue?.name || 'Client';
    
    this.stripeService.createToken(this.paymentElement.element, { name }).subscribe((result) => {
      if (result.token) {
        console.log(result);
        
        // 1. Envoyer result.token.id à votre backend
        this.confirmPaymentOnBackend(result.token.id);
      } else if (result.error) {
        console.error(result.error.message);
      }
    });
  }
  private confirmPaymentOnBackend(tokenId: string) {
    const user = this.authService.currentUserValue
    const paymentData = {

      token :tokenId,
      amount: this.subtotal,
      user: { email: user.email, name: user.name  },
      items: this.products
    };
    this.produitService.createpaymentStripe(paymentData).subscribe({
      next: (res) => {
        console.log(res);
        this.produitService.checkPaypalPaymentStripeStatus(res.id).subscribe({
          next: (res) => {
            console.log(res);
            if (res.success) {
              this.router.navigate(["/success"],{ 
                state: { paymentConfirmed: true, orderId: res.orderId } 
              })
            }
          },
          error: (err) => console.error(err)
        });
        //window.location.href = "/success"
      },
      error: (err) => console.error(err)
    });
  }

  // ... vos méthodes updateQty et remove

  ngOnInit() {
    //console.log(this.cartItems$);
    
    this.cartItems$.subscribe(items => {
      //console.log(items);
      this.products = items
      this.subtotal = this.cartService.getTotalPrice();
    });
    //this.paymentsClient = new google.payments.api.PaymentsClient({environment: 'TEST'});
    //this.renderGooglePayButton();
  }
  
   updateQty(id: number, change: number) {
    this.cartService.updateQuantity(id, change);
  }

  remove(id: number) {
    this.cartService.removeFromCart(id);
  }
 
  payWithStripe() {

    const user = this.authService.currentUserValue
    const paymentData = {
      amount: this.subtotal,
      user: { email: user.email, name: user.name  },
      items: this.products
    };

    this.produitService.createpaymentStripe(paymentData).subscribe({
      next: (response: any) => {
        // Le backend nous répond avec un lien et une référence
        // response.data.authorization_url est le lien de paiement généré par Paystack
        console.log(response);
        
        // if (response.status === "success") {
        //   // REDIRECTION vers la page de paiement Paystack
        //   window.location.href = response.data.link;
        // }

        //window.location.href = "/success";
      },
      error: (err) => {
        window.location.href = "/success";
        console.error("Erreur d'initialisation", err);
      }
    });
  }
}


//   merchantCode: string = 'VOTRE_CODE_MARCHAND';
//   paymentDataRequest = {
//   apiVersion: 2,
//   apiVersionMinor: 0,
//   allowedPaymentMethods: [
//     {
//       type: 'CARD',
//       parameters: {
//         allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
//         allowedCardNetworks: ['VISA', 'MASTERCARD']
//       },
//       tokenizationSpecification: {
//         type: 'PAYMENT_GATEWAY',
//         parameters: {
//           'gateway': 'flutterwave',
//           'gatewayMerchantId': 'FLWPUBK_TEST-fed09adc96c383957413b2aed6e5dcf9-X' // Vérifiez bien le -X final !
//         }
//       }
//     }
//   ],
//   merchantInfo: {
//     merchantName: 'RAKOTONINDRINA'
//   },
//   transactionInfo: {
//     totalPriceStatus: 'FINAL',
//     totalPriceLabel: 'Total',
//     totalPrice: String(this.subtotal), // Conversion explicite en string
//     currencyCode: 'USD',               // Utilisez USD pour le test initial
//     countryCode: 'US'                  // Utilisez US pour le test initial
//   }
// };
  
  // renderPaypalButton(){
  //   paypal.Buttons({

  //     // 🔹 Création du paiement
  //     createOrder: async () => {
  //       const user = this.authService.currentUserValue
  //       const paymentData = {
  //         amount: this.subtotal,
  //         user: { email: user.email, name: user.name  },
  //         items: this.products
  //       };
  //       return this.produitService
  //           .createpaymentPaypal(paymentData)
  //           .toPromise()
  //           .then(res =>{
  //             console.log("res order ",res);
              
  //             return res.id
  //           } ).catch(err => console.log(err)
  //           );
  //             },

  //     onApprove: (data: any) => {
  //       console.log("data avant : ",data);
        
  //         return this.produitService
  //           .checkPaypalPaymentStatus(data.paypalOrderId)
  //           .toPromise()
  //           .then(result => {
  //             console.log('Paiement confirmé', result);
  //           });
  //       },

  //       onError: (err: any) => {
  //         console.error('Erreur PayPal', err);
  //       }


  //   }).render('#paypal-button');
  // }

// async setupGooglePay() {
//   try {
//     // Si getPaymentMethods n'existe pas, on tente de créer le composant directement
//     // car dans certaines versions, la vérification de disponibilité est interne à 'create'
//    const paypalButton = this.jsPaymentClient.components.create('paypal', {
//         style: {
//           layout: 'vertical',
//           color:  'gold',
//           shape:  'rect',
//           label:  'paypal'
//         },
//         // Détails de la transaction
//         totalPrice: this.totalAmount.toString(),
//         currency: 'EUR'
//       });
    

//     // On vérifie si le composant a pu être créé
//     if (paypalButton) {
//       paypalButton.mount('#google-pay-button');
      
//       paypalButton.on('success', (result: any) => {
//         console.log("Token reçu :", result.token);
//       });
//     }
//   } catch (error) {
//     console.error("Le composant Google Pay n'est pas supporté par cette version du script", error);
//   }
// }
//   async initTwoPay() {
//   try {
//     const Lib = (window as any).TwoPayClient;

//     if (!Lib) {
//       console.error("Librairie introuvable");
//       return;
//     }

//     // VOICI LA CORRECTION : 
//     // Au lieu de : this.jsPaymentClient = new Lib(...);
//     // Fais ceci :
//     this.jsPaymentClient = new Lib(this.merchantCode);
    
//     console.log("Client initialisé avec la bonne classe !");
//     await this.setupGooglePay();

//   } catch (error) {
//     // Si Lib.jsPaymentClient n'existe pas, on tente une autre structure interne

//     console.log(error);
    
//     console.error("Erreur, tentative de secours...");
//     this.jsPaymentClient = new (window as any).TwoPay.jsPaymentClient(this.merchantCode);
//   }
// }
//   onLoadPaymentData() {
//      this.paymentDataRequest.transactionInfo.totalPrice = String(this.subtotal)
//     console.log(this.paymentDataRequest);
   
//     this.paymentsClient.loadPaymentData(this.paymentDataRequest)
//       .then((paymentData: any) => {
//         // Envoi au backend Node.js
//         console.log(paymentData);

//         const token = paymentData.paymentMethodData.tokenizationData.token;

//       // 2. Construction du corps de la requête pour votre Node.js
      
//         const user = this.authService.currentUserValue
//         const body = {
//           currency: 'EUR',
//           token: token,
//           amount: this.subtotal,
//           user: { email: user.email, name: user.name  },
//           items: this.products
//         };

//         this.produitService.createpaymentGpay(body).subscribe(res => {
//         console.log(res);
        
//         if (res.status === 'success') {
//           // Redirection vers l'URL de paiement Flutterwave sécurisée
//           window.location.href = res.data.link;
//         }
//   });

        
//       })
//       .catch((err: any) => console.error(err));
//   }
//   renderGooglePayButton() {
//     const button = this.paymentsClient.createButton({
//       onClick: () => this.onLoadPaymentData(),
//       buttonColor: 'black',
//       buttonType: 'buy'
//     });
//     console.log(button);
    
//     document.getElementById('containerbutton')?.appendChild(button);
    
//     console.log(document.getElementById('containerbutton'));
    
//   }
  

 
  

// payWithPaystack() {
//  const email = 'client@valala.mg'; // À récupérer dynamiquement
//   const amount = this.subtotal;

//   // APPEL À L'API BACKEND
//   this.produitService.initializePayment(email, amount).subscribe({
//     next: (response: any) => {
//       // Le backend nous répond avec un lien et une référence
//       // response.data.authorization_url est le lien de paiement généré par Paystack
      
//       if (response.status === true) {
//         // REDIRECTION vers la page de paiement Paystack
//         window.location.href = response.data.authorization_url;
//       }
//     },
//     error: (err) => {
//       console.error("Erreur d'initialisation", err);
//     }
//   });
// }