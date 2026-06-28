import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { UserProfile } from '../../../../models/user-profile.model';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {

  profile!: UserProfile;
  role!: 'STUDENT' | 'DIETITIAN' | 'ADMIN' | 'RESTAURANT';

  form!: FormGroup;
  editMode = false;
  loading = false;

  showPasswordModal = false;   

  // ── File upload state ──────────────────────────
  photoFile: File | null = null;
  photoPreview: string | null = null;
  photoError = '';

  certFile: File | null = null;
  certError = '';

  activityMap: Record<string, string> = {
    LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High'
  };

  goalMap: Record<string, string> = {
    LOSE_WEIGHT: 'Lose weight',
    GAIN_WEIGHT: 'Gain weight',
    MAINTAIN:    'Maintain weight'
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.getUserProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.role = profile.role as 'STUDENT' | 'DIETITIAN' | 'ADMIN' | 'RESTAURANT';
        this.initForm();
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  initForm(): void {
    const s = this.profile?.studentProfile;
    const d = this.profile?.dietitianProfile;

    this.form = this.fb.group({
      phoneNumber: [this.profile?.phoneNumber || ''],
      street:      [this.profile?.address?.street || ''],
      city:        [this.profile?.address?.city || ''],
      postalCode:  [this.profile?.address?.postalCode || ''],
      country:     [this.profile?.address?.country || ''],
      state:       [this.profile?.address?.state || ''],

      // Student
      height:        [s?.height        || null],
      weight:        [s?.weight        || null],
      activityLevel: [s?.activityLevel || null],
      goal:          [s?.goal          || null],

      // Dietitian
      specialization:    [d?.specialization    || null],
      experienceYears:   [d?.experienceYears   || null],
      consultationPrice: [d?.consultationPrice || null],
      linkUrl:           [d?.linkUrl           || null],

      // Files
      imgFile:  [null],
      certFile: [null],
    });

    this.photoFile    = null;
    this.photoPreview = null;
    this.certFile     = null;
    this.photoError   = '';
    this.certError    = '';
  }

  private sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    profileCompleted: user.profileCompleted,
    enabled: user.enabled,
    phoneNumber: user.phoneNumber,
    imageUrl: user.imageUrl,
    address: user.address
  };
}


  // ── Computed ──────────────────────────────────
  get initials(): string {
    const f = this.profile?.firstName?.[0] || '';
    const l = this.profile?.lastName?.[0] || '';
    return (f + l).toUpperCase();
  }

  get currentPhotoUrl(): string | null {
    return this.photoPreview || this.profile?.imageUrl || null;
  }

  get activityLabel(): string {
    return this.activityMap[this.profile?.studentProfile?.activityLevel || ''] || '—';
  }

  get goalLabel(): string {
    return this.goalMap[this.profile?.studentProfile?.goal || ''] || '—';
  }

  // ── Photo upload ──────────────────────────────
  onPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handlePhoto(input.files[0]);
  }

  onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.handlePhoto(file);
  }

  handlePhoto(file: File): void {
    this.photoError = '';
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.photoError = 'Only JPG, PNG or WEBP files are allowed.';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.photoError = 'Photo must be smaller than 3MB.';
      return;
    }
    this.photoFile = file;
    this.form.patchValue({ imgFile: file });

    const reader = new FileReader();
    reader.onload = (e) => this.photoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  removePhoto(event: MouseEvent): void {
    event.stopPropagation();
    this.photoFile    = null;
    this.photoPreview = null;
    this.photoError   = '';
    this.form.patchValue({ imgFile: null });
  }

  // ── Certificate upload ────────────────────────
  onCertChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handleCert(input.files[0]);
  }

  onCertDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.handleCert(file);
  }

  handleCert(file: File): void {
    this.certError = '';
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.certError = 'Only PDF, JPG or PNG files are allowed.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.certError = 'File must be smaller than 5MB.';
      return;
    }
    this.certFile = file;
    this.form.patchValue({ certFile: file });
  }

  removeCert(event: MouseEvent): void {
    event.stopPropagation();
    this.certFile  = null;
    this.certError = '';
    this.form.patchValue({ certFile: null });
  }

  // ── Edit mode
  enableEdit(): void { this.editMode = true; }

  cancelEdit(): void {
    this.editMode = false;
    this.initForm();
  }

  // ── Save 
  saveProfile(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const fd = new FormData();

    // Contact fields (shared for all roles)
    if (this.form.value.phoneNumber)
      fd.append('phoneNumber',        this.form.value.phoneNumber);
    if (this.form.value.street)
      fd.append('address.street',     this.form.value.street);
    if (this.form.value.city)
      fd.append('address.city',       this.form.value.city);
    if (this.form.value.postalCode)
      fd.append('address.postalCode', this.form.value.postalCode);
    if (this.form.value.country)
      fd.append('address.country',    this.form.value.country);
    if (this.form.value.state)
      fd.append('address.state',      this.form.value.state);

    if (this.role === 'STUDENT') {

      if (this.form.value.height != null)
        fd.append('height',        this.form.value.height);
      if (this.form.value.weight != null)
        fd.append('weight',        this.form.value.weight);
      if (this.form.value.activityLevel)
        fd.append('activityLevel', this.form.value.activityLevel);
      if (this.form.value.goal)
        fd.append('goal',          this.form.value.goal);
      if (this.form.value.imgFile)
        fd.append('image',         this.form.value.imgFile);

    } else if (this.role === 'DIETITIAN') {

      if (this.form.value.specialization)
        fd.append('specialization',    this.form.value.specialization);
      if (this.form.value.experienceYears != null)
        fd.append('experienceYears',   this.form.value.experienceYears);
      if (this.form.value.consultationPrice != null)
        fd.append('consultationPrice', this.form.value.consultationPrice);
      if (this.form.value.linkUrl)
        fd.append('linkUrl',           this.form.value.linkUrl);
      if (this.form.value.imgFile)
        fd.append('image',             this.form.value.imgFile);
      if (this.form.value.certFile)
        fd.append('certificate',       this.form.value.certFile);

    } else if (this.role === 'RESTAURANT' || this.role === 'ADMIN') {

      if (this.form.value.imgFile)
        fd.append('image', this.form.value.imgFile);
    }

    this.userService.updateUserProfile(fd).subscribe({

      next: (updatedProfile) => {
        console.log('UPDATED PROFILE:', updatedProfile);

        this.profile  = updatedProfile;
        

      //  sanitize before storing
       const user = this.sanitizeUser(updatedProfile);
       localStorage.setItem('user', JSON.stringify(user));
        this.initForm();
        this.loading  = false;
        this.editMode = false;
      },

      error: (err) => {
        console.error('UPDATE ERROR:', err);
        this.loading = false;
      }

    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024)            return bytes + ' B';
    if (bytes < 1024 * 1024)     return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  resetPassword(): void {
    this.showPasswordModal = true;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }
}