import { Component, OnInit } from '@angular/core';
import { menuList } from '../../data/menus';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'll-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {
  navList = [];

  isLessThenLargeDevice;
  IsConnected : boolean = false;
  constructor(private authService : AuthService, private breakpointObserver: BreakpointObserver,) { }
 openMenuName: string | null = null;

toggleMenu(menuName: string) {
  // Si on reclique sur le menu déjà ouvert, on le ferme, sinon on ouvre le nouveau
  this.openMenuName = this.openMenuName === menuName ? null : menuName;
}
  ngOnInit(): void {
    this.navList = menuList;

    this.breakpointObserver.observe(['(max-width: 1199px)']).subscribe(({ matches }) => {
      this.isLessThenLargeDevice = matches;
    });
    this.IsConnected = this.authService.isLoggedIn();
  }

}
