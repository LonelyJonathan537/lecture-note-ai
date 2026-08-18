const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage
});

router.post("/", upload.array("files"), (req, res) => {

    try {

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: "No files uploaded"
            });
        }

        const files = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype
        }));

        res.json({
            success: true,
            files
        });

    } catch (error) {

        console.error("Upload error:", error);

        res.status(500).json({
            error: "File upload failed"
        });
    }
});

module.exports = router;