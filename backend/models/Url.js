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
    ref: "User"
},
    password: {
        type: String,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    },
    analytics: {
        type: [
            {
                ip: String,
                userAgent: String,
                referer: String,
                clickedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Url", urlSchema);