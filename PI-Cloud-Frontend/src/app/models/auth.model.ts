export interface SignupRequest {
  firstName: String;
  lastName: String;
  email: string;
  password: string;
  role: string;
}

export interface LoginRequest {

email: string;
password: string;

}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgetPasswordRequest {

email: string;

}