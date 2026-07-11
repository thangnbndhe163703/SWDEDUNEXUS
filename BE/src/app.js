const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => res.json({ message: 'Welcome to EduNexus API' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: 'mysql' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
