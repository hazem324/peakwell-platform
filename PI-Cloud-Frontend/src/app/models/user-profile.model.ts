import { Address } from "./Address.model";
import { DietitianProfile } from "./dietitian-profile.model";
import { StudentProfile } from "./student-profile.model";

export interface UserProfile {
 id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileCompleted: boolean;

  enabled: boolean;           
  phoneNumber: string;        
  imageUrl: string;           
  address: Address;              

  studentProfile: StudentProfile | null;
  dietitianProfile: DietitianProfile | null;
}
