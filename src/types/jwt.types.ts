export interface jwtPayloadAccessToken {
  id: string;
  email: string;
  role: string;
}

export interface jwtPayloadRefershToken {
  id: string;
  email: string;
}
