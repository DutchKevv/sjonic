// import * as multer from 'multer';
import { Router } from 'express';
import { tileController } from '../controllers/tile.controller';

const router = Router();
// const upload = multer({ storage: multer.memoryStorage() });

/**
 * get all tiles 
 */
router.get('/', async (req, res, next) => {
    try {
        res.send(await tileController.getList());
    } catch (error) {
        next(error);
    }
});

/**
 * create tile with uploaded file
 */
router.post('/',  async (req: any, res, next) => {
    try {
        res.send(await tileController.create(req.user, req.file, req.body));
    } catch (error) {
        next(error);
    }
});

export = router;
