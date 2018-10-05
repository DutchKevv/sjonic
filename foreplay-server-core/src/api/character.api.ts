import { Router } from 'express';
import { characterController } from '../controllers/character.controller';

const router = Router();

/**
 * single
 */
router.get('/:id', async (req: any, res, next) => {
	try {
		res.send(await characterController.findById(req.user, req.params.id, !!req.query.setActive));
	} catch (error) {
		next(error);
	}
});

/**
 * list
 */
router.get('/', async (req: any, res, next) => {
	try {
		res.send(await characterController.findByUserId(req.user));
	} catch (error) {
		next(error);
	}
});

/**
 * create
 */
router.post('/', async (req: any, res, next) => {
	try {
		console.log(req.user);
		res.send(await characterController.create(req.user, req.fields));
	} catch (error) {
		next(error)
	}
});

/**
 * update / set active
 */
router.put('/', async (req: any, res, next) => {
	try {
		res.send(await characterController.create(req.user, req.fields));
	} catch (error) {
		next(error)
	}
});

/**
 * update / set active
 */
router.delete('/:id', async (req: any, res, next) => {
	try {
		res.send(await characterController.create(req.user, req.params.id));
	} catch (error) {
		next(error)
	}
});

export = router;