import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const token = header.split(" ")[1]; // Bearer token
        const decoded = jwt.verify(token, "secretkey");

        req.user = decoded; // user id mil gaya
        next();

    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

export default authMiddleware;