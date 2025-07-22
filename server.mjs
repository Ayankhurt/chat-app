import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { userModel } from './model.mjs';
import authApi from './api/auth.mjs';
import messageApi from './api/message.mjs';
import { Server } from 'socket.io';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 5005;

const server = createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173", methods: ["*"], credentials: true } });

mongoose.connect(process.env.MONGODBURI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.log("MongoDB Connection Error:", err));

const SECRET = process.env.SECRET_TOKEN;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Unprotected Routes
app.use('/api/v1', authApi);

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    const token = req.cookies.Token;
    console.log('Token received:', token);

    if (!token) {
        console.log('No token provided');
        return res.status(401).send({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, SECRET, (err, decodedData) => {
        if (err) {
            console.log('Token verification error:', err.message);
            res.cookie('Token', '', { maxAge: 1, httpOnly: true });
            return res.status(401).send({ message: "Invalid or expired token" });
        }
        console.log('Decoded token:', decodedData);
        req.body.token = decodedData;
        next();
    });
};

// Protected Routes
const protectedRouter = express.Router();

protectedRouter.get('/profile', async (req, res) => {
    let queryUserId = req.query.user_id || req.body.token.id;

    try {
        let user = await userModel.findById(queryUserId, { password: 0 });
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        res.send({
            message: "User Found",
            user: {
                user_id: user._id,
                first_name: user.firstName,
                last_name: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        console.log("Error in /profile:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

protectedRouter.get('/users', async (req, res) => {
    try {
        const currentUserId = req.body.token?.id;
        if (!currentUserId) {
            console.log('No currentUserId found in token');
            return res.status(401).send({ message: "Unauthorized: Invalid token data" });
        }
        console.log('Current User ID:', currentUserId);
        let result = await userModel.find({ _id: { $ne: currentUserId } }, { password: 0 });
        console.log('Users found:', result);
        res.status(200).send({ message: "users found", users: result });
    } catch (error) {
        console.log("Error", error);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
    }
});

protectedRouter.use('/', messageApi(io));

app.use('/api/v1', authMiddleware, protectedRouter);

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on("disconnect", (reason) => {
        console.log("Client disconnected:", socket.id, "Reason:", reason);
    });
});

// Frontend Serving
const __dirname = path.resolve();
app.use('/', express.static(path.join(__dirname, './frontend/dist')));
app.use("/*splat", express.static(path.join(__dirname, './frontend/dist')));

// Server Listening
server.listen(PORT, () => {
    console.log(`Server is Running on port ${PORT}`);
});

// Mongoose Connection Events
mongoose.connection.on('connected', () => console.log("Mongoose is connected"));
mongoose.connection.on('disconnected', () => {
    console.log("Mongoose is disconnected");
    process.exit(1);
});
mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error: ', err);
    process.exit(1);
});