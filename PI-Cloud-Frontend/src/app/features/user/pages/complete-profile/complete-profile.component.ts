import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { AppToastService } from '../../../../services/app-toast.service';

@Component({
  selector: 'app-complete-profile',
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.scss'
})
export class CompleteProfileComponent implements OnInit {

  form!: FormGroup;
  role!: 'STUDENT' | 'DIETITIAN' | 'ADMIN' | 'RESTAURANT';
  loading = false;
  imgPreviewUrl: string | null = null;
  imgError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private apptoast: AppToastService
  ) {}

  ngOnInit(): void {
    const role = this.authService.getRoleFromToken();
    console.log('Role from token:', role);

    if (role === 'STUDENT' || role === 'DIETITIAN' || role === 'ADMIN' || role === 'RESTAURANT') {
      this.role = role as any;
    } else {
      console.warn('Unknown role from token');
    }

    console.log('Final role used:', this.role);

    this.form = this.fb.group({
      phoneNumber:   [''],
      street:        [''],
      city:          [''],
      postalCode:    [''],
      country:       [''],
      state:         [''],

      // Student fields
      height:        [null],
      weight:        [null],
      dob:           [null],
      activityLevel: [null],
      goal:          [null],
      studentImgFile:[null],

      // Dietitian fields
      specialization:    [''],
      certification:     [''],
      experienceYears:   [null],
      consultationPrice: [null],
      linkUrl:           [''],
      certificationFile: [null],
      imgFile:           [null],
    });
  }

  // RESTAURANT / ADMIN — file selected via input
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleAdminRestaurantFile(input.files[0]);
    }
  }

  // RESTAURANT / ADMIN — file dropped
  onAdminRestaurantDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.handleAdminRestaurantFile(file);
    }
  }

  private handleAdminRestaurantFile(file: File): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 3 * 1024 * 1024; // 3MB

    if (!allowedTypes.includes(file.type)) {
      this.imgError = 'Only JPG, PNG or WEBP files are allowed.';
      return;
    }
    if (file.size > maxSize) {
      this.imgError = 'File must be under 3MB.';
      return;
    }

    this.imgError = null;
    this.form.patchValue({ imgFile: file });

    const reader = new FileReader();
    reader.onload = () => {
      this.imgPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeAdminRestaurantFile(event: Event): void {
    event.stopPropagation();
    this.form.patchValue({ imgFile: null });
    this.imgPreviewUrl = null;
    this.imgError = null;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.apptoast.showError('Please fill all fields correctly');
      return;
    }

    this.loading = true;

    const formData = new FormData();
    formData.append('role',               this.role);
    formData.append('phoneNumber',        this.form.value.phoneNumber);
    formData.append('address.street',     this.form.value.street);
    formData.append('address.city',       this.form.value.city);
    formData.append('address.postalCode', this.form.value.postalCode);
    formData.append('address.country',    this.form.value.country);
    formData.append('address.state',      this.form.value.state);

    if (this.role === 'STUDENT') {

      formData.append('height',        this.form.value.height);
      formData.append('weight',        this.form.value.weight);
      formData.append('activityLevel', this.form.value.activityLevel);
      formData.append('goal',          this.form.value.goal);

      const image = this.form.value.studentImgFile;
      if (image) {
        formData.append('image', image);
      } else {
        console.warn('Student image missing');
      }

    } else if (this.role === 'DIETITIAN') {

      formData.append('specialization',    this.form.value.specialization);
      formData.append('experienceYears',   this.form.value.experienceYears);
      formData.append('consultationPrice', this.form.value.consultationPrice);
      formData.append('linkUrl',           this.form.value.linkUrl);

      const image = this.form.value.imgFile;
      const cert  = this.form.value.certificationFile;

      if (image) {
        formData.append('image', image);
      } else {
        console.warn('Dietitian image missing');
      }

      if (cert) {
        formData.append('certificate', cert);
      } else {
        console.warn('Certificate missing');
      }

    } else if (this.role === 'RESTAURANT' || this.role === 'ADMIN') {

      const image = this.form.value.imgFile;
      if (image) {
        formData.append('image', image);
      }
    }

    this.userService.completeProfile(formData).subscribe({

      next: () => {
        this.loading = false;

        if (this.role === 'STUDENT') {
          this.apptoast.showSuccess('Profile completed successfully');
          setTimeout(() => this.router.navigate(['/profile']), 1500);
        } else {
          this.apptoast.showSuccess('Profile submitted! Waiting for admin approval');
          setTimeout(() => this.router.navigate(['/profile']), 2000);
        }
      },

      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
        this.apptoast.showError('Something went wrong. Please try again.');
      }

    });
  }
}