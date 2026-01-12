import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { menuList as staticMenuList } from '../../data/menus';
import { AuthService } from 'src/app/services/auth-service';
import { CartService } from 'src/app/services/card-service';

@Component({
  selector: 'll-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() topFixed: boolean;
  @Output() toggleSidenav = new EventEmitter();
  isScrolled: boolean;
  menuList = [
  
];
IsConnected : boolean = false;
openedMenu: string | null = null;
user : any
// navbar.component.ts
cartCount = 0;

  isLessThenLargeDevice;
  constructor( 
    private authService : AuthService,
    private breakpointObserver: BreakpointObserver,
    private cartService: CartService
  ) {
    this.cartService.loadCart()
    this.cartService.cart$.subscribe(items => {
    this.cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  });
  }

  ngOnInit(): void {
    this.menuList = staticMenuList;
    this.breakpointObserver.observe(['(max-width: 1199px)']).subscribe(({ matches }) => {
      this.isLessThenLargeDevice = matches;
    });
    this.IsConnected = this.authService.isLoggedIn();
    
    if (this.IsConnected) {
      this.user = this.authService.currentUserValue
    }
    console.log(this.user);
    
    
  }

  @HostListener('window:scroll', ['$event'])
  checkScroll() {
    this.isScrolled = window.pageYOffset > 15;
  }
  toggleMobileMenu(name: string) {
    this.openedMenu = this.openedMenu === name ? null : name;
  }
  onLogout(){
    this.authService.logout();
    this.cartService.loadCart();
    this.IsConnected = false;
  }
}
