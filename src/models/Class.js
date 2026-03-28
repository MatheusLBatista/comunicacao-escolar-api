import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Class {
    constructor() {
        const classSchema = new mongoose.Schema({
            active: {
                type: Boolean,
                default: true
            },
            school_id: {
                type: mongoose.Schema.Types.ObjectId,
                required:true,
            },
            name: {
                type: String,
                required: true
            },
            grade: {
                type:String,
                required:true
            },
            year: {
                type: Number,
                required: true
            },
            teacher_ids: [
                {type: mongoose.Schema.Types.ObjectId}
            ],
            metadata: {
                type: String,
            },
        }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

        classSchema.plugin(mongoosePaginate)
        this.model = mongoose.model('class', classSchema)
    }
}

export default new Class().model;