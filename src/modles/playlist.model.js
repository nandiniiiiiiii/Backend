import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
    {

    }
)

playlistSchema.plugin(mongooseAggregatePaginate);

export const playlist = mongoose.model("playlist",playlistSchema);