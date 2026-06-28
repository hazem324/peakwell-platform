import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FrontLayoutComponent } from './front-layout.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { FrontLayoutRoutingModule } from './front-layout-routing.module';
import { HomeComponent } from './components/home/home.component';
import { FormsModule } from '@angular/forms';
import { HeroComponent } from './components/hero/hero.component';
import { PressStripComponent } from './components/press-strip/press-strip.component';
import { FeaturesComponent } from './components/features/features.component';
import { MealPlansComponent } from './components/meal-plans/meal-plans.component';
import { CalculatorComponent } from './components/calculator/calculator.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { BlogComponent } from './components/blog/blog.component';
import { NewsletterComponent } from './components/newsletter/newsletter.component';
import { SportEventComponent } from './components/sport-event/sport-event.component';
import { MyRegistrationsComponent } from './components/sport-event/my-registrations/my-registrations.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { EventLocationMapModalComponent } from './components/sport-event/event-location-map-modal/event-location-map-modal.component';
import { EventsMapComponent } from './components/sport-event/events-map/events-map.component';
import { UserModule } from '../../features/user/user.module';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { VideoCallComponent } from './components/video-call/video-call.component';
import { NutritionistSpaceComponent } from './components/nutritionist-space/nutritionist-space.component';
import { NutritionistHeatmapComponent } from './components/nutritionist-heatmap/nutritionist-heatmap.component';
import { NutritionistProfilesComponent } from './components/nutritionist-profiles/nutritionist-profiles.component';
import { NutritionistDossierComponent } from './components/nutritionist-dossier/nutritionist-dossier.component';
import { NutritionistClientsComponent } from './components/nutritionist-clients/nutritionist-clients.component';
import { NutritionistScheduleComponent } from './components/nutritionist-schedule/nutritionist-schedule.component';
import { NutritionistConsultationsComponent } from './components/nutritionist-consultations/nutritionist-consultations.component';
import { AboutComponent } from './components/about/about.component';
import { HttpClientModule } from '@angular/common/http';
import { NutritionistInsightsComponent } from './components/nutritionist-insights/nutritionist-insights.component';



@NgModule({
  declarations: [
    FrontLayoutComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    HeroComponent,
    PressStripComponent,
    FeaturesComponent,
    MealPlansComponent,
    CalculatorComponent,
    TestimonialsComponent,
    BlogComponent,
    NewsletterComponent,
    SportEventComponent,
    MyRegistrationsComponent,
    EventLocationMapModalComponent,
    EventsMapComponent,
    NotificationBellComponent,
    VideoCallComponent,
    NutritionistSpaceComponent,
    NutritionistHeatmapComponent,
    NutritionistProfilesComponent,
    NutritionistDossierComponent,
    NutritionistClientsComponent,
    NutritionistScheduleComponent,
    NutritionistConsultationsComponent,
    AboutComponent,
    NutritionistInsightsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FrontLayoutRoutingModule,
    FormsModule,
    LeafletModule,
    UserModule
],
exports: [
    HeaderComponent,
    FooterComponent,
    HttpClientModule,
]
})
export class FrontLayoutModule { }