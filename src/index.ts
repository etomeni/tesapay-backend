import express from 'express';
import helmet from 'helmet';
import compression from 'compression';

import fileUpload from 'express-fileupload';

import bodyParser from 'body-parser';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import mongoose from 'mongoose';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import verificationRoutes from './routes/verifications.js';
import vasRoutes from './routes/vas.js';
import waasRoutes from './routes/waas.js';
import voucherRoutes from './routes/voucher.js';

import { get404, get500 } from './controllers/error.js';

const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 15 minutes
	limit: 150, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	// standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	// legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
    validate: false,
    message: "Too many requests from this IP, please try again later",

})


const app = express();

// Apply the rate limiting middleware to all requests.
app.use(limiter);
app.use(helmet());
app.use(cors());
app.use(compression());

const PORT = process.env.PORT || 3000;
// const PORT = 5000;

app.use(fileUpload());
app.use(bodyParser.json());

// app.use(getSource);
// app.use('/api', apiV1Routes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/verifications', verificationRoutes);
app.use('/api/v1/vas', vasRoutes);
app.use('/api/v1/waas', waasRoutes);
app.use('/api/v1/voucher', voucherRoutes);
// app.use('/api/v1/users', usersRoutes);
// app.use('/api/admin', adminRoutes);
app.use('/api/v1/uploads', express.static('uploads'));

app.use(get404);
app.use(get500);

const dbAccess = process.env.MONGO_DB_ACCESS_URI;

if (dbAccess) {
    mongoose.connect(dbAccess)
    .then((res) => {
        // console.log(res);
        app.listen(PORT, () => {
            console.log(`Server Running on port: http://localhost:${PORT}`);
        })
    })
    .catch((err) => console.log(err));
    
} else {
    app.listen(PORT, () => {
        console.log(`Server Running on port: http://localhost:${PORT}`);
    })
}

