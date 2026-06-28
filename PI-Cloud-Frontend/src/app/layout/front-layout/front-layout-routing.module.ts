import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrontLayoutComponent } from './front-layout.component'
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component'
import { PaymentComponent } from './dossier/components/payment/payment.component';
import { VideoCallComponent } from './components/video-call/video-call.component';
import { NutritionistSpaceComponent } from './components/nutritionist-space/nutritionist-space.component';
import { NutritionistHeatmapComponent } from './components/nutritionist-heatmap/nutritionist-heatmap.component';
import { NutritionistProfilesComponent } from './components/nutritionist-profiles/nutritionist-profiles.component';
import { NutritionistDossierComponent } from './components/nutritionist-dossier/nutritionist-dossier.component';
import { NutritionistClientsComponent } from './components/nutritionist-clients/nutritionist-clients.component';
import { NutritionistScheduleComponent } from './components/nutritionist-schedule/nutritionist-schedule.component';
import { ProfileComponent } from '../../features/user/pages/profile/profile.component';

import { SportEventComponent } from './components/sport-event/sport-event.component';
import { MyRegistrationsComponent } from './components/sport-event/my-registrations/my-registrations.component';
import { EventsMapComponent } from './components/sport-event/events-map/events-map.component';
import { NutritionistConsultationsComponent } from './components/nutritionist-consultations/nutritionist-consultations.component';
import { NutritionistInsightsComponent } from './components/nutritionist-insights/nutritionist-insights.component';





const routes: Routes = [
  {   path: '' , component: FrontLayoutComponent , children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'events',
        component: SportEventComponent
      },
      { path: 'my-registrations', component: MyRegistrationsComponent },
      {
        path: 'events-map',
        component: EventsMapComponent

      }, 
      {
        path:'profile',
        component: ProfileComponent},
      
        {path: 'forum',
        loadChildren: () =>
          import('../../features/forum/forum.module')
            .then(m => m.ForumModule)
      },
      { path: 'video-call/:id', component: VideoCallComponent },
      { path: 'video-call', component: VideoCallComponent },
      { path: 'payment', component: PaymentComponent },
      { path: 'nutritionist',               component: NutritionistSpaceComponent },
      { path: 'nutritionist/heatmap',       component: NutritionistHeatmapComponent },
      { path: 'nutritionist/profiles',      component: NutritionistProfilesComponent },
      { path: 'nutritionist/clients',       component: NutritionistClientsComponent },
      { path: 'nutritionist/dossier/:id',   component: NutritionistDossierComponent },
      { path: 'nutritionist/schedule',      component: NutritionistScheduleComponent },
      { path: 'nutritionist/consultations', component: NutritionistConsultationsComponent },
      { path: 'nutritionist/insights',     component: NutritionistInsightsComponent },
      {
    path: 'dossier',
    loadChildren: () =>
      import('./dossier/dossier.module').then(m => m.DossierModule)
  }
    ] }

];


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class FrontLayoutRoutingModule { }
