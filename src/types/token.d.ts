type Token = {
    accessToken: string;
    refreshToken: string;
}

type JwtAccountPayload = {
    id: number;
    role: {
        id: number;
        name: string;
        code: string
        permissions: string[];
    };
}