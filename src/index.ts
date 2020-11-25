import express from 'express';
import indexRouter from './routes/index';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
