import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuccessPayementComponent } from './success/success-payment.component';
import { FailedPayementComponent } from './failed/failed-payment.component';

const routes: Routes = [
  {
    path: 'success',
    component: SuccessPayementComponent
  },
  // {
  //   path: 'failed',
  //   component: FailedPayementComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentRoutingModule {}
