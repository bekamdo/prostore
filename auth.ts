import NextAuth from "next-auth";
import {PrismaAdapter} from "@auth/prisma-adapter";
import {prisma} from "@/db/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import { adapter } from "next/dist/server/web/adapter";
import { compareSync } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";

export const config ={
    pages:{
        signIn:"/sign-in",
        error:"/sign-in"
    },
    session:{
        strategy:'jwt',
        maxAge: 60 * 60 * 24 * 30,

    },
    adapter:PrismaAdapter(prisma),
    providers:[
        CredentialsProvider({
            credentials:{
                email:{type:'email'},
                password:{type:'password'}

            },
            async authorize(credentials){
                if(credentials == null) return null;
                const user = await prisma.user.findFirst({
                    where:{
                        email:credentials.email as string
                    }
                });

                //check if the user exists and if the password matches

                if(user && user.password){
                    const isMatch = compareSync(credentials.password as string,user.password);
                    //if password is correct we want to return the user

                    if(isMatch){
                        return{
                            id:user.id,
                            name:user.name,
                            email: user.email,
                            role:user.role

                        }
                    }
                }
                //if user does not exist or password does not match return null

                return null;


            }
        })
    ],
    callbacks:{
        async session({ session, user, trigger,token }:any) {
            //set the userId from the token
            session.user.id = token.sub;
            //if there is an update,set the username
            if(trigger === "update"){
                session.user.name = user.name;
            }
            return session
          },
    }

}  satisfies NextAuthConfig;

export const {handlers,auth,signIn,signOut} = NextAuth(config);