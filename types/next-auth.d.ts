import {UserRole} from '@/shared'
import {District} from "@/model/District";

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            roles: UserRole[],
            district?: District | null
        }
    }

    interface User {
        id: string
        email: string
        name: string
        roles: UserRole[],
        district?: District | null
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: UserRole
        userId: string
        roles?: string[]
    }
}
