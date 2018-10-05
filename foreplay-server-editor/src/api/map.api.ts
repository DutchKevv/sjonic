import { Router } from 'express';
import { mapController } from '../controllers/map.controller';

const router = Router();

/**
 * get single 
 */
router.get('/:id', async (req: any, res, next) => {
    try {
        res.send(await mapController.getById(req.user, req.params.id));
    } catch (error) {
        next(error);
    }
    
});

/**
 * get list 
 */
router.get('/', async (req: any, res, next) => {
    try {
        res.send(await mapController.getList(req.user));
    } catch (error) {
        next(error);
    }
});

/**
 * create
 */
router.post('/', async (req: any, res, next) => {
    try {
        res.send(await mapController.create(req.user, req.fields));
    } catch (error) {
        next(error);
    }
});

/**
 * update
 */
router.put('/:id', async (req:any , res, next) => {
    try {
        res.send(await mapController.save(req.user, req.params.id, req.fields));
    } catch (error) {
        next(error);
    }
});

/**
 * remove
 */
router.delete('/:id', async (req: any, res, next) => {
    try {
        res.send(await mapController.remove(req.user, req.params.id));
    } catch (error) {
        next(error);
    }
});

export = router;