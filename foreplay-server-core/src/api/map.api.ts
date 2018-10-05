import { Router } from 'express';
import { mapController } from '../controllers/map.controller';

const router = Router();

/**
 * single
 */
router.get('/:game/:id', async (req: any, res, next) => {

});

/**
 * list
 */
router.get('/:game', async (req: any, res, next) => {
	try {
		res.send(await mapController.getList(req.userm, req.params.game));
	} catch (error) {
		next(error);
	}
});

export = router;