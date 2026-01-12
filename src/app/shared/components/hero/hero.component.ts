import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-hero-dynamic',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroDynamicComponent implements OnInit {
  heroTitle: SafeHtml = '';
  heroSubtitle: SafeHtml = '';
  showHero: boolean = false;
  heroBadge: any;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      // 1. On attend la fin de la navigation
      filter(event => event instanceof NavigationEnd),
      // 2. On déclenche aussi au chargement initial
      startWith(null)
    ).subscribe(() => {
      // 3. On récupère la route active la plus profonde (l'enfant)
      let route = this.activatedRoute.root;
      while (route.firstChild) {
        route = route.firstChild;
      }

      // 4. On extrait les données hero de cette route précise
      const data = route.snapshot.data;
      this.updateHero(data['hero']);
    });
  }

  private updateHero(hero: any) {
    console.log("hero actuelle : ",hero);
    
    if (hero) {
      this.showHero = true;
      this.heroBadge = hero.badge || '';
      this.heroTitle = this.sanitizer.bypassSecurityTrustHtml(hero.title);
      this.heroSubtitle = this.sanitizer.bypassSecurityTrustHtml(hero.subtitle);
      console.log();
      
    } else {
      this.showHero = false;
    }
  }
}