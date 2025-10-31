export interface Member {
    id: string;                     // UUID or auto-increment ID
    email: string;
    displayName: string;
    passwordHash?: string;           // optional: 보안상 클라이언트에는 절대 노출 X
    avatarUrl?: string;
    role: 'user' | 'admin';
    bio?: string;                    // 간단한 소개 (옵션)
    location?: string;               // 지역 정보 (옵션)
    website?: string;                // 개인 웹사이트 (옵션)
    preferredGenres?: string[];      // 선호 장르
    createdAt: string;               // ISO Date
    updatedAt?: string;
}
