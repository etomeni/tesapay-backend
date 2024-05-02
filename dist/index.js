import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
// import usersRoutes from './routes/users.js';
// import apiV1Routes from './routes/api/apiv1.js';
// import adminRoutes from './routes/admin/admin.js';
import { get404, get500 } from './controllers/error.js';
const app = express();
app.use(helmet());
app.use(cors());
app.use(compression());
// const PORT = process.env.PORT || 5000;
const PORT = 5000;
app.use(fileUpload());
app.use(bodyParser.json());
// app.use(getSource);
// app.use('/api', apiV1Routes);
app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/users', usersRoutes);
// app.use('/api/admin', adminRoutes);
app.use('/api/v1/uploads', express.static('uploads'));
app.use(get404);
app.use(get500);
// app.get('/', (req, res) => {
//     res.send('Hello From Home page');
// })
const dbAccess = process.env.MONGO_DB_ACCESS_URI;
if (dbAccess) {
    mongoose.connect(dbAccess)
        .then((res) => {
        // console.log(res);
        app.listen(PORT, () => {
            console.log(`Server Running on port: http://localhost:${PORT}`);
        });
    })
        .catch((err) => console.log(err));
}
else {
    +app.listen(PORT, () => {
        console.log(`Server Running on port: http://localhost:${PORT}`);
    });
}
