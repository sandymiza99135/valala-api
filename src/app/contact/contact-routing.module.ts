import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactComponent } from './contact.component';

const routes: Routes = [
  {
    path: '',
    component: ContactComponent,
    data: { 
      hero: { 
        badge : "Contactez Nous",
        title: '<span>Notre contact </span>', 
        subtitle: "Si vous voulez connaitre d'avantage a propos de l' association" 
      } 
    }

  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactRoutingModule {}
