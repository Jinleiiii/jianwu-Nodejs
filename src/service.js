const { InputError, AccessError } = require('./error');
const multer = require('multer')
const path = require('path')
const sharp = require('sharp')
var { JWT_SECRET_KEY } = require('../config/wxappConfig')
const jwt = require('jsonwebtoken');
const { log } = require('util');

const catchErrors = fn => async (req, res) => {
    try {
        await fn(req, res);
    } catch (err) {
        if (err instanceof InputError) {
            res.status(400).send({ error: err.message, });
        } else if (err instanceof AccessError) {
            res.status(403).send({ error: err.message, });
        } else {
            console.log(err);
            res.status(500).send({ error: 'A system error ocurred', });
        }
    }
};

let fullPath = path.join(__dirname, '../public/attachment')
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, fullPath)
    },
    filename: (req, file, cb) => {
        const filename = `${Date.now()}-${file.originalname}`
        cb(null, filename)
    }
})

let upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
            cb(null, true);
        } else {
            cb(new Error("Only .jpg and .png files are allowed!"), false);
        }
    },
}).array('photos', 5);

const uploadImages = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File size exceeds the limit allowed.' });
            } else {
                return res.status(500).json({ error: err.message });
            }
        } else if (err) {
            return res.status(500).json({ error: err.message });
        }
        next();
    })
}

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader.substring(6)
    // 如果没有token
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        req.user = decoded;
        next();
    } catch (ex) {
        if (ex.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Token expired.' });
        } else {
            res.status(400).json({ message: 'Invalid token.' });
        }
    }
};


module.exports = { catchErrors, uploadImages, verifyToken }