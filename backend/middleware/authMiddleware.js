import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        // Don't require auth - just continue without user
        req.user = null;
        return next();
    }

    try {
        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, "secretkey");
        req.user = decoded;
        next();
    } catch (err) {
        // Invalid token but don't fail - continue without user
        req.user = null;
        next();
    }
};

export default authMiddleware;