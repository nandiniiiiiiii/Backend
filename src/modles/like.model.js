import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
    video:{
        type: Schema.Types.ObjectId,
        ref: "video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "comment"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "tweet"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
})

likeSchema.plugin(mongooseAggregatePaginate);

export const like = mongoose.model("like",likeSchema);