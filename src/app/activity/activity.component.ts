import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../services/activity-serice';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit {
  activities : any[] = []
  filteredActivities: any[] = []; // Liste affichée dans le HTML
  filterSelected: string = 'tous';
  pagedActivities: any[] = []; // Ce qui est réellement affiché
  hostApi = environment.apiUrl + "/"
  // Paramètres de pagination
  currentPage: number = 1;
  pageSize: number = 3; // Nombre d'activités par page
  totalPages: number = 1;
  constructor(private activityService : ActivityService) { }

  ngOnInit(): void {
    this.getAllActivities();
  }
  totalItems: number = 0;
  searchTerm: string = '';
  statusFilter: string = '';

  getAllActivities() {
      // On passe les filtres au service
      this.activityService.getAllActivities(this.currentPage, 3, this.searchTerm, this.statusFilter).subscribe({
          next: (res) => {
              // 1. On récupère les métadonnées (pagination)
              this.totalItems = res.meta.totalItems;
              this.totalPages = res.meta.totalPages;
              // 2. On traite les données contenues dans res.data
              this.activities = res.data.map((act: any) => ({
                  ...act,
                  // On initialise avec la première image si elle existe, sinon null
                  selectedImage: act.images && act.images.length > 0 ? act.images[0] : 'assets/default-placeholder.png'
              }));
          },
          error: (err) => {
              console.error('Erreur lors de la récupération des activités', err);
          }
      });
  }
  setFilter(status: string) {
    this.statusFilter = status;
    if (status === 'tous') {
      this.statusFilter = "";
    } 
    this.currentPage = 1;
    this.getAllActivities();
  }

getPagesArray() {
  console.log("total pages ", this.totalPages);
  
  // Crée un tableau [1, 2, 3...] basé sur totalPages
  return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}

goToPage(page: number) {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page;
    this.getAllActivities(); // Rappel de l'API avec la nouvelle page
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Optionnel : remonte en haut
  }
}
}
