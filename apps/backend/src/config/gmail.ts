import { google } from 'googleapis'; 
import dotenv from 'dotenv'; 
dotenv.config(); 

console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET);
console.log('Google Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

const oauth2Client = new google.auth.OAuth2( process.env.GOOGLE_CLIENT_ID, 
process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI ); 
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN, }); 
export const gmail = google.gmail({ version: 'v1', auth: oauth2Client, });