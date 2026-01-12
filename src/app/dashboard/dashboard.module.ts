import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatMenuModule } from '@angular/material/menu';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { DashboardIndexComponent } from './dashboard-index/dashboard-index.component';
import { SharedModule } from '../shared/shared.module';
import { DashboardSavedItemComponent } from './dashboard-saved-item/dashboard-saved-item.component';
import { DashboardProfileComponent } from './dashboard-profile/dashboard-profile.component';
import { DashboardOrderComponent } from './dashboard-order/dashboard-order.component';
import { FormsModule } from '@angular/forms';
import { StatCardComponent } from './stat-card/stat-card.component';
import { ProductFormDialogComponent } from './popup/add-update-product/product-form-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { DashboardSavedActivityComponent } from './dashboard-saved-activity/dashboard-saved-actiity.component';
import { ActivityFormDialogComponent } from './popup/add-update-activity/activity-form-dialog.component';

@NgModule({
  declarations: [
    DashboardLayoutComponent,
    DashboardIndexComponent,
    DashboardSavedItemComponent,
    DashboardProfileComponent,
    StatCardComponent,
    DashboardOrderComponent,
    DashboardSavedActivityComponent,
    ProductFormDialogComponent
,ActivityFormDialogComponent  ],
  imports: [CommonModule, DashboardRoutingModule, SharedModule, MatMenuModule,FormsModule,MatDialogModule]
})
export class DashboardModule {}
