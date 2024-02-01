import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema(
    {

    }
)

tweetSchema.plugin(mongooseAggregatePaginate);

export const tweet = mongoose.model("tweet",tweetSchema);