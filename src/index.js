const express = require('express');
const cors = require('cors');
const app = express();
const morgan = require('morgan');

/**
 * Imnporting routes
 */
const questionnaireRoutes = require('./routes/questionnaire');
const ticInventoryRoutes = require('./routes/ticInventory');

/**
 * Settings
 */
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);

/**
 * Middlewares
 */
app.use(morgan('dev'));
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

/**
 * Routes
 */
app.use('/api/questionnaire', questionnaireRoutes); 
app.use('/api/ticinventory', ticInventoryRoutes);

app.listen(3000, () => {
    console.log(`Server runing on port ${app.get('port')}`);
});

