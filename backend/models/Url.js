import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true
    },

    shortCode: {
        type: String,
        required: true,
        unique: true
    },

    clicks: {
        type: Number,
        default: 0
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    password: {
        type: String,
        default: null
    },

    expiresAt: {
        type: Date,
        default: null
    },

    // 🔥 CLEAN ANALYTICS STRUCTURE
    analytics: [
        {
            ip: {
                type: String
            },
            userAgent: {
                type: String
            },
            referer: {
                type: String
            },
            clickedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Url", urlSchema);