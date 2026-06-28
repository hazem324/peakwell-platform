import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./layout/front-layout/front-layout.module')
        .then(m => m.FrontLayoutModule)
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./layout/back-layout/back-layout.module')
        .then(m => m.BackLayoutModule)
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module')
        .then(m => m.AuthModule)
  }, 
  {
    path:'user', 
    loadChildren: ()=> 
      import('./features/user/user.module')
         .then(m => m.UserModule)
   }
  ,
  {
    path: 'restaurant',
    loadChildren: () =>
      import('./features/restaurant/restaurant.module')
        .then(m => m.RestaurantModule)
  },
  {
    path: 'etudiant',
    loadChildren: () =>
      import('./features/etudiant/etudiant.module')
        .then(m => m.EtudiantModule)
  }
  ,
  {
    path: 'forum',
    loadChildren: () =>
      import('./features/forum/forum.module')
        .then(m => m.ForumModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
