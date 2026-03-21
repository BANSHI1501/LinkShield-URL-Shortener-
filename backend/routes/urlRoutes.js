import express from "express";
import { nanoid } from "nanoid";
import Url from "../models/Url.js";
import authMiddleware, { optionalAuth } from "../middleware/authMiddleware.js";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";

const router = express.Router();

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");


// ✅ 1. MY URLS
router.get("/my-urls", authMiddleware, async (req, res) => {
    console.log("MY URLS HIT");

    const urls = await Url.find({ userId: req.user.id });
    res.json(urls);
});


// ✅ 2. ANALYTICS
router.get("/analytics", optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        
        let urls;
        if (userId) {
            urls = await Url.find({ userId });
        } else {
            urls = await Url.find({}).limit(100);
        }

        const totalUrls = urls.length;
        let totalClicks = 0;

        urls.forEach(url => {
            totalClicks += url.clicks;
        });

        res.json({
            totalUrls,
            totalClicks,
            urls
        });

    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});


// ✅ 3. SHORTEN
router.post("/shorten", authMiddleware, async (req, res) => {
    try {
        const { originalUrl, password, customShortCode, expiresAt } = req.body;

        let shortCode = customShortCode?.trim() || nanoid(6);

        if (customShortCode) {
            const shortCodePattern = /^[a-zA-Z0-9_-]{3,20}$/;
            if (!shortCodePattern.test(shortCode)) {
                return res.status(400).json({
                    error: "Custom URL must be 3-20 chars and only contain letters, numbers, _ or -"
                });
            }

            const existing = await Url.findOne({ shortCode });
            if (existing) {
                return res.status(409).json({ error: "Custom short URL already in use" });
            }
        }

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        let parsedExpiry = null;
        if (expiresAt) {
            const expiryDate = new Date(expiresAt);
            if (Number.isNaN(expiryDate.getTime())) {
                return res.status(400).json({ error: "Invalid expiry date" });
            }
            if (expiryDate <= new Date()) {
                return res.status(400).json({ error: "Expiry date must be in the future" });
            }
            parsedExpiry = expiryDate;
        }

        const newUrl = new Url({
            originalUrl,
            shortCode,
            userId: req.user.id,
            password: hashedPassword,
            expiresAt: parsedExpiry
        });

        await newUrl.save();

        const configuredBaseUrl = process.env.SHORTENER_BASE_URL?.trim();
        const requestBaseUrl = `${req.protocol}://${req.get("host")}`;
        const shortBaseUrl = configuredBaseUrl
            ? trimTrailingSlash(configuredBaseUrl)
            : trimTrailingSlash(requestBaseUrl);
        const shortUrl = `${shortBaseUrl}/${shortCode}`;
        const qrCode = await QRCode.toDataURL(shortUrl);

        res.json({
            shortUrl,
            shortCode,
            expiresAt: parsedExpiry,
            qrCode
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ error: "Short code already exists, try another one" });
        }
        res.status(500).json({ error: "Server Error" });
    }
});


router.get("/analytics/top", authMiddleware, async (req, res) => {
    try {
        const topUrl = await Url.findOne({ userId: req.user.id })
            .sort({ clicks: -1 });

        res.json(topUrl);

    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});
router.get("/analytics/last7days", optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        
        let urls;
        if (userId) {
            urls = await Url.find({ userId });
        } else {
            urls = await Url.find({}).limit(100);
        }

        const last7Days = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            const day = date.toISOString().split("T")[0];

            let count = 0;

            urls.forEach(url => {
                url.analytics.forEach(a => {
                    const clickDate = new Date(a.clickedAt).toISOString().split("T")[0];
                    if (clickDate === day) {
                        count++;
                    }
                });
            });

            last7Days.push({ date: day, clicks: count });
        }

        res.json(last7Days);

    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});
router.get("/analytics/:shortCode", authMiddleware, async (req, res) => {
    try {
        const url = await Url.findOne({
            shortCode: req.params.shortCode,
            userId: req.user.id
        });

        if (!url) {
            return res.status(404).json({ error: "URL not found" });
        }

        res.json({
            shortCode: url.shortCode,
            totalClicks: url.clicks,
            analytics: url.analytics
        });

    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

// ❗ LAST (MOST IMPORTANT)
router.get("/:shortCode", async (req, res) => {
    console.log("SHORTCODE HIT:", req.params.shortCode);

    const url = await Url.findOne({ shortCode: req.params.shortCode });

    if (!url) {
        return res.status(404).json({ error: "Short URL not found" });
    }

    if (url.expiresAt && new Date(url.expiresAt) <= new Date()) {
        return res.status(410).json({ error: "This short URL has expired" });
    }

    // 🔐 PASSWORD CHECK
    if (url.password) {
        const userPassword = req.query.password;

        if (!userPassword) {
            return res.status(401).json({ error: "Password required" });
        }

        const isMatch = await bcrypt.compare(userPassword, url.password);

        if (!isMatch) {
            return res.status(403).json({ error: "Wrong password" });
        }
    }

    url.clicks++;
    await url.save();

    res.redirect(url.originalUrl);
});

export default router;