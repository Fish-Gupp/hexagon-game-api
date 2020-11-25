import express from 'express';

const router = express.Router();

router.get('/', function (req, res, next) {
  res.send('hello world! ' + req.session.id);
});

export default router;
