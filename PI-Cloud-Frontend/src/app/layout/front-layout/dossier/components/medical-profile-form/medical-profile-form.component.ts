import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DossierService } from '../../services/dossier.service';
import { AuthService } from '../../../../../services/auth.service';
import { ToastServiceService } from '../../../../../services/toast-service.service';

@Component({
  selector: 'app-medical-profile-form',
  templateUrl: './medical-profile-form.component.html',
  styleUrls: ['./medical-profile-form.component.scss']
})
export class MedicalProfileFormComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  // Auto-populated from user account — not editable
  userInfo = { firstName: '', lastName: '', dateOfBirth: '', height: 0 };
  userInfoLoading = true;

  // Editable fields
  profile = {
    gender:           '' as any,
    bloodType:        '',
    allergies:        [] as string[],
    conditions:       [] as string[],
    medications:      [] as string[],
    emergencyContact: ''
  };

  submitted         = false;
  saving            = false;

  newAllergy        = '';
  newCondition      = '';
  newMedication     = '';
  allergyFocused    = false;
  conditionFocused  = false;
  medicationFocused = false;

  bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];

  readonly allergySuggestions = [
    'Gluten', 'Lactose', 'Milk', 'Eggs', 'Peanuts', 'Tree Nuts', 'Walnuts', 'Almonds',
    'Cashews', 'Shellfish', 'Shrimp', 'Fish', 'Soy', 'Wheat', 'Sesame', 'Mustard',
    'Strawberries', 'Avocado', 'Kiwi', 'Banana', 'Peach', 'Mango',
    'Penicillin', 'Amoxicillin', 'Aspirin', 'Ibuprofen', 'Sulfa Drugs', 'Codeine',
    'Bee Stings', 'Wasp Stings', 'Latex', 'Nickel',
    'Pollen', 'Dust Mites', 'Mold', 'Cat Dander', 'Dog Dander',
  ];

  readonly conditionSuggestions = [
    'Type 2 Diabetes', 'Type 1 Diabetes', 'Pre-Diabetes',
    'Hypertension', 'Hypotension', 'High Cholesterol', 'Triglyceridemia',
    'Hypothyroidism', 'Hyperthyroidism', 'Hashimoto\'s Disease', 'Graves\' Disease',
    'Obesity', 'Overweight', 'Metabolic Syndrome',
    'Heart Disease', 'Coronary Artery Disease', 'Heart Failure', 'Atrial Fibrillation',
    'Asthma', 'COPD', 'Sleep Apnea',
    'Anemia', 'Iron Deficiency Anemia', 'Vitamin B12 Deficiency', 'Vitamin D Deficiency',
    'Osteoporosis', 'Osteopenia', 'Gout', 'Arthritis', 'Rheumatoid Arthritis',
    'Celiac Disease', 'IBS', 'GERD', 'Crohn\'s Disease', 'Ulcerative Colitis',
    'PCOS', 'Endometriosis', 'NAFLD', 'Chronic Kidney Disease',
    'Depression', 'Anxiety', 'Bipolar Disorder',
    'Migraine', 'Epilepsy', 'Multiple Sclerosis',
    'Psoriasis', 'Eczema', 'Lupus',
    'Breast Cancer', 'Prostate Cancer', 'Colon Cancer',
  ];

  readonly medicationSuggestions = [
    'Metformin', 'Metformin XR', 'Insulin Glargine', 'Insulin Aspart', 'Insulin Lispro',
    'Empagliflozin', 'Sitagliptin', 'Liraglutide', 'Semaglutide',
    'Lisinopril', 'Enalapril', 'Ramipril', 'Amlodipine', 'Nifedipine',
    'Losartan', 'Valsartan', 'Irbesartan', 'Metoprolol', 'Bisoprolol',
    'Atorvastatin', 'Rosuvastatin', 'Simvastatin',
    'Levothyroxine', 'Carbimazole', 'Propylthiouracil',
    'Omeprazole', 'Pantoprazole', 'Esomeprazole', 'Ranitidine',
    'Aspirin', 'Clopidogrel', 'Warfarin', 'Rivaroxaban', 'Apixaban',
    'Furosemide', 'Hydrochlorothiazide', 'Spironolactone',
    'Ibuprofen', 'Paracetamol', 'Naproxen', 'Diclofenac', 'Celecoxib',
    'Prednisolone', 'Prednisone', 'Dexamethasone', 'Hydrocortisone',
    'Albuterol', 'Fluticasone', 'Montelukast', 'Budesonide',
    'Sertraline', 'Escitalopram', 'Fluoxetine', 'Venlafaxine', 'Duloxetine',
    'Alprazolam', 'Diazepam', 'Melatonin', 'Zolpidem',
    'Vitamin D3', 'Vitamin B12', 'Folic Acid', 'Iron Supplement',
    'Calcium Carbonate', 'Magnesium Glycinate', 'Omega-3', 'Zinc',
    'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline',
    'Allopurinol', 'Colchicine', 'Leflunomide', 'Hydroxychloroquine',
  ];

  constructor(
    private http:          HttpClient,
    private dossierService: DossierService,
    private authService:   AuthService,
    private toastService:  ToastServiceService
  ) {}

  ngOnInit(): void {
    // Pre-fill editable fields from existing profile
    const existing = this.dossierService.profile;
    if (existing) {
      this.profile.gender           = existing.gender           ?? '';
      this.profile.bloodType        = existing.bloodType        ?? '';
      this.profile.emergencyContact = existing.emergencyContact ?? '';
      this.profile.allergies        = [...(existing.allergies   ?? [])];
      this.profile.conditions       = [...(existing.conditions  ?? [])];
      this.profile.medications      = [...(existing.medications ?? [])];

      // Seed userInfo from the stored medical profile (most reliable source).
      // Use || so that an empty string '' is treated as falsy and doesn't block
      // overwriting with a real value from the API calls below.
      this.userInfo.firstName   = existing.firstName   || '';
      this.userInfo.lastName    = existing.lastName    || '';
      this.userInfo.dateOfBirth = existing.dateOfBirth || '';
      this.userInfo.height      = existing.height      || 0;
    }

    // Fetch from /auth/me first — User entity has firstName/lastName
    this.authService.fetchCurrentUser().subscribe(user => {
      if (user) {
        // Use || to replace empty strings too (not just null/undefined)
        this.userInfo.firstName = user.firstName || this.userInfo.firstName;
        this.userInfo.lastName  = user.lastName  || this.userInfo.lastName;
      }

      // Fetch student record for height; also try nested user object for name fallback
      const decoded = this.authService.decodeToken();
      const userId  = decoded?.id;
      if (userId) {
        this.http.get<any>('http://localhost:8090/peakwell/api/profile/by-student/${userId}').subscribe({
          next: s => {
            // Student entity has no firstName — try nested user object as last fallback
            const fn = s.firstName || s.user?.firstName;
            const ln = s.lastName  || s.user?.lastName;
            this.userInfo.firstName   = fn || this.userInfo.firstName;
            this.userInfo.lastName    = ln || this.userInfo.lastName;
            this.userInfo.dateOfBirth = s.dateOfBirth || this.userInfo.dateOfBirth;
            this.userInfo.height      = s.height      || this.userInfo.height;
            this.userInfoLoading = false;
          },
          error: () => { this.userInfoLoading = false; }
        });
      } else {
        this.userInfoLoading = false;
      }
    });
  }

  // ── Validation getters ───────────────────────────────────────────
  get genderInvalid(): boolean    { return this.submitted && !this.profile.gender; }
  get bloodTypeInvalid(): boolean { return this.submitted && !this.profile.bloodType; }
  get isFormValid(): boolean      { return !!this.profile.gender && !!this.profile.bloodType; }

  // ── Filtered suggestions ─────────────────────────────────────────
  get filteredAllergies(): string[] {
    const q = this.newAllergy.trim().toLowerCase();
    if (!q) return [];
    return this.allergySuggestions.filter(s =>
      s.toLowerCase().includes(q) && !this.profile.allergies.includes(s)
    ).slice(0, 8);
  }

  get filteredConditions(): string[] {
    const q = this.newCondition.trim().toLowerCase();
    if (!q) return [];
    return this.conditionSuggestions.filter(s =>
      s.toLowerCase().includes(q) && !this.profile.conditions.includes(s)
    ).slice(0, 8);
  }

  get filteredMedications(): string[] {
    const q = this.newMedication.trim().toLowerCase();
    if (!q) return [];
    return this.medicationSuggestions.filter(s =>
      s.toLowerCase().includes(q) && !this.profile.medications.includes(s)
    ).slice(0, 8);
  }

  // ── Add / Remove ──────────────────────────────────────────────────
  addAllergy(value = this.newAllergy): void {
    const v = value.trim();
    if (v && !this.profile.allergies.includes(v))
      this.profile.allergies = [...this.profile.allergies, v];
    this.newAllergy = '';
  }

  selectAllergy(s: string): void {
    this.addAllergy(s);
    setTimeout(() => this.allergyFocused = false, 0);
  }

  removeAllergy(i: number): void {
    this.profile.allergies = this.profile.allergies.filter((_, idx) => idx !== i);
  }

  addCondition(value = this.newCondition): void {
    const v = value.trim();
    if (v && !this.profile.conditions.includes(v))
      this.profile.conditions = [...this.profile.conditions, v];
    this.newCondition = '';
  }

  selectCondition(s: string): void {
    this.addCondition(s);
    setTimeout(() => this.conditionFocused = false, 0);
  }

  removeCondition(i: number): void {
    this.profile.conditions = this.profile.conditions.filter((_, idx) => idx !== i);
  }

  addMedication(value = this.newMedication): void {
    const v = value.trim();
    if (v && !this.profile.medications.includes(v))
      this.profile.medications = [...this.profile.medications, v];
    this.newMedication = '';
  }

  selectMedication(s: string): void {
    this.addMedication(s);
    setTimeout(() => this.medicationFocused = false, 0);
  }

  removeMedication(i: number): void {
    this.profile.medications = this.profile.medications.filter((_, idx) => idx !== i);
  }

  // ── Save ──────────────────────────────────────────────────────────
  save(): void {
    this.submitted = true;
    if (!this.isFormValid) {
      this.toastService.show('⚠️ Please fill in all required fields');
      return;
    }
    this.saving = true;
    const storedProfile = this.dossierService.profile;
    this.dossierService.saveProfile({
      firstName:        this.userInfo.firstName  || storedProfile?.firstName  || '',
      lastName:         this.userInfo.lastName   || storedProfile?.lastName   || '',
      dateOfBirth:      this.userInfo.dateOfBirth || storedProfile?.dateOfBirth || '',
      gender:           this.profile.gender,
      bloodType:        this.profile.bloodType,
      height:           this.userInfo.height || storedProfile?.height || 0,
      emergencyContact: this.profile.emergencyContact,
      allergies:        this.profile.allergies,
      conditions:       this.profile.conditions,
      medications:      this.profile.medications,
    }).subscribe({
      next: () => {
        this.toastService.show('✅ Medical profile saved! Now add your first measurement.');
        this.saving = false;
        this.saved.emit();
      },
      error: () => {
        this.toastService.show('❌ Failed to save profile. Is the backend running?');
        this.saving = false;
      }
    });
  }
}