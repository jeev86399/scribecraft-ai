import dotenv from 'dotenv';
dotenv.config();

import { humanizeTextService } from '../services/humanizerService.js';

async function run() {
  const text = "Internships offer students and recent graduates a valuable opportunity to gain hands-on experience in their chosen field, bridging the gap between theory and practice. Interns acquire valuable skills, develop their professional network and learn about industry practices thru practical experience on a range of projects. The experience not only beefs up their resumes but also helps them to grow and develop confidence to face the future career challenges. Internships allow people to discover their interests, sharpen their career goals, and develop plans to achieve their career aspirations.";
  console.log("Original text:");
  console.log(text);
  console.log("\nHumanizing...");
  const res = await humanizeTextService(text, 'natural');
  console.log("Result:");
  console.log(JSON.stringify(res, null, 2));
}
run().catch(console.error);
