import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import emailRoutes from './routes/email.routes';
import draftRoutes from './routes/draft.routes';

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use('/emails', emailRoutes);

app.use('/drafts', draftRoutes);

app.get('/', (_, res) => {
  res.send('AI Email Agent Running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});