import { betterAuth } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/vendors/nodemailer";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Block credential sign-in until the email is verified.
    // (Social logins are already verified by their provider.)
    requireEmailVerification: true,
  },
  emailVerification: {
    // Send a verification link when a new account is created…
    sendOnSignUp: true,
    // …and re-send it if an unverified user tries to sign in.
    sendOnSignIn: true,
    // Sign the user in automatically once they click the link.
    autoSignInAfterVerification: true,
    // Link validity (seconds).
    expiresIn: 60 * 60, // 1 hour
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Hi${user.name ? ` ${user.name}` : ""},

Confirm your email address to finish setting up your account:

${url}

This link expires in 1 hour. If you didn't create an account, you can ignore this email.`,
        html: `<p>Hi${user.name ? ` ${user.name}` : ""},</p>
<p>Confirm your email address to finish setting up your account:</p>
<p><a href="${url}">Verify my email</a></p>
<p>This link expires in 1 hour. If you didn't create an account, you can ignore this email.</p>`,
      });
    },
  },
  socialProviders: {
    // ─── Configure only the providers you want to use ───────────────────────
    // For each provider, fill in the corresponding env vars in your .env file.
    // Remove or comment out any provider you do not need.
    // ────────────────────────────────────────────────────────────────────────
    // apple: {
    //   clientId: process.env.APPLE_CLIENT_ID as string,
    //   clientSecret: process.env.APPLE_CLIENT_SECRET as string,
    // },
    // discord: {
    //   clientId: process.env.DISCORD_CLIENT_ID as string,
    //   clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    // },
    // dropbox: {
    //   clientId: process.env.DROPBOX_CLIENT_ID as string,
    //   clientSecret: process.env.DROPBOX_CLIENT_SECRET as string,
    // },
    // facebook: {
    //   clientId: process.env.FACEBOOK_CLIENT_ID as string,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    // },
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID as string,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    // },
    // gitlab: {
    //   clientId: process.env.GITLAB_CLIENT_ID as string,
    //   clientSecret: process.env.GITLAB_CLIENT_SECRET as string,
    // },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    // linkedin: {
    //   clientId: process.env.LINKEDIN_CLIENT_ID as string,
    //   clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
    // },
    // microsoft: {
    //   clientId: process.env.MICROSOFT_CLIENT_ID as string,
    //   clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    // },
    // reddit: {
    //   clientId: process.env.REDDIT_CLIENT_ID as string,
    //   clientSecret: process.env.REDDIT_CLIENT_SECRET as string,
    // },
    // roblox: {
    //   clientId: process.env.ROBLOX_CLIENT_ID as string,
    //   clientSecret: process.env.ROBLOX_CLIENT_SECRET as string,
    // },
    // spotify: {
    //   clientId: process.env.SPOTIFY_CLIENT_ID as string,
    //   clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
    // },
    // tiktok: {
    //   // TikTok uses `clientKey` instead of `clientId`
    //   clientKey: process.env.TIKTOK_CLIENT_KEY as string,
    //   clientSecret: process.env.TIKTOK_CLIENT_SECRET as string,
    // },
    // twitch: {
    //   clientId: process.env.TWITCH_CLIENT_ID as string,
    //   clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
    // },
    // twitter: {
    //   clientId: process.env.TWITTER_CLIENT_ID as string,
    //   clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
    // },
  },
  plugins: [admin(), username()],
});

export type { Session, User } from "better-auth";
