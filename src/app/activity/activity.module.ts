import { NgModule } from "@angular/core";
import { ActivityComponent } from "./activity.component";
import { CommonModule } from "@angular/common";
import { HttpClientJsonpModule } from "@angular/common/http";
import { ActivityRoutingModule } from "./activity-routing.module";
import { SharedModule } from "../shared/shared.module";

@NgModule({
  declarations: [ActivityComponent],
  imports: [CommonModule, SharedModule,ActivityRoutingModule,HttpClientJsonpModule]
})
export class ActivityModule {}