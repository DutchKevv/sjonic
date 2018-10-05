import { Router } from 'express';
import { objectController } from '../controllers/object.controller';
import * as formidable from 'formidable';
const router = Router();

// /**
//  * list
//  */
// router.get('/', async (req: any, res, next) => {
// 	try {
// 		res.send(await objectController.create(req.user, req.query));
// 	} catch (error) {
// 		next(error)
// 	}
// });

// /**
//  * single
//  */
// router.get('/:id', async (req: any, res, next) => {
// 	try {
// 		res.send(await objectController.create(req.user, req.params.id));
// 	} catch (error) {
// 		next(error)
// 	}
// });

/**
 * create
 */
router.post('/', async (req: any, res, next) => {
	try {
		res.send(await objectController.create(req.user, req.files.image, req.fields));
	} catch (error) {
		next(error)
	}
});

/**
 * update
 */
router.put('/:id', async (req: any, res, next) => {
	try {
		res.send(await objectController.update(req.user, req.params.id, req.fields.image, req.fields));
	} catch (error) {
		next(error)
	}
});

// /**
//  * delete
//  */
// router.delete('/:id', async (req: any, res, next) => {
// 	try {
// 		res.send(await objectController.create(req.user, req.fields.amount));
// 	} catch (error) {
// 		next(error)
// 	}
// });

export = router;