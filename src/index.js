const express = require('express');
const app = express();
const morgan = require('morgan');


/**
 * Imnporting routes
 */
const questionnaireRoutes = require('./routes/questionnaire');


/**
 * Settings
 */
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);

/**
 * Middlewares
 */
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

/**
 * Routes
 */
app.use('/api/questionnaire', questionnaireRoutes); 

app.listen(3000, () => {
    console.log(`Server runing on port ${app.get('port')}`);
});

