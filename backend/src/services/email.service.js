import nodemailer from "nodemailer";
import "../config/env.js";
import { fail } from "../services/auth.service.js";
export function mailTransport() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)
    throw fail(503, "Email delivery is not configured.");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
}
export async function sendCode(email, code, purpose) {
  const action =
    purpose === "verify" ? "verify your email" : "reset your password";
  await mailTransport().sendMail({
    from: `RAJO Threads <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `RAJO Threads — ${purpose === "verify" ? "verify your email" : "password reset"}`,
    text: `Your code to ${action} is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
  });
}
