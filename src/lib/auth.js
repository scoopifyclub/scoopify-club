import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import prisma from './prisma';
import { compare } from 'bcryptjs';
import crypto from 'crypto';

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
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
        async signIn({ user, account, profile }) {
            // Handle Google OAuth sign-in
            if (account?.provider === 'google') {
                try {
                    // Check if user already exists
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email }
                    });

                    if (!existingUser) {
                        // Create new user from Google OAuth
                        const newUser = await prisma.user.create({
                            data: {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                role: 'CUSTOMER', // Default role for OAuth users
                                emailVerified: new Date(),
                                image: user.image,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }
                        });

                        // Create customer profile for OAuth users
                        await prisma.customer.create({
                            data: {
                                id: crypto.randomUUID(),
                                userId: newUser.id,
                                phone: null,
                                gateCode: null,
                                serviceDay: null,
                                referralCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }
                        });

                        return true;
                    }

                    // Update existing user's Google info
                    await prisma.user.update({
                        where: { email: user.email },
                        data: {
                            name: user.name,
                            image: user.image,
                            emailVerified: new Date(),
                            updatedAt: new Date()
                        }
                    });

                    return true;
                } catch (error) {
                    console.error('Error handling Google OAuth sign-in:', error);
                    return false;
                }
            }

            return true;
        },
        async jwt({ token, user, account }) {
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