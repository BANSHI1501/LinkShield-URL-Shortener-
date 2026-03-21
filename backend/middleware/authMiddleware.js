import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const token = header.split(" ")[1]; // Bearer token
        const decoded = jwt.verify(token, "secretkey");

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

export const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        req.user = null;
        return next();
    }

    try {
        const token = header.split(" ")[1]; // Bearer token
        const decoded = jwt.verify(token, "secretkey");
        req.user = decoded;
    } catch (err) {
        req.user = null;
    }

    next();
};

export default authMiddleware;