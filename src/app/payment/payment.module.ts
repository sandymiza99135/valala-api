import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgParticlesModule } from 'ng-particles';
import { PaymentRoutingModule } from './payment-routing.module';
import { SuccessPayementComponent } from './success/success-payment.component';
import { PayementComponent } from './payment.component';
import { FailedPayementComponent } from './failed/failed-payment.component';

@NgModule({
  declarations: [SuccessPayementComponent,PayementComponent],
  imports: [CommonModule, PaymentRoutingModule, NgParticlesModule]
})
export class PaymentModule {}
