import express from 'express';
import cswInfo from './routes/csw_info.js';
import cswEndpoints from './routes/csw_endpoints.js';
import cswRecords from './routes/csw_records.js';
import cswRecordById from './routes/csw_record_by_id.js';
import translate from './routes/translate.js';


const app = express();
const port = 3000;

// add routes
app.use(cswInfo);
app.use(cswEndpoints);
app.use(cswRecords);
app.use(cswRecordById);
app.use(translate);

// add public folder as static folder
app.use(express.static('public'));

// start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
