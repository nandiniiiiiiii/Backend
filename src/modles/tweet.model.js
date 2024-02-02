import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema({
    content: {
        type: String,
        require: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }
},{timestamps:true})

tweetSchema.plugin(mongooseAggregatePaginate);

export const tweet = mongoose.model("tweet",tweetSchema);