import express from 'express';
import session from 'express-session';
import indexRouter from './routes/index';

const port = process.env.PORT || 3001;

const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    resave: false,
    secret: 'hexagon is the bestagon',
  })
);

app.use('/', indexRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
