import { Router } from 'express';
import { fakeController } from '../controllers/fake.controller';

const router = Router();

/**
 * delete
 */
router.post('/users', async (req: any, res, next) => {
	try {
		res.send(await fakeController.addUsers(req.user, req.body.amount));
	} catch (error) {
		next(error)
	}
});

export = router;