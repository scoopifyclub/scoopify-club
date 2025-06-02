import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';
import { compare } from 'bcryptjs';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: {
                        employee: true,
                        businessPartner: true
                    }
                });

                if (!user) {
                    throw new Error('No user found with this email');
                }

                const isValid = await compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error('Invalid password');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    employeeId: user.employee?.id,
                    businessPartnerId: user.businessPartner?.id
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.employeeId = user.employeeId;
                token.businessPartnerId = user.businessPartnerId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role;
                session.user.employeeId = token.employeeId;
                session.user.businessPartnerId = token.businessPartnerId;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
}; 