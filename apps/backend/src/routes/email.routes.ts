import { Router } from 'express';

import {
  syncEmails,
  getEmails,
} from '../controllers/email.controller';

const router = Router();

router.post('/sync', syncEmails);

router.get('/', getEmails);

export default router;
