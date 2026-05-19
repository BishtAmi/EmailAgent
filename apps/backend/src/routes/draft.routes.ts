import { Router } from 'express';

import { approveDraft }
from '../controllers/draft.controller';

const router = Router();

router.post('/:id/approve', approveDraft);

export default router;