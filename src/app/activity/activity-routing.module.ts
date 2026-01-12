import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivityComponent } from './activity.component';

const routes: Routes = [
  {
    path: '',
    component: ActivityComponent,
    data: { 
      hero: { 
        badge : "Découvrez notre impact",
        title: '<span>Nos Activités & Événements</span>', 
        subtitle: "Explorez nos actions réalisées, nos événements à venir et l'engagement de notre association sur le terrain." 
      } 
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActivityRoutingModule {}