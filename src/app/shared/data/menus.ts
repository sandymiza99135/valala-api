export interface Menu {
  path: string;
  name: string;
}

export const menuList: any[] = [
{
    name: 'Association',
    children: [
      { name: 'APropos', path: '/about' },
      { name: 'Objectif', path: '/ojectif' },
      { name: 'Activité', path: '/activity' },
      {
        name: 'Contact',
        path: '/contact'
      },
    ]
  },
  {
    name: 'Produits',
    children: [
      { name: 'Epice', path: '/products' },
      { name: 'Vanille', path: '/products' }
    ]
  }
  
];
